/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. */

import * as CONST from "../../common/services/const";
import * as TransformC from "../../common/services/transform-contact";
import * as TransformM from '../../common/services/transform-mail';
import * as Lib from "../../common/services/lib-internal";
import * as CacheSrv from "../../common/services/cache-srv";
import * as ContactsAppSrv from "../contacts-app/contacts-app-srv";
import * as GroupEditSrvMod from "./group-edit-srv";
import * as MsgEditSrvMod from '../../mail/message/msg-edit/msg-edit-srv';

export let ModuleName = "3nClient.components.group";

class Controller {
  group: client3N.GroupJSON;
  selectedPersonId: string; 

  static $inject = ["$scope", "$state", "$stateParams", "$q", "$timeout", "$filter", CacheSrv.CacheSrvName, ContactsAppSrv.ContactsAppSrvName, GroupEditSrvMod.GroupEditSrvName, MsgEditSrvMod.MsgEditSrvName];
  constructor(
    private $scope: angular.IScope,
    private $state: angular.ui.IStateService,
    private $stateParams: angular.ui.IStateParamsService,
		private $q: angular.IQService,
		private $timeout: angular.ITimeoutService,
		private $filter: any,
		private cacheSrv: CacheSrv.Cache,
    private contactSrv: ContactsAppSrv.Srv,
    private groupSrv: GroupEditSrvMod.Srv,
    private msgEditSrv: MsgEditSrvMod.Srv
  ) {
    this.selectedPersonId = null;

    this.$scope.$on("client_saveGroup", (event, data: { groupDataToEdit: client3N.GroupJSON }) => {
      this.$timeout(() => {
        this.group = data.groupDataToEdit;
      });
    });
  }

  invertColor(color: string): string {
    return Lib.invertColor(color);
  }

  /**
	 * открытие доп меню группы
	 */
	openMenu($mdOpenMenu, ev): void {
		$mdOpenMenu(ev);
  }
  
  /**
	 * открытие группы на редактирование
	 */
  editGroup(): void {
    this.selectedPersonId = null;
    this.groupSrv.openGroupEdit(this.group.groupId, false, this.group);
	}

	/**
	 * удаление группы
	 */
  deleteGroup(): void {
    this.contactSrv.deleteGroup(this.group.groupId);
  }
  
  selectPerson(event: JQueryEventObject, personId: string): void {
    this.selectedPersonId = personId;
  }

  runEditMembers(): void {
    this.selectedPersonId = null;
    this.groupSrv.openGroupEdit(this.group.groupId, true, this.group);
  }

  /**
   * создание нового сообщения для группы контактов или 1 контакта из группы
   * @param mail? {string}
   */
  createNewMsgGroup(mail?: string): void {    
    this.cacheSrv.messages.selectId = 'new';
		this.cacheSrv.general.appSelected = CONST.APPS.groups.app;
    let newMsg = TransformM.newMessageEditContent();
    newMsg.mailAddress = this.cacheSrv.username;

    if (!!mail) {
      // для 1 контакта из группы
      newMsg.mailAddressTO = [mail];
      newMsg.alias.mailAddressTO = [Lib.findNameByMail(this.cacheSrv.contacts.list, mail)];
    } else {
      // для группы контактов
      for (let personId of this.cacheSrv.groups.list[this.group.groupId].members) {
        newMsg.mailAddressTO.push(this.cacheSrv.contacts.list[personId].mails[0]);
      }
      for (let item of newMsg.mailAddressTO) {
        newMsg.alias.mailAddressTO.push(Lib.findNameByMail(this.cacheSrv.contacts.list, item));
      }
    }  

		this.msgEditSrv.editMsg(newMsg)
			.then(res => {
        console.info(res);
        switch (res.status) {
          case 'close_with_save':
            this.cacheSrv.general.appSelected = CONST.APPS.mail.app;
            this.$state.go('root.mail.folder', {folderId: CONST.SYS_MAIL_FOLDERS.draft, msgId: res.msgId});
            break;
          case 'close_without_save':
            break;
          default:
            this.cacheSrv.groups.select = angular.copy(this.group.groupId);
            this.$state.transitionTo('root.groups', { grId: this.group.groupId }, { reload: true });
        }
      })
      .catch(err => {
        console.info(err);
      });

  }

}

let componentConfig: angular.IComponentOptions = {
  bindings: {
    group: "<"
  },
  templateUrl: "./templates/contacts/group/group.html",
  controller: Controller
}

export function addComponent(angular: angular.IAngularStatic): void {
  let mod = angular.module(ModuleName, []);
  mod.component("group", componentConfig);
}

Object.freeze(exports);
