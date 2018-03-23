/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. */

import * as CONST from '../../common/services/const';
import * as LIB from '../../common/services/lib-internal';
import * as Transform from '../../common/services/transform-mail';
import { NamedProcs } from '../../common/services/processes';
import * as CacheSrvMod from '../../common/services/cache-srv';
import * as CommonSrvMod from '../../common/services/common-srv';
import * as NotifSrvMod from '../../common/services/notifications/notifications-srv';
import * as FolderFsSrvMod from '../mail-folders/mail-folders-fs-srv';
import * as MailFsSrvMod from '../mail-app/mail-fs-srv';
import * as MsgEditSrvMod from '../message/msg-edit/msg-edit-srv';

export let ModuleName = '3nClient.services.mail-srv';
export let MailSrvName = 'mailService';

export function addService(angular: angular.IAngularStatic): void {
  let mod = angular.module(ModuleName, []);
  mod.service(MailSrvName, Srv);
}

export class Srv {
  private sendProcs = new NamedProcs();
  private observeSendings: string[] = [];

	static $inject = ['$rootScope', '$state', '$stateParams', '$timeout', '$q', CacheSrvMod.CacheSrvName, CommonSrvMod.CommonSrvName, NotifSrvMod.NotificationsSrvName, FolderFsSrvMod.MailFoldersFsSrvName, MailFsSrvMod.MailFsSrvName, MsgEditSrvMod.MsgEditSrvName];
	constructor(
    private $rootScope: angular.IRootScopeService,
    private $state: angular.ui.IStateService,
    private $stateParams: angular.ui.IStateParamsService,
    private $timeout: angular.ITimeoutService,
    private $q: angular.IQService,
    private _cacheSrv: CacheSrvMod.Cache,
    private _commonSrv: CommonSrvMod.Srv,
    private _notifSrv: NotifSrvMod.Srv,
    private _folderFsSrv: FolderFsSrvMod.Srv,
    private _mailFsSrv: MailFsSrvMod.Srv,
    private _msgEditSrv: MsgEditSrvMod.Srv
	) {}

	/**
   * функция обновления inbox folder
   */
  async refreshInbox(): Promise<void> {
    console.log("INBOX REFRESH");
    this.$timeout(() => {
      this._cacheSrv.general.progressBar = true;
    });
    
    const inboxMsgInfoList = (await w3n.mail.inbox.listMsgs(
      this._cacheSrv.messages.refreshTS))
    .filter(inboxListItem => (inboxListItem.msgType === 'mail'))
    .map(inboxListItem => ({
      deliveryTS: inboxListItem.deliveryTS,
      msgId: inboxListItem.msgId,
      msgKey: Transform.newMsgKey('in', inboxListItem.msgId)
    } as client3N.InboxMessageInfo));
    
    // берём сообщения только с неизвестными msgId
    const alreadyKnownMsgIds = Object.keys(this._cacheSrv.messages.list);
    const msgPromises = inboxMsgInfoList
    .filter(msgInfoItem => !alreadyKnownMsgIds.includes(msgInfoItem.msgId))
    .map(msgInfoItem => w3n.mail.inbox.getMsg(msgInfoItem.msgId));
    
    const inboxMsgs = await LIB.waitAll(msgPromises)
    .catch(async (exc: web3n.asmail.ASMailSendException) => {
      console.log(exc);
      throw exc;
    });

    const targetInboxMsgs = inboxMsgs
    .filter(item => !item.error)
    .map(item => item.result)
    .sort((itemA, itemB) => (itemB.deliveryTS - itemA.deliveryTS));

    if (targetInboxMsgs.length > 0) {
      this._cacheSrv.messages.refreshTS = targetInboxMsgs[0].deliveryTS;
    }

    // console.log(JSON.stringify(targetInboxMsgs));

    let targetInboxMsgsMap = Transform.incomingToMapping(targetInboxMsgs);
    // console.log(targetInboxMsgsMap);
    for (let id in targetInboxMsgsMap) {
      this._cacheSrv.messages.list[id] = angular.copy(targetInboxMsgsMap[id]);
      this._cacheSrv.folders.list[CONST.SYS_MAIL_FOLDERS.inbox].messageIds.push(id);
    }
    await this._folderFsSrv.writeFolderList();
    await this._mailFsSrv.writeMsgList();
    this.$timeout(() => {
      // this._cacheSrv.messages.unreadMsgQuantity = this.countUnreadMessage();
      this._cacheSrv.general.progressBar = false;
    });
  }

