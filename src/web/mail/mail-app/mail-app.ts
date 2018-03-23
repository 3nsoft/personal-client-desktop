/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. */

import * as CONST from '../../common/services/const';
import * as Transform from '../../common/services/transform-mail';
import * as CacheSrvMod from '../../common/services/cache-srv';
import * as MailSrvMod from '../mail-app/mail-srv';
import * as MsgEditSrvMod from '../message/msg-edit/msg-edit-srv';

export let ModuleName = '3nClient.components.mail-app';

class Controller {

  static $inject = ['$scope', '$state', '$stateParams', '$timeout', MsgEditSrvMod.MsgEditSrvName, CacheSrvMod.CacheSrvName, MailSrvMod.MailSrvName];
  constructor(
    private $scope: angular.IScope,
    private $state: angular.ui.IStateService,
    private $stateParams: angular.ui.IStateParamsService,
    private $timeout: angular.ITimeoutService,
    private _msgEditSrv: MsgEditSrvMod.Srv,
    private _cacheSrv: CacheSrvMod.Cache,
    private _mailSrv: MailSrvMod.Srv
  ) {  }

  /**
   * создание нового сообщения
   */
  createNewMsg(): void {
    let newMsg = Transform.newMessageEditContent();
    newMsg.mailAddress = this._cacheSrv.username;
    this._msgEditSrv.editMsg(newMsg)
      .then(res => {
        console.info(res);
        if (res.status === 'close_with_save') {
          if (this.$stateParams.folderId !== CONST.SYS_MAIL_FOLDERS.outbox) {
            (this.$state as any).reload('root.mail.folder');
          } else {
            this.$state.transitionTo('root.mail.folder', { folderId: CONST.SYS_MAIL_FOLDERS.outbox }, { reload: true });
          }  
        }

        if (res.status === 'sending') {
          switch (this.$stateParams.folderId) {
            case CONST.SYS_MAIL_FOLDERS.outbox:
              this.$state.transitionTo('root.mail.folder', { folderId: CONST.SYS_MAIL_FOLDERS.outbox }, { reload: true });
              break;
            case CONST.SYS_MAIL_FOLDERS.draft:
              this.$state.transitionTo('root.mail.folder', { folderId: CONST.SYS_MAIL_FOLDERS.draft }, { reload: true });
              break;
            case CONST.SYS_MAIL_FOLDERS.sent:
              this.$state.transitionTo('root.mail.folder', { folderId: CONST.SYS_MAIL_FOLDERS.sent }, { reload: true });
              break;
          }
        }

      })
      .catch(err => {
        console.info(err);
      });
  }

}

let componentConfig: angular.IComponentOptions = {
  bindings: {},
  templateUrl: './templates/mail/mail-app/mail-app.html',
  controller: Controller
}

export function addComponent(angular: angular.IAngularStatic): void {
  let mod = angular.module(ModuleName, []);
  mod.component('mailApp', componentConfig);
}

Object.freeze(exports);
