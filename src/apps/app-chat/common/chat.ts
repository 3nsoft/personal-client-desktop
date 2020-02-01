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
import * as CONST from '../../../common/const';
import { JsonFromFile } from './base';

export class Chat {
  private rooms: JsonFromFile<client3N.ChatRoom[]>;
  private log: JsonFromFile<client3N.ChatLog[]>;
  private outMsg: JsonFromFile<client3N.OutgoingMessage>;
  private localStorage: JsonFromFile<web3n.files.File>;

  constructor() {
    const chatFsName = CONST.APPS.find(app => app.id === CONST.AppId.Chat).fsName;
    this.rooms = new JsonFromFile(
      w3n.storage.getAppSyncedFS(chatFsName),
      CONST.APP_FILE_NAMES.chatList,
      [],
    );
    this.log = new JsonFromFile(
      w3n.storage.getAppSyncedFS(chatFsName),
      '',
      [],
    );
    this.outMsg = new JsonFromFile(
      w3n.storage.getAppSyncedFS(chatFsName),
      '',
      null,
    );
    this.localStorage = new JsonFromFile(
      w3n.storage.getAppLocalFS(chatFsName),
      '',
      null,
    );
  }

  public generateChatId(timestamp: number): string {
    const min = 10;
    const max = 60;
    let str = '';
    for (let i = 0; i < 18; i++) {
      let r = Math.random() * (max - min) << 0;
      str += String.fromCharCode(r += r > 9 ? r < 36 ? 55 : 61 : 48);
    }
    return `${str}${timestamp}`;
  }

  public getChatListIndex(chatId: string, chatList: client3N.ChatRoom[]): number {
    return chatList.findIndex(chat => chat.chatId === chatId);
  }

  public async readChatList(): Promise<client3N.ChatRoom[]> {
    return await this.rooms.get();
  }

  public async saveChatList(chatList: client3N.ChatRoom[]): Promise<void> {
    await this.rooms.save(chatList);
  }

  public async readLogChat(chatId: string): Promise<client3N.ChatLog[]> {
    const path = `${chatId}/${CONST.APP_FILE_NAMES.chatLog}`;
    return this.log.get(path);
  }

  public async updateLogChat(chatId: string, logContent: client3N.ChatLog[]): Promise<void> {
    const path = `${chatId}/${CONST.APP_FILE_NAMES.chatLog}`;
    await this.log.save(logContent, path);
  }

  public async delChatFolder(chatId: string): Promise<void> {
    const path = `${chatId}`;
    await this.log.delete(path);
  }

  public async readOutMsg(chatId: string, msgId: string): Promise<client3N.OutgoingMessage> {
    const path = `${chatId}/${msgId}.json`;
    return this.outMsg.get(path);
  }

  public async saveOutMsg(chatId: string, msg: client3N.OutgoingMessage): Promise<void> {
    // console.log(`Msg to save: ${JSON.stringify(msg, null, 3)}`)
    const path = `${chatId}/${msg.msgId}.json`;
    await this.outMsg.save(msg, path);
  }

  public async saveLinkLocally(chatId: string, file: web3n.files.File): Promise<void> {
    const path = `${chatId}/${file.name}`;
    await this.localStorage.saveLink(file, path);
  }

  public async readLinkLocally(chatId: string, fileName: string): Promise<web3n.files.ReadonlyFile> {
    const path = `${chatId}/${fileName}`;
    const link = await this.localStorage.readLink(path);
    const file = (await link.target()) as web3n.files.ReadonlyFile;
    return file;
  }

  public async readStatLinkLocally(chatId: string, fileName: string): Promise<client3N.AttachFileInfo> {
    const path = `${chatId}/${fileName}`;
    const link = await this.localStorage.readLink(path);
    const target = (await link.target()) as web3n.files.ReadonlyFile;
    const stat = await target.stat();
    return {
      name: fileName,
      size: stat.size,
      mode: 'saved',
    };
  }

  public async delLocallyChatFolder(chatId: string): Promise<void> {
    const path = `${chatId}`;
    const folder = await this.localStorage.get(path);
    if (!!folder) {
      await this.localStorage.delete(path);
    }
  }
}