  /**
   * чтение данных сообщения из Inbox
   * @param msgId {string}
   * @return
   */
  async readMsgDataFromInbox(msgId: string): Promise<client3N.MessageJSON> {
    let msg: client3N.MessageJSON;
    const inboxList = await w3n.mail.inbox.listMsgs();
    let isPresent = inboxList.find(item => (item.msgId === msgId))
    if (isPresent) {
      const incomingMsg = await w3n.mail.inbox.getMsg(msgId);
      msg = await Transform.incomingToJSON(incomingMsg);
    } else {
      msg = Transform.newMessageJSON();
    }

    return msg;
  }

  /**
   * подготовка сообщения к отравке
   * @param msgContent {client3N.MessageEditContent}
   * @returns {Promise<{ msgToSend: web3n.asmail.OutgoingMessage, recipients: string[] }>}
   */
  private async prepareMsgToSend(msgContent: client3N.MessageEditContent): Promise<{ msgToSend: web3n.asmail.OutgoingMessage, recipients: string[] }> {
    let allRecipients: string[] = [];
    let msgToSend = Transform.newOutgoingMessage();

    for (let item of msgContent.mailAddressTO) {
      if (allRecipients.indexOf(item) === -1) allRecipients.push(item);
    }
    for (let item of msgContent.mailAddressCC) {
      if (allRecipients.indexOf(item) === -1) allRecipients.push(item);
    }
    for (let item of msgContent.mailAddressBC) {
      if (allRecipients.indexOf(item) === -1) allRecipients.push(item);
    }

    msgToSend = {
      msgId: msgContent.msgId,
      msgType: 'mail',
      recipients: msgContent.mailAddressTO,
      carbonCopy: msgContent.mailAddressCC,
      subject: msgContent.subject,
      htmlTxtBody: msgContent.bodyHTML,
      plainTxtBody: msgContent.bodyTxt
    };

    msgToSend.attachments = await this._mailFsSrv.prepareAttachContainer(msgToSend.msgId, msgContent.attached);

    return { msgToSend: msgToSend, recipients: allRecipients };
  } 

  /**
   * проверка на наличие ошибок при отправке
   * @param resOfSendingMsg {web3n.asmail.DeliveryProgress}
   * @returns { client3N.SendMailResult }
   */
  private checkOnErrors(resOfSendingMsg: web3n.asmail.DeliveryProgress): client3N.SendMailResult {
    let checkingResult: client3N.SendMailResult = {
      recipientsQt: 0,
      wrongRecipientsQt: 0,
      status: null,
      errors: <{ address: string; error: string }[]>[]
    };

    for (let recipient of Object.keys(resOfSendingMsg.recipients)) {
      checkingResult.recipientsQt += 1;
      if (!!resOfSendingMsg.recipients[recipient].err) {
        let item: { address: string; error: string } = {
          address: recipient,
          error: null
        };
        const domain = (recipient.indexOf('@') !== -1) ? recipient.split('@')[1] : '';
        
        if ('unknownRecipient' in resOfSendingMsg.recipients[recipient].err) {
          item.error = `Unknown recipient ${recipient}!`;
        }

        if ('inboxIsFull' in resOfSendingMsg.recipients[recipient].err) {
          item.error = `Mailbox of ${recipient} is full!`;
        }

        if ('domainNotFound' in resOfSendingMsg.recipients[recipient].err) {
          item.error = `Domain ${domain} is not found!`;
        }

        if ('noServiceRecord' in resOfSendingMsg.recipients[recipient].err) {
          item.error = `Domain ${domain} does not support 3N!`;
        }

        checkingResult.errors.push(item);
        checkingResult.wrongRecipientsQt += 1;
      }
    }

    checkingResult.status = (checkingResult.errors.length === 0) ? 'success' : 'error';
    return checkingResult;
  }

  /**
   * пометка получателей, отправка сообщений которым завершилась ошибкой
   * @param msg {client3N.MessageJSON}
   * @param errors {address: string; error: string}[]
   */
  private async markRecipientsWithError(msg: client3N.MessageJSON, errors: { address: string; error: string }[]): Promise<void> {
    let collection: { addressErrors: string[]; addressErrorsInfo: { [mail: string]: string } } = {
      addressErrors: <string[]>[],
      addressErrorsInfo: <{ [mail: string]: string }>{}
    };
    for (let item of errors) {
      if (!!item.address) {
        collection.addressErrors.push(item.address);
        collection.addressErrorsInfo[item.address] = item.error;
      }
    }
    if (collection.addressErrors.length > 0) {
      msg.mailAddressErrors = collection.addressErrors;
      msg.mailAddressErrorsInfo = collection.addressErrorsInfo;
      await this._mailFsSrv.writeMsgData(this._cacheSrv.messages.list[msg.msgId].folderId, msg);
    }
    
  }

