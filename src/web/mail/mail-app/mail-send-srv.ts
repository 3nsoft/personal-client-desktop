/*
 Copyright (C) 2016 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. */

import * as Constants from "../../common/services/const-srv";
import * as Transform from "../../common/services/transform";
import { NamedProcs } from "../../common/services/processes";
import * as CacheSrvMod from "../../common/services/cache-srv";
import * as NotificationsSrvMod from "../../common/notifications/notifications-srv";
import * as MailAppSrvMod from "./mail-app-srv";

export let ModulName = "3nweb.services.mail-send-srv";
export let MailSendSrvName = "mailSendService";

export function addService(angular: angular.IAngularStatic): void {
  let mod = angular.module(ModulName, []);
  mod.service(MailSendSrvName, Srv);
}

export class Srv {
  fs: web3n.storage.FS = null;
  private initializing: Promise<void> = null;
  private sendProcs = new NamedProcs();

  static $inject = ["$rootScope", "$state", "$stateParams", "$q", "$timeout", "$mdDialog", "$mdToast", CacheSrvMod.CacheSrvName, NotificationsSrvMod.NotificationsSrvName, MailAppSrvMod.MailAppSrvName];
  constructor(
    private $rootScope: angular.IRootScopeService,
    private $state: angular.ui.IStateService,
    private $stateParams: angular.ui.IStateParamsService,
    private $q: angular.IQService,
    private $timeout: angular.ITimeoutService,
    private $mdDialog: angular.material.IDialogService,
    private $mdToast: angular.material.IToastService,
    private cacheSrv: CacheSrvMod.Cache,
    private notificationsSrv: NotificationsSrvMod.Srv,
    private mailAppSrv: MailAppSrvMod.Srv
  ) {
    this.initializing = w3n.storage.getAppLocalFS("computer.3nweb.mail").then((fs) => { this.fs = fs; this.initializing = null; });
  }

  /**
   * функция отправки сообщения
   * @param content {client3N.MessageJSON}
   * @param attached {web3n.files.File[]}
   * @param isDirty? {boolean}
   * @returns {Promise<void>}
   */
  async runSendMessage(content: client3N.MessageJSON, attached: web3n.files.File[], isDirty?: boolean): Promise<void> {
    if (this.initializing) { await this.initializing; }
    // новое сообщение записываем в папку OUTBOX,
    // сообщение из папки DRAFT перемещаем в папку OUTBOX
    let sMsg: client3N.MessageJSON = null;
    sMsg = content;
    let isMsgNew = (content.msgId === "new") ? true : false;
    if (isMsgNew) {
      await this.mailAppSrv.writeMsgData(content, attached, Constants.SYS_MAIL_FOLDERS.outbox);
    } else {
      if (isDirty) {
        await this.mailAppSrv.writeMsgData(content, attached, Constants.SYS_MAIL_FOLDERS.draft);
      }
      await this.mailAppSrv.moveMessageInsideFS(sMsg.msgKey, false, Constants.SYS_MAIL_FOLDERS.outbox);
    }
    this.sendProcs.start(sMsg.msgId, async () => {
      // преобразуем сообщение в формат для отправки
      let prepareData = await this.prepareMsgToSend(sMsg);
      await w3n.mail.delivery.addMsg(prepareData.recipients, prepareData.msgToSend, prepareData.msgToSend.msgId);
      let sendResult = await w3n.mail.delivery.completionOf(prepareData.msgToSend.msgId);
      // console.log(`Result of sending ${prepareData.msgToSend.msgId}`);
      console.log(JSON.stringify(sendResult, null, 3));
      sMsg.timeCr = (new Date()).getTime();

      await this.reWriteMsg(sMsg);

      // проверяем есть ли ошибки при отправке
      let sendErrors = this.checkOnErrors(sendResult);

      if (sendErrors.status === "success") {
        if (sendResult.allDone) {
          // await this.mailAppSrv.moveMessageInsideFS(sMsg.msgKey, false, Constants.SYS_MAIL_FOLDERS.sent);
          this.successMsg(sMsg.msgKey);
        }
      } else {
        let targetFolderId = (sendErrors.recipientsQt === sendErrors.errors.length) ? Constants.SYS_MAIL_FOLDERS.draft : Constants.SYS_MAIL_FOLDERS.sent;
        await w3n.mail.delivery.rmMsg(sMsg.msgId);
        // пометка что mailAddress с ошибкой
        this.markIncorrectAddress(sMsg, sendErrors.errors);
        // вывод сообщения об ошибке и добавление сообщения в notifications service
        this.errorMsg(sMsg.msgKey, targetFolderId, sendErrors);
      }

    });

  };

