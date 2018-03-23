/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>.
*/

import { findNameByMail } from '../../common/services/lib-internal'
import { addFileTo } from '../../common/libs/attachments-container'
import { Chats } from './chats'
 
/*
export async function getAttachFileInfoFromOutAttachContainer(attachments: client3N.AttachmentsContainer): Promise<client3N.AttachFileInfo[]> {
  let result: client3N.AttachFileInfo[] = []
  for (let fileName of Object.keys(attachments.files)) {
    const curretFileStats = await attachments.files[fileName].stat()
    const currentFileInfo: client3N.AttachFileInfo = {
      name: fileName,
      size: curretFileStats.size,
      mode: 'saved'
    }
    result.push(currentFileInfo)
  }
  return result
}
*/

export async function getAttachFileInfoFromOutAttachContainer(outMsg: client3N.OutgoingMessage): Promise<client3N.AttachFileInfo[]> {
  const chats = new Chats()
  let result: client3N.AttachFileInfo[] = []
  // в данном случае при записи OutgoingMessage как json на диск, поле
  // attachments фактически содержит объект объектов, а не attachments объект
  const fileNames: string[] = Object.keys((outMsg.attachments as any).files)
  for (let fileName of fileNames) {
    const fileStat = await chats.readStatLinkLocally(outMsg.jsonBody.data.chatId, fileName)
    result.push(fileStat)
  }
  return result
}

export async function getAttachFileInfoFromInAttachContainer(attachments: web3n.files.ReadonlyFS) : Promise<client3N.AttachFileInfo[]> {
  let result: client3N.AttachFileInfo[] = []
  const fileList  = await attachments.listFolder('/')
  for (let item of fileList) {
    if (item.isFile) {
      const currentFileStat = await attachments.statFile(item.name)
      const currentFileInfo: client3N.AttachFileInfo = {
        name: item.name,
        size: currentFileStat.size,
        mode: 'saved'
      }
      result.push(currentFileInfo)
    }
  }
  // console.log(result)
  return result
}

export function inMsgToLogMsg(inMsg: client3N.IncomingMessage): client3N.ChatLog {
  const logMsg: client3N.ChatLog = {
    msgId: inMsg.msgId,
    direction: 'in',
    timestamp: inMsg.jsonBody.data.timestamp,
    isAttached: inMsg.attachments ? true : false
  }
  return logMsg
}

export async function inMsgToDisplayedMsg(inMsg: client3N.IncomingMessage): Promise<client3N.ChatDisplayedMessage> {
  const result: client3N.ChatDisplayedMessage = {
    creator: inMsg.sender,
    timestamp: inMsg.jsonBody.data.timestamp,
    text: inMsg.plainTxtBody,
    attached: (inMsg.attachments) ? await getAttachFileInfoFromInAttachContainer(inMsg.attachments) : [],
    msgId: inMsg.msgId
  }
  return result
}

export function outMsgToLogMsg(outMsg: client3N.OutgoingMessage): client3N.ChatLog {
  const logMsg: client3N.ChatLog = {
    msgId: outMsg.msgId,
    direction: 'out',
    timestamp: outMsg.jsonBody.data.timestamp,
    isAttached: outMsg.attachments ? true : false
  }
  return logMsg
}

export async function outMsgToDisplayedMsg(outMsg: client3N.OutgoingMessage, appUser: string): Promise<client3N.ChatDisplayedMessage> {
  const result: client3N.ChatDisplayedMessage = {
    creator: appUser,
    timestamp: outMsg.jsonBody.data.timestamp,
    text: outMsg.plainTxtBody,
    attached: outMsg.attachments ? await getAttachFileInfoFromOutAttachContainer(outMsg) : [],
    msgId: outMsg.msgId
  }
  return result
}

export function displayedMsgToLogMsg(dMsg: client3N.ChatDisplayedMessage, appUser: string): client3N.ChatLog {
  const result: client3N.ChatLog = {
    msgId: dMsg.msgId,
    direction: (dMsg.creator !== appUser) ? 'in' : 'out',
    timestamp: dMsg.timestamp,
    outMsg: (dMsg.outMsg) ? dMsg.outMsg : undefined,
    isAttached: (dMsg.attached.length > 0) ? true : false
  }
  return result
}

export async function filesToLinkAndSave(chatId: string,files: web3n.files.ReadonlyFile[]): Promise<void> {
  const chats = new Chats()
  for (let file of files) {
    await chats.saveLinkLocally(chatId, file)
  }
}

export function filesToAttachmentsContainer(files: web3n.files.ReadonlyFile[]): client3N.AttachmentsContainer {
  let result: client3N.AttachmentsContainer = {}
  for (let file of files) {
    addFileTo(result, file)
  }
  return result
} 

export async function chatMsgPrepare(
  user: string, 
  chatList: client3N.ChatRoom[], 
  chatId: string, 
  msgText: string, 
  attach?: {attachments: web3n.files.ReadonlyFile[], attached: client3N.AttachFileInfo[]}
): Promise<{msgToSend: client3N.OutgoingMessage, msgToLog: client3N.ChatLog, msgToDisplay: client3N.ChatDisplayedMessage}> {
  const currentRecipients = chatList
    .find(chat => chat.chatId === chatId)
    .members.filter(member => member !== user)
  const timestamp = Date.now()
  const msgId = timestamp.toFixed()
  let msgToSend: client3N.OutgoingMessage = {
    msgId: msgId,
    msgType: 'chat',
    plainTxtBody: msgText,
    recipients: currentRecipients,
    attachments: (attach.attached.length > 0) ? filesToAttachmentsContainer(attach.attachments) : null,
    jsonBody: {
      type: '010',
      data: {
        chatId: chatId,
        timestamp: timestamp,
        isGroup: (currentRecipients.length > 0) ? true : false
      }
    }
  }

  const msgToLog: client3N.ChatLog = {
    msgId: msgId,
    direction: 'out',
    timestamp: timestamp,
    outMsg: 'sended',
    isAttached: (attach.attached.length > 0) ? true : false
  }

  const msgToDisplay: client3N.ChatDisplayedMessage = {
    creator: user,
    timestamp: timestamp,
    text: msgText,
    attached: (attach.attached.length > 0) ? attach.attached : [],
    msgId: msgId,
    outMsg: 'sending'
  }

  return {
    msgToSend: msgToSend,
    msgToLog: msgToLog,
    msgToDisplay: msgToDisplay
  }
}