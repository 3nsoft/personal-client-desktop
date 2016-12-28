/*
 Copyright (C) 2016 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. */

import * as Constants from "../../common/services/const-srv"; 
import * as Transform from "../../common/services/transform";
import * as CacheSrvMod from "../../common/services/cache-srv";

export let ModulName = "3nweb.services.nav-folder-list-srv";
export let NavFolderListSrvName = "navFolderListService";

export function addService(angular: angular.IAngularStatic): void {
  let mod = angular.module(ModulName, []);
  mod.service(NavFolderListSrvName, Srv);
}

export class Srv {
  fs: web3n.storage.FS = null;
  private initializing: Promise<void> = null;
  
  static $inject = [CacheSrvMod.CacheSrvName];
  constructor(
    private cacheSrv: CacheSrvMod.Cache
    ) {
    this.initializing = w3n.storage.getAppLocalFS("computer.3nweb.mail").then((fs) => { this.fs = fs; this.initializing = null; });
  }
  
  /**
   * функция чтения списка mail folders
   * @returns { {[id: number]: client3N.MailFolderMapping} }
   */
  async readFoldersData(): Promise<{[id: string]: client3N.MailFolderMapping}> {
    if (this.initializing) { await this.initializing; }
    
    let foldersDataMapping: {[id: string]: client3N.MailFolderMapping};
    let foldersDataJSON: {[id: string]: client3N.MailFolderJSON};
    
    let thee = this;
    foldersDataJSON = await this.fs.readJSONFile<{[id: string]: client3N.MailFolderJSON}>("mail-folders.json")
      .catch(async function(exc: web3n.files.FileException) {
        if (!exc.notFound) { throw exc; }
        await thee.fs.writeJSONFile("mail-folders.json", Constants.FOLDERS_DEFAULT);
        return Constants.FOLDERS_DEFAULT;
       });
    
    let messages = angular.copy(this.cacheSrv.messages.list); 
    foldersDataMapping = Transform.foldersJsonToMapping(foldersDataJSON, messages);
 
    this.cacheSrv.folders.list = angular.copy(foldersDataMapping);
    return foldersDataMapping;
  };
  
  /**
   * функция создания/редактирования (имени) mail folders
   * @param folderName {string} - имя создаваемой/редактируемой mail folder
   * @param folderId? {string} - id редактируемой mail folder
   * @return {status: boolean, newFolderId} - status - true/false
   * (false - при попытке внести уже имеющееся имя), newFolderId - id новой
   * созданной или редактируемой mail folder
   */
  async writeFoldersData(folderName: string, folderId?: string): Promise<{status: boolean, newFolderId: string}> {
    if (this.initializing) { await this.initializing; }

    let newFoldeMapping = Transform.newMailFolderMapping();
    let newFolderId: string = null;

    let isSame = this.checkFolderName(folderName);
    if (isSame) {
      return {
        status: false,
        newFolderId: newFolderId
      };
    } else {
      if (folderId) {
        this.cacheSrv.folders.list[folderId].folderName = angular.copy(folderName);
      } else {
        newFolderId = Transform.generateId(this.cacheSrv.folders.list);
        newFoldeMapping = Transform.newMailFolderMapping();
        newFoldeMapping.folderId = newFolderId;
        newFoldeMapping.orderNum = Number(newFolderId);
        newFoldeMapping.folderName = folderName;
        newFoldeMapping.mode = "normal";
        this.cacheSrv.folders.list[newFolderId] = newFoldeMapping;
      }
      // подготовка файла для записи и запись
      await this.writeAllFoldersData(this.cacheSrv.folders.list);
      return {
        status: true,
        newFolderId: (folderId) ? folderId : newFolderId
      };
    }
  };
  
  /**
   * функция проверки имени создаваемой/редактируемой папки
   * на совпадение с уже именищимися
   * @param folderName {string} - имя создаваемой/редактируемой папки
   * @returns {boolean} - true при совпадении
   */
  checkFolderName(folderName: string): boolean {
    let result = false;
    let tmpFoldersList = this.cacheSrv.folders.list;
    for (let id of Object.keys(tmpFoldersList)) {
      result = (tmpFoldersList[id].folderName === folderName) ? true : result;
    }
    return result;
  };

  /**
   * функция записи полного списка mail folders
   * @param folderList {[id: string]: client3N.MailFolderMapping}
   * @returns {Promise<void>}
   */
  async writeAllFoldersData(folderList: {[id: string]: client3N.MailFolderMapping}): Promise<void> {
    if (this.initializing) { await this.initializing; }

    this.cacheSrv.folders.list = angular.copy(folderList);
    let dataToWrite: {[id: string]: client3N.MailFolderJSON} = {};
    for (let key of Object.keys(this.cacheSrv.folders.list)) {
      dataToWrite[key] = Transform.folderMappingToJSON(this.cacheSrv.folders.list[key]);
    }
    await this.fs.writeJSONFile("mail-folders.json", dataToWrite)
      .catch((exc: web3n.files.FileException) => {
        console.error(exc);
      });
    // подсчет количества непрочитанных сообщений
    this.calcUnreadMsg();
  };

  /**
   * функция расчета количества непрочитанных сообщений в mail folders
   * если входной параметр не указывается, то расчет идет по всем папкам;
   * информация сохранятеся в cache service (folders.list[id].qtNoRead)
   * @param folderIds? {string[]} - массив с id mail folders
   */
  calcUnreadMsg(folderIds?: string[]): void {
    let numUnread = 0;
    if (folderIds === undefined) {
      for (let folderId in this.cacheSrv.folders.list) {
        numUnread = 0;
        for (let msgId of this.cacheSrv.folders.list[folderId].messageIds) {
          numUnread = (this.cacheSrv.messages.list[msgId].isRead) ? numUnread : numUnread + 1;
        }
        this.cacheSrv.folders.list[folderId].qtNoRead = numUnread;
      }
    } else {
      for (let folderId of folderIds) {
        numUnread = 0;
        for (let msgId of this.cacheSrv.folders.list[folderId].messageIds) {
          numUnread = (this.cacheSrv.messages.list[msgId].isRead) ? numUnread : numUnread + 1;
        }
        this.cacheSrv.folders.list[folderId].qtNoRead = numUnread;
      }
    }

  };


}