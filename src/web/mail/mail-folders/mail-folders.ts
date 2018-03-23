import * as angularAnimate from 'angular-animate';
/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. */

import * as Transform from '../../common/services/transform-mail';
import * as CacheSrvMod from '../../common/services/cache-srv';
import * as CommonSrvMod from '../../common/services/common-srv';
import * as MailFoldersFsSrvMod from './mail-folders-fs-srv';
import * as MailFoldersSrvMod from './mail-folders-srv';
import * as MailSrvMod from '../mail-app/mail-srv';

export let ModuleName = '3nClient.components.mail-folders';

class Controller {
  private mode: 'show' | 'edit' = 'show';
  private editFolder: client3N.MailFolderMapping;

  static $inject = ['$state', '$stateParams', '$scope', '$timeout', '$q', CacheSrvMod.CacheSrvName, CommonSrvMod.CommonSrvName, MailFoldersFsSrvMod.MailFoldersFsSrvName, MailFoldersSrvMod.MailFoldersSrvName, MailSrvMod.MailSrvName];
	constructor(
    private $state: angular.ui.IStateService,
    private $stateParams: angular.ui.IStateParamsService,
    private $scope: angular.IScope,
    private $timeout: angular.ITimeoutService,
    private $q: angular.IQService,
    private _cacheSrv: CacheSrvMod.Cache,
    private _commonSrv: CommonSrvMod.Srv,
    private _folderFsSrv: MailFoldersFsSrvMod.Srv,
    private _mailFoldersSrv: MailFoldersSrvMod.Srv,
    private _mailSrv: MailSrvMod.Srv
  ) {
    this.selectFolder(this._cacheSrv.folders.selectId);

    this.$scope.$on('client_msgMapChanged', (event, fromFolder) => {
      this.$timeout(() => {
        this._folderFsSrv.calcUnreadMsg();
        this._cacheSrv.messages.unreadMsgQuantity = this._mailSrv.countUnreadMessage()
      });
    });

  }

  /**
   * открытие доп.меню для почтовых папок
   */
	openMenu($mdMenu, ev): void {
		$mdMenu.open(ev);
	}

  /**
   * выбор папки
   */
  selectFolder(folderId: string): void {
    this._cacheSrv.folders.selectId = angular.copy(folderId);
    this.$timeout(() => {
      this._cacheSrv.messages.selectId = null;
      this._cacheSrv.messages.selectMode = 'hide';
    }).then(() => {
      this.$state.go('root.mail.folder', { folderId: folderId, msgId: null });
    });
  }

  /**
   * запуск процедуры создания/редактирования почтовой папки
   * @param folder? {client3N.MailFolderMapping}
   */
  runEditFolder(folder?: client3N.MailFolderMapping): void {
    if (!!folder) {
      this.editFolder = angular.copy(folder);
    } else {
      this.editFolder = Transform.newMailFolderMapping();
    }
    this.mode = 'edit';
    this.$timeout(() => {
      (document.querySelector('input#editFolder') as HTMLInputElement).focus();
    });
  }

  /**
   * функция обработки ввода имени почтовой папки
   */
  preSaveCreateFolder(event: JQueryKeyEventObject): void {
    const keycode = event.keyCode || event.which;
    if (keycode === 13) {
      if (this.editFolder.folderName.length > 0) {
        this.runSaveEditFolder();
      }
    }
    if (keycode === 27) {
      this.cancelCreateFolder();
    }
  };


  /**
   * отмена создания/редактирования почтовой папки
   */
  cancelCreateFolder(): void {
    this.mode = 'show';
    this.editFolder = null;
  }

  /**
   * запуск процедуры сохранения новой/отредактированной почтовой папки
   */
  runSaveEditFolder(): angular.IPromise<void> {
    if (this._mailFoldersSrv.checkFolderName(this.editFolder.folderName)) {
      return this._commonSrv.sysNotification('error', null, `Folders with the name ${this.editFolder.folderName} already exists! Please enter a different name.`)
        .then(() => {
          (document.querySelector('input#editFolder') as HTMLInputElement).focus();
        });
    } else {
      this.editFolder = this._mailFoldersSrv.prepareFolderForWrite(this.editFolder);
      this.$timeout(() => {
        this._cacheSrv.folders.list[this.editFolder.folderId] = angular.copy(this.editFolder);
      })
      .then(() => {
        return this.$q.when(this._folderFsSrv.writeFolderList());
      })
      .then(() => {
        this.mode = 'show';
        const fId = angular.copy(this.editFolder.folderId);
        this.editFolder = null;
        this.selectFolder(fId);
      });
    }
  }

  /**
   * запуск процедуры удаления выбранной почтовой папки
   * @param event {MouseEvent}
   */
  delFolder(event: MouseEvent): void {
    this.$q.when(this._mailFoldersSrv.deleteFolder(event, this._cacheSrv.folders.selectId))
      .then(() => {
        console.log('Папка удалена!');
        this._cacheSrv.folders.selectId = '0';
        this._cacheSrv.messages.selectId = null;
        this.editFolder = null;
        this.$state.transitionTo('root.mail', {}, { reload: true });
        // this.$state.reload();
      });
  }


}

let componentConfig: angular.IComponentOptions = {
  bindings: {},
  templateUrl: './templates/mail/mail-folders/mail-folders.html',
  controller: Controller
}

export function addComponent(angular: angular.IAngularStatic): void {
  let mod = angular.module(ModuleName, []);
  mod.component("mailFolders", componentConfig);
}

Object.freeze(exports);