  /**
   * запуск отправки сообщения
   * @param msg {client3N.MessageEditContent}
   * @param attachments {web3n.files.File[]}
   * @param isTouched? {boolean} - вносились ли в содержимое сообщения изменения
   */
  async runSendMsg(msg: client3N.MessageEditContent, attachments: web3n.files.File[], isTouched?: boolean): Promise<void> {
    const isMsgNew = (msg.msgId === 'new') ? true : false;
    let msgJson = Transform.msgEditToJson(msg);
    msgJson.bodyHTML = Transform.sanitizeHTML(msg.bodyHTML);

    if (isMsgNew) {
      let res = await this._msgEditSrv.saveMsgToFolder(msg, attachments, CONST.SYS_MAIL_FOLDERS.outbox);
      msgJson.msgId = res.msgId;
      msgJson.msgKey = this._cacheSrv.messages.list[msgJson.msgId].msgKey;
      msgJson.timeCr = this._cacheSrv.messages.list[msgJson.msgId].timeCr;
      msgJson.attached = res.attached;
      msg.msgId = angular.copy(msgJson.msgId);
      msg.msgKey = angular.copy(msgJson.msgKey);
      msg.timeCr = angular.copy(msgJson.timeCr);
      msg.attached = angular.copy(res.attached);
    } else {
      if (isTouched) {
        let res = await this._msgEditSrv.saveMsgToFolder(msg, attachments, this._cacheSrv.messages.list[msg.msgId].folderId);
        msg.attached = angular.copy(res.attached);
      }
      await this._mailFsSrv.moveMsgInsideFS(msg.msgId, CONST.SYS_MAIL_FOLDERS.outbox);
    }

    this.sendProcs.start(msg.msgId, async () => {
      // преобразуем сообщение для отправки
      const dataToSend = await this.prepareMsgToSend(msg);
      console.info('SEND MESSAGE FROM MAIL!')
      console.log(dataToSend)
      await w3n.mail.delivery.addMsg(dataToSend.recipients, dataToSend.msgToSend, dataToSend.msgToSend.msgId);
      this.observeSendingMsg(dataToSend.msgToSend.msgId);
    });
  }

  /**
   * "наблюдение" за процессом отправки сообщения
   * @param msgId {string}
   */
  observeSendingMsg(msgId: string): void {
    if (this.observeSendings.indexOf(msgId) !== -1) return;
    this.observeSendings.push(msgId);

    let resultOfSendingMsg: web3n.asmail.DeliveryProgress;
    let errorsOfSendingMsg: client3N.SendMailResult;
    w3n.mail.delivery.observeDelivery(msgId, {
      next: (value: web3n.asmail.DeliveryProgress) => {
        resultOfSendingMsg = value;
      },

      complete: () => {
        errorsOfSendingMsg = this.checkOnErrors(resultOfSendingMsg);
        if (errorsOfSendingMsg.status === 'success') {
          this.listenerSuccessSend(msgId);
        } else {
          this.listenerErrorSend(msgId, errorsOfSendingMsg);
        }
      },

      error: (err: web3n.asmail.ASMailSendException) => {
        if ('msgCancelled' in err) {
          this.listenerCancellingSend(msgId);
        }
      }
    });
  }

  /**
   * отображение прогресса отпраки выбранного сообщения
   * @param msgId {string}
   */
  showProgress(msgId: string): void {
    this._cacheSrv.messages.sendStatus = 0;
    w3n.mail.delivery.observeDelivery(msgId, {
      next: (progress: web3n.asmail.DeliveryProgress) => {
        const totalSize = progress.msgSize * Object.keys(progress.recipients).length;
        let currentSentSize = 0;
        for (let recipient of Object.keys(progress.recipients)) {
          currentSentSize += progress.recipients[recipient].bytesSent;
        }
        const currentProgress = LIB.round(currentSentSize / totalSize * 100, 0);
        // console.info(`Delivery progress ${msgId}: ${LIB.round(currentProgress, -2)}%`);
        this.$timeout(() => {
          this._cacheSrv.messages.sendStatus = currentProgress;
        });
      },
      error: err => {}
    })
  }

