/*
 Copyright (C) 2016 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. */

import * as Constants from "../../common/services/const-srv";
import * as Transform from "../../common/services/transform";
import * as CacheSrvMod from "../../common/services/cache-srv";
import * as NotificationsSrvMod from "../../common/notifications/notifications-srv";
import * as MailAppSrvMod from "./mail-app-srv";

export let ModulName = "3nweb.services.mail-action-srv";
export let MailActionSrvName = "mailActionService";

export function addService(angular: angular.IAngularStatic): void {
  let mod = angular.module(ModulName, []);
  mod.service(MailActionSrvName, Srv);
}

export class Srv {
	fs: web3n.storage.FS = null;
	private initializing: Promise<void> = null;
	
	static $inject = ["$rootScope", "$state", "$stateParams", "$timeout", "$q", "$mdDialog", "$mdToast", CacheSrvMod.CacheSrvName, NotificationsSrvMod.NotificationsSrvName, MailAppSrvMod.MailAppSrvName];
	constructor(
		private $rootScope: angular.IRootScopeService,
		private $state: angular.ui.IStateService,
		private $stateParams: angular.ui.IStateParamsService,
		private $timeout: angular.ITimeoutService,
		private $q: angular.IQService,
		private $mdDialog: angular.material.IDialogService,
		private $mdToast: angular.material.IToastService,
		private cacheSrv: CacheSrvMod.Cache,
		private notificationsSrv: NotificationsSrvMod.Srv,
		private mailAppSrv: MailAppSrvMod.Srv
	) { 
		this.initializing = w3n.storage.getAppLocalFS("computer.3nweb.mail")
			.then((fs) => { this.fs = fs; this.initializing = null; });
	}

	/**
	 * процедура записи сообщения в папку DRAFT
	 */
	async saveMsgInDraftFolder(msg: client3N.MessageJSON, attached: web3n.files.File[]): Promise<void> {
		let errorResult = await this.mailAppSrv.writeMsgData(msg, attached, Constants.SYS_MAIL_FOLDERS.draft);
		let toast: angular.material.ISimpleToastPreset = null;
		
		if (!errorResult) {
			let toast = this.$mdToast.simple()
				.textContent("Letter successful save to DRAFT")
				.action("BACK TO LETTER")
				.highlightAction(true)
				.highlightClass("md-accent")
				.position("bottom right");
			
			this.$mdToast.show(toast)
				.then((response) => {
					if (response === "ok") {
						// this.$state.go("root.mail.folder.message", { msgId: msg.msgId, mode: "edit" });
					} else {
						this.cacheSrv.messages.selectId = null;
						this.cacheSrv.messages.selectMode = "hide";
						(this.$stateParams as any).msgId = "hide";
						(this.$stateParams as any).mode = "hide";
						this.$state.go("root.mail.folder", { folderId: (<any>this.$stateParams).folderId, msgMode: "hide" }, { reload: true });
					}
				})
		} else {
			this.showErrorMessge("Error on message saving!");
		}

	}

	/**
	 * процедура удаления сообщения
	 */
	async deleteMessage(msgId: string): Promise<void> {
		let folderId = this.cacheSrv.messages.list[msgId].folderId;
		let msgKey = this.cacheSrv.messages.list[msgId].msgKey;

		let confirm = this.$mdDialog.confirm()
			.title("Are you sure?")
			.textContent((folderId !== Constants.SYS_MAIL_FOLDERS.trash) ? "The message will move to the Trash!" : "The message will remove!")
			.ariaLabel("delete_message")
			.ok("OK!")
			.cancel("Cancel");
		
		this.$mdDialog.show(confirm)
			.then(() => {
				return this.$q.when(this.mailAppSrv.moveMessageInsideFS(msgKey, true));
			})
			.then((response) => {
				if (response) {
					this.cacheSrv.messages.selectId = null;
					this.cacheSrv.messages.selectMode = "hide";
					(this.$stateParams as any).msgId = "hide";
					(this.$stateParams as any).mode = "hide";
					this.$state.go("root.mail.folder", { folderId: (<any>this.$stateParams).folderId, msgMode: "hide" }, { reload: true });
				} else {
					this.showErrorMessge("Error on deleting message!");
				}
			});
	};

	/**
	 * процедура перемещения выбранного сообщения
	 */
	async movingMessage(msgId: string): Promise<void> {
		let folderId = this.cacheSrv.messages.list[msgId].folderId;
		let msgKey = this.cacheSrv.messages.list[msgId].msgKey;

		this.$mdDialog.show({
			preserveScope: true,
			templateUrl: "./templates/mail/message/msg-move-dialog.html",
			parent: angular.element(document.body),
			clickOutsideToClose: false,
			escapeToClose: true,
			locals: {
				foldersList: this.cacheSrv.folders.list,
				folderId: folderId
			},
			controller: ($scope, $mdDialog, foldersList, folderId) => {
				($scope as any).foldersList = foldersList;
				($scope as any).currentFolder = folderId;

				($scope as any).targetFolderId = null;

				($scope as any).cancel = (): void => {
					($scope as any).targetFoder = null;
					this.$mdDialog.hide(($scope as any).targetFolderId);
				};

				($scope as any).ok = (): void => {
					console.log()
					this.$mdDialog.hide(($scope as any).targetFolderId);
				};

			}
		})
			.then((targetFolder) => {
			console.log(targetFolder)
			if (targetFolder !== null) {
				return this.$q.when(this.mailAppSrv.moveMessageInsideFS(msgKey, true, targetFolder))
					.then((response) => {
						if (response) {
							this.cacheSrv.messages.selectId = null;
							this.cacheSrv.messages.selectMode = "hide";
							(this.$stateParams as any).msgId = "hide";
							(this.$stateParams as any).mode = "hide";
							this.$state.go("root.mail.folder", { folderId: folderId, msgMode: "hide" }, { reload: true });
						} else {
							this.showErrorMessge("Error on moving message!");
						}
					});
			}
		})
	};

	/**
	 * вывод сообщения о неудачном выполнении действия
	 * @param text {string} - текст сообщения
	 * @return {<void>}
	 */
	private showErrorMessge(text: string): void {
		this.$mdToast.show({
			position: "bottom right",
			hideDelay: 1500,
			template: `<md-toast><span md-colors="{color: 'red-500'}">${text}</span></md-toast>`
		});
	};


}