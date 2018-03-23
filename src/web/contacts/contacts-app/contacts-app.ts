/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. */

import * as TransformM from '../../common/services/transform-mail';
import * as LIB from '../../common/services/lib-internal';
import * as CONST from '../../common/services/const';
import * as CacheSrvMod from "../../common/services/cache-srv";
import * as PersonEditSrvMod from "../person/person-edit-srv";
import * as ContactsSrvMod from "./contacts-app-srv";
import * as MsgEditSrvMod from '../../mail/message/msg-edit/msg-edit-srv';
import { logError } from '../../common/libs/logging';

export let ModuleName = "3nClient.components.contacts-app";

class Controller {

  static $inject = ["$scope", "$state", "$stateParams", "$q", "$timeout", CacheSrvMod.CacheSrvName, PersonEditSrvMod.PersonEditSrvName, ContactsSrvMod.ContactsAppSrvName, MsgEditSrvMod.MsgEditSrvName];
  constructor(
    private $scope: angular.IScope,
    private $state: angular.ui.IStateService,
    private $stateParams: angular.ui.IStateParamsService,
    private $q: angular.IQService,
    private $timeout: angular.ITimeoutService,
    private cacheSrv: CacheSrvMod.Cache,
    private personEditSrv: PersonEditSrvMod.Srv,
    private contactSrv: ContactsSrvMod.Srv,
    private msgEditSrv: MsgEditSrvMod.Srv
  ) {

    this.$timeout(() => {
      if (!!this.$stateParams.pId) {
        this.cacheSrv.contacts.select = angular.copy(this.$stateParams.pId);
        this.$state.go('root.contacts.person', { personId: this.cacheSrv.contacts.select });
      } else {
        this.cacheSrv.contacts.select = null;
        this.cacheSrv.contacts.cMode = "hide";
      }  
    });

  }

  editPerson(personId: string): void {
    this.cacheSrv.contacts.cMode = "create";
    this.personEditSrv.openPersonEdit(personId);
    this.$timeout(() => {
      this.cacheSrv.contacts.select = null;
    });
  };

  runDeleteMarkPersons(): angular.IPromise<void> {
    return this.$q.when(this.contactSrv.deleteMarkPersons(this.cacheSrv.contacts.marked))
      .then(res => {
        this.cacheSrv.contacts.select = null;
        this.cacheSrv.contacts.marked = [];
        this.cacheSrv.contacts.cMode = "hide";
        this.$state.reload();
      })
      .catch(err => {
				logError(err)
				this.cacheSrv.contacts.select = null;
        this.cacheSrv.contacts.marked = [];
        this.cacheSrv.contacts.cMode = "hide";
        this.$state.reload();
			})
  };

  runSetFlagMarkPersons(flag: string): void {
    this.contactSrv.setFlagMarkPersons(this.cacheSrv.contacts.marked, flag);
  };

  cancelMarkPersons(): void {
    this.$timeout(() => {
      this.cacheSrv.contacts.marked = [];
    });  
  };

  goGroups(): void {
    this.$state.go("root.groups");
  };

  createNewMsg(): void {
    this.cacheSrv.messages.selectId = 'new';
		this.cacheSrv.general.appSelected = CONST.APPS.contacts.app;
		let newMsg = TransformM.newMessageEditContent();
    newMsg.mailAddress = this.cacheSrv.username;
    for (let contactId of this.cacheSrv.contacts.marked) {
      newMsg.mailAddressTO.push(this.cacheSrv.contacts.list[contactId].mails[0]);
      newMsg.alias.mailAddressTO.push(LIB.findNameByMail(this.cacheSrv.contacts.list, this.cacheSrv.contacts.list[contactId].mails[0]));
    }
		this.msgEditSrv.editMsg(newMsg)
			.then(res => {
        console.info(res);
        this.cacheSrv.contacts.marked = [];
        switch (res.status) {
          case 'close_with_save':
            this.cacheSrv.general.appSelected = CONST.APPS.mail.app;
            this.$state.go('root.mail.folder', {folderId: CONST.SYS_MAIL_FOLDERS.draft, msgId: res.msgId});
            break;
          case 'close_without_save':
            break;
          default:
            this.$state.transitionTo('root.contacts', { pId: null }, { reload: true });
        }

					// (this.$state as any).reload('root.contacts.person');
      })
      .catch(err => {
        console.info(err);
      });

  };


}

let componentConfig: angular.IComponentOptions = {
  bindings: {},
  templateUrl: "./templates/contacts/contacts-app/contacts-app.html",
  controller: Controller
}

export function addComponent(angular: angular.IAngularStatic): void {
  let mod = angular.module(ModuleName, []);
  mod.component("contactsApp", componentConfig);
}

Object.freeze(exports);
