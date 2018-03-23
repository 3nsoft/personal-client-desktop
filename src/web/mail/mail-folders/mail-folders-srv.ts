/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. */

import * as CONST from '../../common/services/const';
import * as LIB from '../../common/services/lib-internal';
import * as Transform from "../../common/services/transform-mail";
import * as CacheSrvMod from "../../common/services/cache-srv";
import * as MailFsSrvMod from '../mail-app/mail-fs-srv';
import * as MailFoldersFsSrvMod from './mail-folders-fs-srv';

export let ModuleName = "3nClinet.services.nav-folder-list-srv";
export let MailFoldersSrvName = "mailFoldersService";

export function addService(angular: angular.IAngularStatic): void {
  let mod = angular.module(ModuleName, []);
  mod.service(MailFoldersSrvName, Srv);
}

export class Srv {
  private fs: web3n.files.FS = null;
  private initializing: Promise<void> = null;

  static $inject = ['$state', '$q', '$timeout', '$mdDialog', CacheSrvMod.CacheSrvName, MailFsSrvMod.MailFsSrvName, MailFoldersFsSrvMod.MailFoldersFsSrvName];
  constructor(
    private $state: angular.ui.IStateService,
    private $q: angular.IQService,
    private $timeout: angular.ITimeoutService,
    private $mdDialog: angular.material.IDialogService,
    private _cacheSrv: CacheSrvMod.Cache,
    private _mailFsSrv: MailFsSrvMod.Srv,
    private _folderFsSrv: MailFoldersFsSrvMod.Srv
  ) { 
    this.initializing = w3n.storage.getAppLocalFS(`${CONST.FS_USED.MAIL}`).then((fs) => { this.fs = fs; this.initializing = null; });
  }

  /**
   * функция подготовки записи почтовых папок после создания/редкатирования выбранной папки
   * @param folder {client3N.MailFolderMapping}
   * @returns {client3N.MailFolderMapping}
   */
  prepareFolderForWrite(folder: client3N.MailFolderMapping): client3N.MailFolderMapping {
    let tmpFolder = folder;
    if (!folder.folderId) {
      tmpFolder.folderId = Transform.generateId(this._cacheSrv.folders.list);
      tmpFolder.orderNum = Number(tmpFolder.folderId);
      tmpFolder.mode = 'normal';
    }
    return tmpFolder;
  }

  /**
   * функция проверки имени создаваемой/редактируемой папки
   * на совпадение с уже именищимися
   * @param folderName {string} - имя создаваемой/редактируемой папки
   * @returns {boolean} - true при совпадении
   */
   checkFolderName(folderName: string): boolean {
    let result = false;
    for (let id of Object.keys(this._cacheSrv.folders.list)) {
      result = ((this._cacheSrv.folders.list[id].folderName).toLocaleLowerCase() === folderName.toLocaleLowerCase()) ? true : result;
    }
    return result;
  }

  /**
   * функция удаления папки
   * @param event {MouseEvent}
   * @param folderId {string}
   * @returns Promise<void>
   */
  deleteFolder(event: MouseEvent, folderId: string): angular.IPromise<void> {
    if (!this._cacheSrv.folders.list[folderId].isSystem) {
      const confirm = this.$mdDialog.confirm()
        .title('Are you sure?')
        .textContent('All messages from the remote folder will be moved to the Trash folder.')
        .ariaLabel('delete dialog')
        .targetEvent(event)
        .ok('OK!')
        .cancel('Cancel');
      
      return this.$mdDialog.show(confirm)
        .then(() => {
          // при удалении папки все сообщения из удаляемой папки
          // необходимо переместить в папку "Trash"
          const relocatableMessages = angular.copy(this._cacheSrv.folders.list[folderId].messageIds);
          if (relocatableMessages.length > 0) {
            let movePromises: Promise<boolean>[] = [];
            for (let msgId of relocatableMessages) {
              const promiseItem = this._mailFsSrv.moveMsgInsideFS(msgId, CONST.SYS_MAIL_FOLDERS.trash);
              movePromises.push(promiseItem);
            }

            return this.$q.when(LIB.waitAll(movePromises))
              .then(res => {
                delete this._cacheSrv.folders.list[folderId];
                this.$q.when(this._folderFsSrv.writeFolderList());
                this.$q.when(this._mailFsSrv.writeMsgList());
              });

          } else {
            delete this._cacheSrv.folders.list[folderId];
            this.$q.when(this._folderFsSrv.writeFolderList());
          }
          this.$state.transitionTo('root.mail', {}, { reload: true });
        });
    }
  }


}