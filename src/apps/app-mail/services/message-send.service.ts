/*
 Copyright (C) 2018 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under
 the terms of the GNU General Public License as published by the Free Software
 Foundation, either version 3 of the License, or (at your option) any later
 version.

 This program is distributed in the hope that it will be useful, but
 WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with
 this program. If not, see <http://www.gnu.org/licenses/>.
*/
import { copy, IAngularStatic, ITimeoutService } from 'angular';
import { appMailState, messageSyncedFS } from '../common/app-mail-store';
import { Message } from './message-manager/message.model';
import { SYS_MAIL_FOLDERS } from '../../../common/const';
import { NamedProcs } from '../../../common/services/processes';
import * as MsgMoveSrvModule from './message-move/message-move.service';
import * as MsgSendProgressSrvModule from './message-send-progress.service';

export let ModuleName = '3nClient.services.msg-send';
export let MessageSendServiceName = 'messageSendService';

export function addService(ng: IAngularStatic): void {
  const module = ng.module(ModuleName, []);
  module.service(MessageSendServiceName, MessageSendService);
}

export class MessageSendService {
  private process = new NamedProcs();
  private observeSendings: string[] = [];

  static $inject = [
    '$timeout',
    'Notification',
    MsgMoveSrvModule.MessageMoveServiceName,
    MsgSendProgressSrvModule.MsgSendProgressServiceName,
  ];
  constructor(
    private $timeout: ITimeoutService,
    private Notification: angular.uiNotification.INotificationService,
    private msgMoveSrv: MsgMoveSrvModule.MessageMoveService,
    private sendProgressSrv: MsgSendProgressSrvModule.MessageSendProgressService,
    ) {}

  public async copyMsgFolder(
    msgKeyFrom: string,
    folderIdFrom: string,
    msgKeyTo: string,
    folderIdTo: string,
  ): Promise<void> {
    const msg = await messageSyncedFS.readJsonDataFromFS<client3N.Message>(folderIdFrom, msgKeyFrom);
    await messageSyncedFS.copyFolder(
      `${folderIdFrom}/${msgKeyTo}`,
      `${folderIdTo}/${msgKeyTo}`,
    );
    const newMsg = new Message();
    newMsg.createFromMessage(msg);
    const newMsgId = msgKeyTo.indexOf('out=') === 0 ?
      msgKeyTo.split('out=')[1] :
      msgKeyTo.split('in=')[1];
    newMsg.msgKey = msgKeyTo;
    newMsg.msgId = newMsgId;
    const newMsgDataToSave = newMsg.toMessage();
    await messageSyncedFS.saveJsonDataToFS(
      folderIdTo,
      msgKeyTo,
      'data.json',
      newMsgDataToSave,
    );
  }

  public async runSendMessage(msg: Message, directly: boolean = false): Promise<void> {
    const outgoingMsg: web3n.asmail.OutgoingMessage = msg.toOutgoingMessage();
    const msgMoveStatus = await this.msgMoveSrv.moveMessageFolder(msg.msgKey, SYS_MAIL_FOLDERS.outbox);
    if (msgMoveStatus) {
      this.msgMoveSrv.afterSuccessMoveMessageFolder(SYS_MAIL_FOLDERS.outbox, [msg.msgKey]);
    }
    if (msg.attached) {
      outgoingMsg.attachments = await messageSyncedFS.prepareAttachmentsContainer(msg.msgKey, msg.attached);
    }
    this.process.start(msg.msgId, async () => {
      await w3n.mail.delivery
        .addMsg(
          outgoingMsg.recipients,
          outgoingMsg,
          msg.msgId,
        );
      this.observerSendingMessage(msg.msgId);
    });
  }