  /**
   * обработка положительного завершения отправки сообщения
   * @param msgId {string}
   */
  private async listenerSuccessSend(msgId: string): Promise<void> {
    await w3n.mail.delivery.rmMsg(msgId);
    this.observeSendings.splice(this.observeSendings.indexOf(msgId), 1);
    await this.successSendingPostprocessing(msgId);
    this.$rootScope.$broadcast('client_needRefreshMailFolder', msgId);
  }

  /**
   * обработка завершения отправки сообщения с ошибкой
   * @param msgId {string}
   * @param errors { client3N.SendMailResult }
   */
  private async listenerErrorSend(msgId: string, errors: client3N.SendMailResult): Promise<void> {
    let msgJson = await this._mailFsSrv.readMsgData(msgId);
    await w3n.mail.delivery.rmMsg(msgId);
    this.observeSendings.splice(this.observeSendings.indexOf(msgId), 1);
    if (errors.recipientsQt === errors.wrongRecipientsQt) {
      await this.errorSendingPostprocessing(msgJson, errors);
    } else {
      // если общее количество получателей !== количеству получателей с ошибкой в адресе
      // необходимо "разбить" сообщения на 2 (одно с получателями с ошибкой, 2-е - с получателями, которым сообщение ушло успешно)
      const wrongAddresses = errors.errors.map((item) => {
        return item.address;
      });
      const difStatusesMessages = this.splitMessage(msgJson, wrongAddresses);
      let msgMapWithSuccessStatus = Transform.msgJsonToMapping(difStatusesMessages.correctAddressesMsg, CONST.SYS_MAIL_FOLDERS.outbox);
      let msgMapWithErrorStatus = Transform.msgJsonToMapping(difStatusesMessages.wrongAddressesMsg, CONST.SYS_MAIL_FOLDERS.outbox);
      this._cacheSrv.messages.list[msgMapWithSuccessStatus.msgId] = msgMapWithSuccessStatus;
      this._cacheSrv.messages.list[msgMapWithErrorStatus.msgId] = msgMapWithErrorStatus;
      this._cacheSrv.folders.list[CONST.SYS_MAIL_FOLDERS.outbox].messageIds.push(msgMapWithErrorStatus.msgId);
      await this._mailFsSrv.copyMsgFolder(msgMapWithSuccessStatus.msgId, msgMapWithErrorStatus.msgId);
      await this._mailFsSrv.writeMsgData(msgMapWithSuccessStatus.folderId, difStatusesMessages.correctAddressesMsg);
      await this._mailFsSrv.writeMsgData(msgMapWithErrorStatus.folderId, difStatusesMessages.wrongAddressesMsg);
      await this.successSendingPostprocessing(msgMapWithSuccessStatus.msgId);
      await this.errorSendingPostprocessing(difStatusesMessages.wrongAddressesMsg, errors);
    }

    this.$rootScope.$broadcast('client_needRefreshMailFolder', msgId);
  }

  /**
   * постобработка успешного завершения отправки
   * @param msgId {string}
   */
  private async successSendingPostprocessing(msgId: string): Promise<void> {
    if (!this._cacheSrv.messages.list[msgId].isSendError) {
      this._cacheSrv.messages.list[msgId].isSendError = false;
      await this._mailFsSrv.writeMsgList();
    }
    await this._mailFsSrv.moveMsgInsideFS(msgId, CONST.SYS_MAIL_FOLDERS.sent);
    this._cacheSrv.messages.sendStatus = 0;
    this._commonSrv.sysNotification('success', null, 'The message sent!');
  }

  /**
   * постобработка завершения отправки с ошибкой
   * @param msgJson {client3N.MessageJSON}
   * @param errors { recipientsQt: number; status: 'success' | 'error'; errors: { address: string; error: string }[] }
   */
  private async errorSendingPostprocessing(msgJson: client3N.MessageJSON, errors: { recipientsQt: number; status: 'success' | 'error'; errors: { address: string; error: string }[] }): Promise<void> {
    if (!!this._cacheSrv.messages.list[msgJson.msgId].isSendError) {
        this._cacheSrv.messages.list[msgJson.msgId].isSendError = true;
        await this._mailFsSrv.writeMsgList();
      }
      await this.markRecipientsWithError(msgJson, errors.errors);
      await this._mailFsSrv.moveMsgInsideFS(msgJson.msgId, CONST.SYS_MAIL_FOLDERS.draft);
      this._cacheSrv.messages.list[msgJson.msgId].folderId = CONST.SYS_MAIL_FOLDERS.draft;
        
      this._notifSrv.mailErrorNotif(msgJson.msgId, CONST.SYS_MAIL_FOLDERS.draft, errors, 'action')
        .then(res => {
          this._commonSrv.sysNotification('error', null, 'Error sending message!');
        });
  }