  /**
   * преобразование сообщения в формат для отправки
   * @param inMsg {client3N.MessageJSON}
   * @returns {msgToSend: web3n.asmail.OutgoingMessage, recipients: string[]}
   */
  private async prepareMsgToSend(inMsg: client3N.MessageJSON): Promise<{msgToSend: web3n.asmail.OutgoingMessage, recipients: string[]}> {
    let msgToSend = Transform.newOutgoingMessage();
    let allRecipients: string[] = [];

    for (let item of inMsg.mailAddressTO) {
      if (allRecipients.indexOf(item) === -1) { allRecipients.push(item); }
    }
    for (let item of inMsg.mailAddressCC) {
      if (allRecipients.indexOf(item) === -1) { allRecipients.push(item); }
    }
    for (let item of inMsg.mailAddressBC) {
      if (allRecipients.indexOf(item) === -1) { allRecipients.push(item); }
    }

    msgToSend = {
      msgId: inMsg.msgId,
      recipients: inMsg.mailAddressTO,
      carbonCopy: inMsg.mailAddressCC,
      subject: inMsg.subject,
      htmlTxtBody: inMsg.bodyHTML,
      plainTxtBody: inMsg.bodyTxt
    };

    let attachmentsPath: string = "";
    if (inMsg.attached.length > 0) {
      attachmentsPath = `${Constants.SYS_MAIL_FOLDERS.outbox}/${inMsg.msgKey}/attachments`;
      msgToSend.attachmentsFS = await this.fs.readonlySubRoot(attachmentsPath);
    }

    return {msgToSend: msgToSend, recipients: allRecipients};
  };

  /**
   * отображение процесса отправки выбранного сообщения
   * @param msgId {string} - id отправляемого сообщения
   * @returns {Promise<void>}
   */
  async showProgress(msgId: string): Promise<void>  {
    let cbId = await w3n.mail.delivery.registerProgressCB(msgId, (progress: web3n.asmail.DeliveryProgress): void => {
      let totalSize =  progress.msgSize * Object.keys(progress.recipients).length;
      let alreadySentSize = 0;
      for (let recipient of Object.keys(progress.recipients)) {
        alreadySentSize += progress.recipients[recipient].bytesSent;
      }
      let currentProgress = alreadySentSize / totalSize * 100;
      console.log(`Delivery progress ${msgId}: ${Transform.round(currentProgress, -2)} or ${Transform.round(currentProgress, -2)}%`);
      this.$timeout(() => {
        this.cacheSrv.messages.sendStatus = currentProgress;
      });
    });
    this.cacheSrv.messages.progeessCbId = angular.copy(cbId);
  };


  /**
   * отмена отправки сообщения
   * @param msgId {string}
   */
  async cancelSendMessage(msgId: string): Promise<void> {
    await w3n.mail.delivery.rmMsg(msgId, true);
    let msgKey = `out=${msgId}`;
    let sendingProc = this.sendProcs.getP(msgId);
    if (sendingProc) {
      await sendingProc;
      await this.mailAppSrv.moveMessageInsideFS(msgKey, false,
        Constants.SYS_MAIL_FOLDERS.draft);
    }
  };

  /**
   * обновление данных сообщения
   * (перезапись в ту же папку без изменения собержимого attachments)
   * @param msg {client3N.MessageJSON}
   * @returns Promise<void>
   */
  private async reWriteMsg(msg: client3N.MessageJSON): Promise<void> {
    if (this.initializing) { await this.initializing; }

    let fldrId = this.cacheSrv.messages.list[msg.msgId].folderId;
    let filePath = `${fldrId}/${msg.msgKey}/main.json`
    await this.fs.writeJSONFile(filePath, msg);

    let msgMapping = Transform.msgJsonToMapping(msg, fldrId);
    msgMapping.timeCr = msg.timeCr;
    msgMapping.labels = angular.copy(this.cacheSrv.messages.list[msg.msgId].labels);
    msgMapping.isRead = angular.copy(this.cacheSrv.messages.list[msg.msgId].isRead);
    msgMapping.isReply = angular.copy(this.cacheSrv.messages.list[msg.msgId].isReply);
    msgMapping.isSendError = angular.copy(this.cacheSrv.messages.list[msg.msgId].isSendError);

    this.cacheSrv.messages.list[msg.msgId] = angular.copy(msgMapping);
    await this.mailAppSrv.writeMsgListData(this.cacheSrv.messages.list);
  };

