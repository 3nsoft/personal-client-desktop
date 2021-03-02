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
import { copy, IAngularStatic } from 'angular';
import { logError } from '../../../common/services/libs/logging';
import { getAlias, html2text, waitAll } from '../../common/helpers';
import { appState } from '../../common/services/app-store';
import { appMailState } from '../common/app-mail-store';
import { SYS_MAIL_FOLDERS } from '../../../common/const';
import { Message } from '../services/message-manager/message.model';

export let ModuleName = '3nClient.services.msg-receiving';
export let MessageReceivingServiceName = 'messageReceivingService';

export function addService(ng: IAngularStatic): void {
  const module = ng.module(ModuleName, []);
  module.service(MessageReceivingServiceName, MessageReceivingService);
}

export class MessageReceivingService {
  static $inject = [];
  constructor() {}

  public async refreshInbox(): Promise<void> {
    console.log('Inbox refreshing ...');
    appState.values.isProgressBarShow = true;
    const inboxMsgInfoList: client3N.InboxMessageInfo[] = (await w3n.mail.inbox.listMsgs(appMailState.values.inboxRefreshTimestamp))
      .filter(listItem => listItem.msgType === 'mail')
      .map(listItem => ({
        ...listItem,
        msgKey: `in=${listItem.msgId}`,
      }));

    const currentMsgKeys = Object.keys(appMailState.values.messageList);
    const msgsToReceivePromises = inboxMsgInfoList
      .filter(listItem => !currentMsgKeys.includes(listItem.msgKey))
      .map(listItem => w3n.mail.inbox.getMsg(listItem.msgId));
    const incomingMsgsAll = await waitAll(msgsToReceivePromises)
      .catch(async (exc: web3n.asmail.ASMailSendException) => {
        logError(exc);
        throw exc;
      });
    const incomingMsgs = incomingMsgsAll
      .filter(msg => !msg.error)
      .map(msg => msg.result)
      .sort((msgA: client3N.IncomingMessage, msgB: client3N.IncomingMessage) => msgB.deliveryTS - msgA.deliveryTS);
    if (incomingMsgs.length > 0) {
      appMailState.values.inboxRefreshTimestamp = incomingMsgs[0].deliveryTS;
    }
    const msgList: client3N.MessageListItem[] = [];
    for (const inMsg of incomingMsgs) {
      const msg = await transformInToListitem(inMsg);
      msgList.push(msg);
    }
    const msgListAllTmp = copy(appMailState.values.messageList);
    msgList.forEach(inMsg => {
      msgListAllTmp[inMsg.msgKey] = copy(inMsg);
    });
    appMailState.values.messageList = copy(msgListAllTmp);
    appState.values.isProgressBarShow = false;
  }
}

export async function transformInToListitem(inMsg: client3N.IncomingMessage): Promise<client3N.MessageListItem> {
  const res: client3N.MessageListItem = {
    msgId: inMsg.msgId,
    msgKey: `in=${inMsg.msgId}`,
    sender: inMsg.sender,
    mailAddresses: inMsg.recipients ? inMsg.recipients : [],
    subject: inMsg.subject,
    timestamp: inMsg.deliveryTS,
    folderId: SYS_MAIL_FOLDERS.inbox,
    senderAlias: getAlias(inMsg.sender),
    body: inMsg.htmlTxtBody ?
      html2text(inMsg.htmlTxtBody).substr(0, 50) :
      inMsg.plainTxtBody ?
        inMsg.plainTxtBody.substr(0, 50) :
        '',
    attachedFilesNames: [],
    isRead: false,
  };
  if (inMsg.attachments) {
    const fileList = await inMsg.attachments.listFolder('/');
    res.attachedFilesNames = fileList.map(item => item.name);
  }
  return res;
}

export async function transformInToMessage(inMsg: web3n.asmail.IncomingMessage): Promise<Message> {
  const data: client3N.MessageEdited = {
    msgId: inMsg.msgId,
    msgKey: `in=${inMsg.msgId}`,
    sender: inMsg.sender,
    senderAlias: getAlias(inMsg.sender),
    mailAddresses: inMsg.recipients || [],
    alias: inMsg.recipients ? inMsg.recipients.map(mail => getAlias(mail)) : [],
    subject: inMsg.subject,
    timestamp: inMsg.deliveryTS,
    bodyHTML: inMsg.htmlTxtBody ? inMsg.htmlTxtBody : inMsg.plainTxtBody,
    attached: [],
  };
  const msg = new Message(data);
  if (inMsg.attachments) {
    const fileList = await inMsg.attachments.listFolder('/');
    msg.attached = [];
    for (const file of fileList) {
      const fileInfo: client3N.AttachFileInfo = {
        name: file.name,
        size: 0,
        mode: 'saved',
      };
      if (file.isFile) {
        const fileStat = await inMsg.attachments.stat(file.name);
        fileInfo.size = fileStat.size;
        msg.attached.push(fileInfo);
      }
    }
  }
  return msg;
}