  async runSendMsgCancelling(msgId: string): Promise<void> {
    await w3n.mail.delivery.rmMsg(msgId, true);
    this.observeSendings.splice(this.observeSendings.indexOf(msgId), 1);
  }

  /**
   * обработка "ошибки" отправки, связанной с прерыванием процесса отправки пользователем
   * @param msgId {string}
   */
  private async listenerCancellingSend(msgId: string): Promise<void> {
    const sendingProc = this.sendProcs.getP(msgId);
    if (sendingProc) {
      await sendingProc;
    }
    await this._mailFsSrv.moveMsgInsideFS(msgId, CONST.SYS_MAIL_FOLDERS.draft);
    this._commonSrv.sysNotification('info', null, 'The user cancelled the message sending. The message has been moved to the Drafts folder.');
    this.$rootScope.$broadcast('client_needRefreshMailFolder', msgId);
  }

  /**
   * проверка списка отправляемых сообщений при возобновлении работы приложения после не штатного закрытия
   */
  async checkSendingList(): Promise<void> {
    const sendingList = await w3n.mail.delivery.listMsgs();
    // console.log(sendingList);
    for (let sendingMsg of sendingList) {
      this.observeSendingMsg(sendingMsg.id);
    }
  }

  /**
   * "разбиение" сообщения на 2
   * @param originalMsg {client3N.MessageJSON}
   * @param wrongAddresses {string[]}
   * @return {wrongAddressesMsg: client3N.MessageJSON, correctAddressesMsg: client3N.MessageJSON}
   */
  splitMessage(originalMsg: client3N.MessageJSON, wrongAddresses: string[]): { wrongAddressesMsg: client3N.MessageJSON, correctAddressesMsg: client3N.MessageJSON } {
    let correctAddressesMsg: client3N.MessageJSON = {
      msgId: angular.copy(originalMsg.msgId),
      msgKey: angular.copy(originalMsg.msgKey),
      subject: angular.copy(originalMsg.subject),
      bodyHTML: angular.copy(originalMsg.bodyHTML),
      timeCr: angular.copy(originalMsg.timeCr),
      attached: angular.copy(originalMsg.attached),
      sourceMsgId: (!!originalMsg.sourceMsgId) ? angular.copy(originalMsg.sourceMsgId) : null,
      mailAddress: angular.copy(originalMsg.mailAddress),
      mailAddressTO: originalMsg.mailAddressTO.filter(
        addr => !wrongAddresses.includes(addr)),
      mailAddressCC: originalMsg.mailAddressCC.filter(
        addr => !wrongAddresses.includes(addr)),
      mailAddressBC: originalMsg.mailAddressBC.filter(
        addr => !wrongAddresses.includes(addr))
    };
  

    let wrongAddressesMsg: client3N.MessageJSON = {
      msgId: `${Number(originalMsg.msgId) + 1}`,
      msgKey: Transform.newMsgKey('out', `${Number(originalMsg.msgId) + 1}`),
      subject: angular.copy(originalMsg.subject),
      bodyHTML: angular.copy(originalMsg.bodyHTML),
      timeCr: angular.copy(originalMsg.timeCr) + 1,
      attached: angular.copy(originalMsg.attached),
      sourceMsgId: (!!originalMsg.sourceMsgId) ? angular.copy(originalMsg.sourceMsgId) : null,
      mailAddress: angular.copy(originalMsg.mailAddress),
      mailAddressTO: originalMsg.mailAddressTO.filter(
        addr => wrongAddresses.includes(addr)),
      mailAddressCC: originalMsg.mailAddressCC.filter(
        addr => wrongAddresses.includes(addr)),
      mailAddressBC: originalMsg.mailAddressBC.filter(
        addr => wrongAddresses.includes(addr))
    };

    return {
      wrongAddressesMsg: wrongAddressesMsg,
      correctAddressesMsg: correctAddressesMsg
    };
  }

  /**
   * подсчет количества непрочитанных сообщений
   */
  countUnreadMessage(): number {
    const msgIds = Object.keys(this._cacheSrv.messages.list)
    const res = msgIds.reduce((summ, id) => {
      return summ + (this._cacheSrv.messages.list[id].isRead ? 0 : 1)
    }, 0)
    return res
  }


}