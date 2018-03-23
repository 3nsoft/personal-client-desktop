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
import * as PersonEditSrv from "./person-edit-srv";
import * as MsgEditSrvMod from '../../mail/message/msg-edit/msg-edit-srv';
import { logError } from '../../common/libs/logging';

export let ModuleName = "3nClient.components.person";

class Controller {
	contact: client3N.PersonJSON;
	groupList: string;
	dataForm: client3N.PersonDataToEdit;

  static $inject = ["$scope", "$state", "$stateParams", "$q", "$timeout", "$filter", CacheSrv.CacheSrvName, ContactsAppSrv.ContactsAppSrvName, PersonEditSrv.PersonEditSrvName, MsgEditSrvMod.MsgEditSrvName];
  constructor(
    private $scope: angular.IScope,
		private $state: angular.ui.IStateService,
		private $stateParams: angular.ui.IStateParamsService,
		private $q: angular.IQService,
		private $timeout: angular.ITimeoutService,
		private $filter: any,
		private cacheSrv: CacheSrv.Cache,
		private contactSrv: ContactsAppSrv.Srv,
		private personSrv: PersonEditSrv.Srv,
		private msgEditSrv: MsgEditSrvMod.Srv
  ) {
		this.init();
		this.$timeout(() => {
			this.dataForm = {
				personId: this.contact.personId,
				nickName: this.contact.nickName,
				fullName: this.contact.fullName,
				phone: this.contact.phone,
				notice: this.contact.notice,
				avatar: this.contact.avatar,
				mails: this.cacheSrv.contacts.list[this.contact.personId].mails,
				groups: this.cacheSrv.contacts.list[this.contact.personId].groups
			};
			console.log(this.cacheSrv.contacts);
			console.log(this.dataForm);
		});

		this.$scope.$on("client_savePerson", (event, data: { personDataToEdt: client3N.PersonDataToEdit, isMap?: boolean }) => {
			this.init();
			this.$timeout(() => {
				if (!!data.isMap) {
					this.dataForm = {
						personId: this.contact.personId,
						nickName: this.contact.nickName,
						fullName: this.contact.fullName,
						phone: this.contact.phone,
						notice: this.contact.notice,
						avatar: this.contact.avatar,
						mails: this.cacheSrv.contacts.list[this.contact.personId].mails,
						groups: this.cacheSrv.contacts.list[this.contact.personId].groups
					};
				} else {
					this.dataForm = data.personDataToEdt;
				}
			});
		});

  }

	/**
	 * инициализация
	 */
	init(): void {
		this.$timeout(() => {
			let personMap = this.cacheSrv.contacts.list[this.contact.personId];
			let groupsArr = personMap.groups.map((item, i,arr) => {
				return this.cacheSrv.groups.list[item].name;
			});
			this.groupList = groupsArr.join(", ");
		})
	};

	/**
	 * открытие доп меню контакта
	 */
	openMenu($mdOpenMenu, ev): void {
		$mdOpenMenu(ev);
	};

	/**
	 * открытие контакта на редактирование
	 */
	editPerson(): void {
		this.personSrv.openPersonEdit(this.dataForm.personId, this.dataForm);
	};

	/**
	 * удаление контакта
	 */
	deletePerson(): angular.IPromise<void> {
		let personsForDeleting = [this.contact.personId]
		return this.$q.when(this.contactSrv.deleteMarkPersons(personsForDeleting))
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

	/**
	 * установка флагов "isConfirm" (confirm) и "inBlackList" (b-list)
	 */
	flagOn(flag: string): void {
		let personsForSetFlag = [this.contact.personId];
		this.contactSrv.setFlagMarkPersons(personsForSetFlag, flag);
	};

	/**
	 * создание нового сообщения
	 */
	createNewMsg(): void {
		this.cacheSrv.messages.selectId = 'new';
		this.cacheSrv.general.appSelected = CONST.APPS.contacts.app;
		let newMsg = TransformM.newMessageEditContent();
		newMsg.mailAddress = this.cacheSrv.username;
		newMsg.mailAddressTO = [this.dataForm.mails[0]];
		newMsg.alias.mailAddressTO.push(Lib.findNameByMail(this.cacheSrv.contacts.list, newMsg.mailAddressTO[0]));
		this.msgEditSrv.editMsg(newMsg)
			.then(res => {
				console.info(res);
				switch (res.status) {
					case 'close_with_save':
						this.cacheSrv.general.appSelected = CONST.APPS.mail.app;
						this.$state.go('root.mail.folder', { folderId: CONST.SYS_MAIL_FOLDERS.draft, msgId: res.msgId });
						break;
					case 'close_without_save':
						break;
					default:
						this.cacheSrv.contacts.select = angular.copy(this.contact.personId);
						this.$state.transitionTo('root.contacts', { pId: this.contact.personId }, { reload: true });
				}
      })
      .catch(err => {
        console.info(err);
      });
	};

}

let componentConfig: angular.IComponentOptions = {
	bindings: {
		contact: "<data"
	},
  templateUrl: "./templates/contacts/person/person.html",
  controller: Controller
}

export function addComponent(angular: angular.IAngularStatic): void {
  let mod = angular.module(ModuleName, []);
  mod.component("person", componentConfig);
}

Object.freeze(exports);
