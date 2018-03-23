/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. */

import * as CONST from '../../common/services/const';
import * as Transform from "../../common/services/transform-mail";
import * as CacheSrvMod from "../../common/services/cache-srv";
import { logError } from '../../common/libs/logging';

export let ModuleName = "3nClinet.services.folders-fs-srv";
export let MailFoldersFsSrvName = "mailFoldersFsService";

export function addService(angular: angular.IAngularStatic): void {
  let mod = angular.module(ModuleName, []);
  mod.service(MailFoldersFsSrvName, Srv);
}

export class Srv {
  private fs: web3n.files.WritableFS = null;
  private initializing: Promise<void> = null;

  static $inject = [CacheSrvMod.CacheSrvName];
  constructor(
    private _cacheSrv: CacheSrvMod.Cache
  ) { 
    this.initializing = w3n.storage.getAppLocalFS(`${CONST.FS_USED.MAIL}`).then((fs) => { this.fs = fs; this.initializing = null; });
  }

  /**
   * функция чтения списка почтовых папок c "помещением" информации в cacheSrv
   * @return {{[id: string]: client3N.MailFolderMapping}}
   */
  async readFolderList(): Promise<{[id: string]: client3N.MailFolderMapping}> {
    if (this.initializing) { await this.initializing; }

    let foldersDataMapping: {[id: string]: client3N.MailFolderMapping};
    const messages = this._cacheSrv.messages.list;

    const foldersDataJSON: {[id: string]: client3N.MailFolderJSON} = await this.fs.readJSONFile<{[id: string]: client3N.MailFolderJSON}>(CONST.USED_FILES_NAMES.mailFolders)
      .catch(async (exc: web3n.files.FileException) => {
        if (!exc.notFound) {
          logError(exc);
        } else {
          await this.fs.writeJSONFile(CONST.USED_FILES_NAMES.mailFolders, CONST.FOLDERS_DEFAULT);
        }
        foldersDataMapping = Transform.foldersJsonToMapping(CONST.FOLDERS_DEFAULT, messages);
        this._cacheSrv.folders.list = foldersDataMapping;
        return foldersDataMapping;
      });

    foldersDataMapping = Transform.foldersJsonToMapping(foldersDataJSON, messages);
    this._cacheSrv.folders.list = foldersDataMapping;
    return foldersDataMapping;
  }

  /**
   * функция записи списка почтовых папок, хранящихся в cache service
   * @returns { Promise<void> }
   */
  async writeFolderList(): Promise<void> {
    if (this.initializing) { await this.initializing; }
    let dataToWrite: {[id: string]: client3N.MailFolderJSON} = {};
    for (let id of Object.keys(this._cacheSrv.folders.list)) {
      dataToWrite[id] = Transform.folderMappingToJSON(this._cacheSrv.folders.list[id]);
    }
    await this.fs.writeJSONFile(CONST.USED_FILES_NAMES.mailFolders, dataToWrite)
      .catch((exc: web3n.files.FileException) => {
        logError(exc);
      });
    this.calcUnreadMsg();    
  }  

  /**
   * функция расчета количества непрочитанных сообщений в mail folders
   * если входной параметр не указывается, то расчет идет по всем папкам;
   * информация сохранятеся в cache service (folders.list[id].qtNoRead)
   * @param folderIds? {string[]} - массив с id mail folders
   */
  calcUnreadMsg(folderIds?: string[]): void {
    if (!folderIds) {
      for (let folderId in this._cacheSrv.folders.list) {
        let numUnread = 0;
        for (let msgId of this._cacheSrv.folders.list[folderId].messageIds) {
          numUnread = (this._cacheSrv.messages.list[msgId].isRead) ? numUnread : numUnread + 1;
        }
        this._cacheSrv.folders.list[folderId].qtNoRead = numUnread;
      }
    } else {
      for (let folderId of folderIds) {
        let numUnread = 0;
        for (let msgId of this._cacheSrv.folders.list[folderId].messageIds) {
          numUnread = (this._cacheSrv.messages.list[msgId].isRead) ? numUnread : numUnread + 1;
        }
        this._cacheSrv.folders.list[folderId].qtNoRead = numUnread;
      }
    }
  }  

}