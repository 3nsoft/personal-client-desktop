/*
 Copyright (C) 2019 3NSoft Inc.

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

import { getAlias } from '../../common/helpers';
import { addFileTo } from '../../../common/lib/attachments-container';
import { Chat } from './chat';

export async function getAttachFileInfoFromOutAttachContainer(outMsg: client3N.OutgoingMessage): Promise<client3N.AttachFileInfo[]> {
  const chat = new Chat();
  const result: client3N.AttachFileInfo[] = [];
  // в данном случае при записи OutgoingMessage как json на диск, поле
  // attachments фактически содержит объект объектов, а не attachments объект
  const fileNames: string[] = Object.keys((outMsg.attachments as any).files);
  for (const fileName of fileNames) {
    const fileStat = await chat.readStatLinkLocally(outMsg.jsonBody.data.chatId, fileName);
    result.push(fileStat);
  }
  return result;
}

export async function getAttachFileInfoFromInAttachContainer(attachments: web3n.files.ReadonlyFS): Promise<client3N.AttachFileInfo[]> {
  const result: client3N.AttachFileInfo[] = [];
  const fileList  = await attachments.listFolder('/');
  for (const item of fileList) {
    if (item.isFile) {
      const currentFileStat = await attachments.stat(item.name);
      const currentFileInfo: client3N.AttachFileInfo = {
        name: item.name,
        size: currentFileStat.size,
        mode: 'saved',
      };
      result.push(currentFileInfo);
    }
  }
  // console.log(result)
  return result;
}

export function inMsgToLogMsg(inMsg: client3N.IncomingMessage): client3N.ChatLog {
  return {
    msgId: inMsg.msgId,
    direction: 'in',
    timestamp: inMsg.jsonBody.data.timestamp,
    isAttached: !!inMsg.attachments,
  };
}

export async function inMsgToDisplayedMsg(inMsg: client3N.IncomingMessage): Promise<client3N.ChatDisplayedMessage> {
  return {
    creator: inMsg.sender,
    timestamp: inMsg.jsonBody.data.timestamp,
    text: inMsg.plainTxtBody,
    attached: !!inMsg.attachments
      ? await getAttachFileInfoFromInAttachContainer(inMsg.attachments)
      : [],
    msgId: inMsg.msgId,
  };
}

export function outMsgToLogMsg(outMsg: client3N.OutgoingMessage): client3N.ChatLog {
  return {
    msgId: outMsg.msgId,
    direction: 'out',
    timestamp: outMsg.jsonBody.data.timestamp,
    isAttached: !!outMsg.attachments,
  };
}

export async function outMsgToDisplayedMsg(outMsg: client3N.OutgoingMessage, appUser: string): Promise<client3N.ChatDisplayedMessage> {
  return {
    creator: appUser,
    timestamp: outMsg.jsonBody.data.timestamp,
    text: outMsg.plainTxtBody,
    attached: outMsg.attachments
      ? await getAttachFileInfoFromOutAttachContainer(outMsg)
      : [],
    msgId: outMsg.msgId,
  };
}

export function displayedMsgToLogMsg(dMsg: client3N.ChatDisplayedMessage, appUser: string): client3N.ChatLog {
  return {
    msgId: dMsg.msgId,
    direction: dMsg.creator !== appUser ? 'in' : 'out',
    timestamp: dMsg.timestamp,
    outMsg: !!dMsg.outMsg ? dMsg.outMsg : undefined,
    isAttached: dMsg.attached.length > 0,
  };
}

export async function filesToLinkAndSave(chatId: string, files: web3n.files.ReadonlyFile[]): Promise<void> {
  const chat = new Chat();
  for (const file of files) {
    await chat.saveLinkLocally(chatId, file);
  }
}

export function filesToAttachmentsContainer(files: web3n.files.ReadonlyFile[]): client3N.AttachmentsContainer {
  const result: client3N.AttachmentsContainer = {};
  for (const file of files) {
    addFileTo(result, file);
  }
  return result;
}

export async function chatMsgPrepare(
  user: string,
  chatList: client3N.ChatRoom[],
  chatId: string,
  msgText: string,
  attach?: {attachments: web3n.files.ReadonlyFile[], attached: client3N.AttachFileInfo[]},
): Promise<{msgToSend: client3N.OutgoingMessage, msgToLog: client3N.ChatLog, msgToDisplay: client3N.ChatDisplayedMessage}> {
  const currentRecipients = chatList
    .find(chat => chat.chatId === chatId)
    .members
    .filter(member => member !== user);
  const timestamp = Date.now();
  const msgId = timestamp.toFixed();
  const msgToSend: client3N.OutgoingMessage = {
    msgId,
    msgType: 'chat',
    plainTxtBody: msgText,
    recipients: currentRecipients,
    attachments: attach.attached.length > 0
      ? filesToAttachmentsContainer(attach.attachments)
      : null,
    jsonBody: {
      type: '010',
      data: {
        chatId,
        timestamp,
        isGroup: currentRecipients.length > 0,
      },
    },
  };

  const msgToLog: client3N.ChatLog = {
    msgId,
    direction: 'out',
    timestamp,
    outMsg: 'sended',
    isAttached: attach.attached.length > 0,
  };

  const msgToDisplay: client3N.ChatDisplayedMessage = {
    creator: user,
    timestamp,
    text: msgText,
    attached: attach.attached.length > 0 ? attach.attached : [],
    msgId,
    outMsg: 'sending',
  };

  return {
    msgToSend,
    msgToLog,
    msgToDisplay,
  };
}