  public observerSendingMessage(msgId: string): void {
    if (this.observeSendings.includes(msgId)) { return; }
    let msgKey: string;
    for (const key of Object.keys(appMailState.values.messageList)) {
      if (appMailState.values.messageList[key].msgId === msgId) {
        msgKey = key;
        break;
      }
    }
    this.observeSendings.push(msgId);
    let resultOfSendingMsg: web3n.asmail.DeliveryProgress;
    let errorsOfSendingMsg: client3N.ErrorWhenSend[] = [];
    w3n.mail.delivery.observeDelivery(msgId, {
      next: (value: web3n.asmail.DeliveryProgress) => {
        resultOfSendingMsg = value;
      },

      complete: () => {
        errorsOfSendingMsg = this.checkOnErrors(resultOfSendingMsg);
        if (errorsOfSendingMsg.length === 0) {
          this.onSuccess(msgId);
        } else {
          this.onError(msgId, errorsOfSendingMsg);
        }
      },

      error: (err: web3n.asmail.ASMailSendException) => {
        if ('msgCanceled' in err) {
          this.onCancel(msgId);
        }
      },
    });
  }

  public showProgress(msgId: string): void {
    appMailState.values.sendingStatus = null;
    // messageSendProgress.observeSending(msgId);
    w3n.mail.delivery.observeDelivery(msgId, {
      next: (progress: web3n.asmail.DeliveryProgress) => {
        const totalDataSize = progress.msgSize * Object.keys(progress.recipients).length;
        const sentDataSize = Object.keys(progress.recipients)
          .map(item => progress.recipients[item].bytesSent)
          .reduce((sum: number, curVal: number) => {
            return sum + curVal;
          }, 0);
        appMailState.values.sendingStatus = { msgId, totalDataSize, sentDataSize, isComplete: false };
      },
      error: _ => {
        appMailState.values.sendingStatus = null;
      },
      complete: () => {
        appMailState.values.sendingStatus = { msgId, totalDataSize: null, sentDataSize: null, isComplete: true };
        this.$timeout(_ => {
          appMailState.values.sendingStatus = null;
        }, 50);
      },
    });
  }
  /**
   * проверка списка отправляемых сообщений при возобновлении работы приложения после не штатного закрытия
   */
  public async checkSendingList(): Promise<void> {
    const sendingList = await w3n.mail.delivery.listMsgs();
    sendingList.forEach(sendingMsg => {
      this.observerSendingMessage(sendingMsg.id);
    });
  }

  public async cancelSending(msgId: string): Promise<void> {
    const msgKey = Object.keys(appMailState.values.messageList)
      .find(key => appMailState.values.messageList[key].msgId === msgId);
    await this.onCancel(msgId, true);
    const msgMoveStatus = await this.msgMoveSrv.moveMessageFolder(msgKey, SYS_MAIL_FOLDERS.draft);
    if (msgMoveStatus) {
      this.msgMoveSrv.afterSuccessMoveMessageFolder(SYS_MAIL_FOLDERS.draft, [msgKey]);
    }
    this.Notification.success({message: 'The message sending was canceled!'});
  }

  private checkOnErrors(sendingResult: web3n.asmail.DeliveryProgress): client3N.ErrorWhenSend[] {
    const result: client3N.ErrorWhenSend[] = [];
    Object.keys(sendingResult.recipients).forEach(recipient => {
      if (sendingResult.recipients[recipient].err) {
        const domain = recipient.indexOf('@') !== -1 ? recipient.split('@')[1] : '';
        let errorItem: client3N.ErrorWhenSend = {
          mailAddress: null,
          errorText: null,
        };
        if ('unknownRecipient' in sendingResult.recipients[recipient].err) {
          errorItem = {
            mailAddress: recipient,
            errorText: `Unknown recipient ${recipient}!`,
          };
        }
        if ('inboxIsFull' in sendingResult.recipients[recipient].err) {
          errorItem = {
            mailAddress: recipient,
            errorText: `Mailbox of ${recipient} is full!`,
          };
        }
        if ('domainNotFound' in sendingResult.recipients[recipient].err) {
          errorItem = {
            mailAddress: recipient,
            errorText: `Domain ${domain} is not found!`,
          };
        }
        if ('noServiceRecord' in sendingResult.recipients[recipient].err) {
          errorItem = {
            mailAddress: recipient,
            errorText: `Domain ${domain} does not support 3N!`,
          };
        }
        result.push(errorItem);
      }
    });
    return result;
  }

