/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>.
*/

import * as CONST from '../../common/services/const';
import { JsonFromFile } from './common'

export class Chats {
  private rooms: JsonFromFile<client3N.ChatRoom[]>
  private log: JsonFromFile<client3N.ChatLog[]>
  private outMsg: JsonFromFile<client3N.OutgoingMessage>
  private localStorage: JsonFromFile<web3n.files.File>

  constructor() {
    this.rooms = new JsonFromFile(
      w3n.storage.getAppSyncedFS(`${CONST.FS_USED.CHAT}`),
      CONST.USED_FILES_NAMES.chatList,
      []
    )

    this.log = new JsonFromFile(
      w3n.storage.getAppSyncedFS(`${CONST.FS_USED.CHAT}`),
      '',
      []
    )

    this.outMsg = new JsonFromFile(
      w3n.storage.getAppSyncedFS(`${CONST.FS_USED.CHAT}`),
      '',
      null
    )

    this.localStorage = new JsonFromFile(
      w3n.storage.getAppLocalFS(`${CONST.FS_USED.CHAT}`),
      '',
      null
    )

  }

  generateChatId(timestamp: number): string {
    const min = 10
    const max = 60
    let str = ''
    for (let i = 0; i < 18; i++) {
      let r = Math.random() * (max - min) << 0
      str += String.fromCharCode(r += r > 9 ? r < 36 ? 55 : 61 : 48)
    }
    return `${str}${timestamp}`
  }

  getChatListIndex(chatId: string, chatList: client3N.ChatRoom[]): number {
    let currentChatListIndex: number = null
    const chat = chatList.find((ch, index) => {
      if (ch.chatId === chatId) {
        currentChatListIndex = index
        return true
      }
    })
    return currentChatListIndex
  }

  async readChatList(): Promise<client3N.ChatRoom[]> {
    return await this.rooms.get()
  }

  async saveChatList(chatList: client3N.ChatRoom[]): Promise<void> {
    await this.rooms.save(chatList)
  }

  async readLogChat(chatId: string): Promise<client3N.ChatLog[]> {
    const path = `${chatId}/${CONST.USED_FILES_NAMES.chatLog}`
    return this.log.get(path)
  }

  async updateLogChat(chatId: string, logContent: client3N.ChatLog[]): Promise<void> {
    const path = `${chatId}/${CONST.USED_FILES_NAMES.chatLog}`
    await this.log.save(logContent, path)
  }

  async delChatFolder(chatId: string): Promise<void> {
    const path = `${chatId}`
    await this.log.delete(path)
  }

  async readOutMsg(chatId: string, msgId: string): Promise<client3N.OutgoingMessage> {
    const path = `${chatId}/${msgId}.json`
    return this.outMsg.get(path)
  }

  async saveOutMsg(chatId: string, msg: client3N.OutgoingMessage): Promise<void> {
    // console.log(`Msg to save: ${JSON.stringify(msg, null, 3)}`)
    const path = `${chatId}/${msg.msgId}.json`
    await this.outMsg.save(msg, path)
  }

  async saveLinkLocally(chatId: string, file: web3n.files.File): Promise<void> {
    const path = `${chatId}/${file.name}`
    await this.localStorage.saveLink(file, path)
  }

  async readLinkLocally(chatId: string, fileName: string): Promise<web3n.files.ReadonlyFile> {
    const path = `${chatId}/${fileName}`
    const link = await this.localStorage.readLink(path)
    const file = (await link.target()) as web3n.files.ReadonlyFile
    return file
  }

  async readStatLinkLocally(chatId: string, fileName: string): Promise<client3N.AttachFileInfo> {
    const path = `${chatId}/${fileName}`
    const link = await this.localStorage.readLink(path)
    const target = (await link.target()) as web3n.files.ReadonlyFile
    const stat = await target.stat()
    return {
      name: fileName,
      size: stat.size,
      mode: 'saved'
    }
  }

  async delLocallyChatFolder(chatId: string): Promise<void> {
    const path = `${chatId}`
    const folder = await this.localStorage.get(path)
    if (!!folder) {
      await this.localStorage.delete(path)
    }
  }

}