  /**
   * проверка наличия ошибок при отправке
   * @param sendReuslt {web3n.asmail.DeliveryProgress} - результат отправки сообщения
   * @returns {recipientsQt: number; status: string; errors: {address: string; error: string}[]}
   */
  checkOnErrors(sendResult: web3n.asmail.DeliveryProgress): { recipientsQt: number; status: string; errors: {address: string; error: string}[]} {
    let sendErrors: { recipientsQt: number; status: string; errors: { address: string; error: string; }[] } = {
      recipientsQt: 0,
      status: "",
      errors: <{address: string; error: string;}[]>[]
    };

    for (let recipient of Object.keys(sendResult.recipients)) {
      sendErrors.recipientsQt += 1;
      if (sendResult.recipients[recipient].err !== undefined) {
        let item = <{ address: string; error: string; }>{};

        if ("unknownRecipient" in sendResult.recipients[recipient].err) {
          item = {
            address: recipient,
            error: `Unknown recipient ${recipient}!`
          };
        }

        if ("inboxIsFull" in sendResult.recipients[recipient].err) {
          item = {
            address: recipient,
            error: `Mailbox of ${recipient} is full!`
          };
        }

        if ("domainNotFound" in sendResult.recipients[recipient].err) {
          let domain = (recipient.indexOf("@") !== -1) ? recipient.split("@")[1] : "";
          item = {
            address: recipient,
            error: `Domain ${domain} is not found!`
          };
        }

        if ("noServiceRecord" in sendResult.recipients[recipient].err) {
          let domain = (recipient.indexOf("@") !== -1) ? recipient.split("@")[1] : "";
          item = {
            address: recipient,
            error: `Domain ${domain} does not support 3N!`
          };
        }

        sendErrors.errors.push(item);
      }
    }

    sendErrors.status = (sendErrors.errors.length === 0) ? "success" : "error";
    return sendErrors;
  };


  /**
   * отображение toast при положительном результате отправки сообщения
   * @param msgKey {string}
   */
  private successMsg(msgKey: string): void {
    this.cacheSrv.general.blockUI = true;
    this.notificationsSrv.passiveNotif("success", "The message sent!")
      .then(() => {
        this.cacheSrv.messages.selectMode = "hide";
        (<any>this.$stateParams).msgId = "hide";
        (<any>this.$stateParams).msgMode = "hide";
        this.cacheSrv.general.blockUI = false;
        return this.$q.when(this.mailAppSrv.moveMessageInsideFS(msgKey, false, Constants.SYS_MAIL_FOLDERS.sent));
      })
      .then(() => {
        if (this.cacheSrv.messages.selectId === null) {
          (<any>this.$state).reload("root.mail.folder");
        } else {
          this.cacheSrv.messages.selectId = null;
          this.$state.go("root.mail.folder", {folderId: Constants.SYS_MAIL_FOLDERS.outbox, msgMode: "hide"});
        }
      });
  };

  /**
   * отображение toast при отрицательном результате отправки сообщения
   * и добавления сообщения в notification service
   * @param msgKey {string}
   * @param folderId {string}
   * @param sendErrors {{ recipientsQt: number; status: string; errors: {address: string; error: string}[]}}
   */
  private errorMsg(msgKey: string, folderId: string, sendErrors: {recipientsQt: number; status: string; errors: { address: string; error: string }[] }): void {
    this.cacheSrv.general.blockUI = true;
    let msgId = msgKey.slice(msgKey.indexOf("=") + 1);
    this.notificationsSrv.mailErrorNotif(msgId, folderId, sendErrors, "action")
      .then(() => {
        this.cacheSrv.messages.selectMode = "hide";
        (<any>this.$stateParams).msgId = "hide";
        (<any>this.$stateParams).msgMode = "hide";
        this.cacheSrv.general.blockUI = false;
        return this.$q.when(this.mailAppSrv.moveMessageInsideFS(msgKey, false, folderId));
      })
      .then(() => {
        if (this.cacheSrv.messages.selectId === null) {
          (<any>this.$state).reload("root.mail.folder");
        } else {
          this.cacheSrv.messages.selectId = null;
          this.$state.go("root.mail.folder", {folderId: Constants.SYS_MAIL_FOLDERS.outbox, msgMode: "hide"});
        }
      });
  };

  /**
   * запись информации об ошибке mailAddress
   * @param msg {client3N.MessageJson}
   * @param errors {address: string; error: string}[]
   */
  private async markIncorrectAddress(msg: client3N.MessageJSON, errors: { address: string; error: string }[]): Promise<void> {
    let addressList: {mailErrors: string[], mailErrorsInfo: {[mail: string]: string}} = {
      mailErrors: [],
      mailErrorsInfo: {}
    };
    for (let item of errors) {
      if (item.address !== null) {
        addressList.mailErrors.push(item.address);
        addressList.mailErrorsInfo[item.address] = item.error;
      }
    }

    this.cacheSrv.messages.list[msg.msgId].isSendError = true;

    if (addressList.mailErrors.length > 0) {
      msg.mailAddressErrors = addressList.mailErrors;
      msg.mailAddressErrorsInfo = addressList.mailErrorsInfo;
      await this.reWriteMsg(msg);
    }
  };

}