  private async onCancel(msgId: string, flag: boolean = true): Promise<void> {
    this.sendProgressSrv.removeMsgStatus(msgId);
    await w3n.mail.delivery.rmMsg(msgId, flag);
    this.observeSendings.splice(this.observeSendings.indexOf(msgId), 1);
  }

  private async onSuccess(msgId: string): Promise<void> {
    await this.onCancel(msgId, false);
    let currentMsgKey: string = null;
    for (const key of Object.keys(appMailState.values.messageList)) {
      if (appMailState.values.messageList[key].msgId === msgId) {
        currentMsgKey = key;
        break;
      }
    }
    const msgMoveStatus = await this.msgMoveSrv.moveMessageFolder(currentMsgKey, SYS_MAIL_FOLDERS.sent);
    if (msgMoveStatus) {
      this.msgMoveSrv.afterSuccessMoveMessageFolder(SYS_MAIL_FOLDERS.sent, [currentMsgKey]);
    }
    this.Notification.success({message: 'The message sent!'});
  }

  private async onError(msgId: string, errors: client3N.ErrorWhenSend[]): Promise<void> {
    await this.onCancel(msgId, false);
    const msgKey = Object.keys(appMailState.values.messageList).find(key => appMailState.values.messageList[key].msgId === msgId);
    const folderId = appMailState.values.messageList[msgKey].folderId;
    const msg = await messageSyncedFS.readJsonDataFromFS<client3N.Message>(folderId, msgKey);
    if (msg.mailAddresses.length === errors.length) {
      await this.onErrorAll(msg, errors);
    } else {
      await this.onErrorPartially(msg, errors);
    }
  }

  private async onErrorAll(msg: client3N.Message, errors: client3N.ErrorWhenSend[]): Promise<void> {
    const msgMoveStatus = await this.msgMoveSrv.moveMessageFolder(msg.msgKey, SYS_MAIL_FOLDERS.draft);
    if (msgMoveStatus) {
      this.msgMoveSrv.afterSuccessMoveMessageFolder(SYS_MAIL_FOLDERS.draft, [msg.msgKey]);
    }
    const msgTmp = copy(msg);
    msgTmp.errorsWhenSend = errors;
    await messageSyncedFS
      .saveJsonDataToFS(
        SYS_MAIL_FOLDERS.draft,
        msg.msgKey,
        'data.json',
        msgTmp,
      );
    const tmpMsgList = copy(appMailState.values.messageList);
    tmpMsgList[msg.msgKey].isSendError = true;
    appMailState.values.messageList = copy(tmpMsgList);
    this.Notification.error({message: 'Error sending message!',  delay: null});
  }

  private async onErrorPartially(msg: client3N.Message, errors: client3N.ErrorWhenSend[]): Promise<void> {
    const msgTmp = copy(msg);
    msgTmp.errorsWhenSend = errors;
    const msgMoveStatus = await this.msgMoveSrv.moveMessageFolder(msg.msgKey, SYS_MAIL_FOLDERS.sent);
    if (msgMoveStatus) {
      this.msgMoveSrv.afterSuccessMoveMessageFolder(SYS_MAIL_FOLDERS.sent, [msg.msgKey]);
    }
    await messageSyncedFS
      .saveJsonDataToFS(
        SYS_MAIL_FOLDERS.sent,
        msg.msgKey,
        'data.json',
        msgTmp,
      );
    const tmpMsgList = copy(appMailState.values.messageList);
    tmpMsgList[msg.msgKey].isSendError = true;
    appMailState.values.messageList = copy(tmpMsgList);
    const addrWithError = errors.map(item => item.mailAddress).join(', ');
    this.Notification.error({message: `Error sending to recipients: ${addrWithError}`,  delay: null});
  }

}
