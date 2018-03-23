/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. */

import * as CONST from '../const';
import * as LIB from '../lib-internal';
import { SingleProc } from '../processes';
import * as MsgSrvMod from '../../../mail/mail-app/mail-fs-srv';
import * as CacheSrvMod from '../cache-srv';
import { logError } from '../../libs/logging';

export const ModuleName = '3nClient.services.tags';
export const TagsSrvName = 'tagsService';

export function addService(angular: angular.IAngularStatic): void {
	const mod = angular.module(ModuleName, []);
	mod.service(TagsSrvName, Srv);
}

interface TagScope extends angular.IScope {
	closeForm(): void;
}

export class Srv {
	private fs: web3n.files.WritableFS = null;
	private initializing: Promise<void> = null;
	private tagListSavingProc = new SingleProc();

	static $inject = ['$rootScope', '$q', '$mdDialog', CacheSrvMod.CacheSrvName, MsgSrvMod.MailFsSrvName];
	constructor(
		private $rootScope: angular.IRootScopeService,
		private $q: angular.IQService,
		private $mdDialog: angular.material.IDialogService,
		private _cacheSrv: CacheSrvMod.Cache,
		private _msgSrv: MsgSrvMod.Srv
	) { 
		this.initializing = w3n.storage.getAppSyncedFS(`${CONST.FS_USED.TAGS}`).then((fs) => { this.fs = fs; this.initializing = null; });
	}

	openTagsService(): angular.IPromise<any> {
		return (this.$mdDialog as any).show({
			parent: angular.element(document.body),
      clickOutsideToClose: false,
      escapeToClose: false,
      fullscreen: false,
      templateUrl: './templates/common/services/tags/tags-srv.html',
			controller: ['$scope', '$mdDialog', ($scope: TagScope, $mdDialog: angular.material.IDialogService) => {
				
				$scope.closeForm = (): void => {
					$mdDialog.cancel('User close form!');
				};

			}]
		})
			.then((res) => {
				console.log(res);
			}, (err) => {
				logError(err);
			});
	}
	
	/**
	 * функция чтения списка тэгов
	 */
	async readTagList(): Promise<void> {
		if (this.initializing) { await this.initializing; }
		let tagList = await this.fs.readJSONFile<client3N.Tag[]>(CONST.USED_FILES_NAMES.tags)
			.catch(async (exc: web3n.files.FileException) => {
				if (!exc.notFound) { throw exc; }
				return [];
			});
		this._cacheSrv.tags.list = (!tagList) ? [] : angular.copy(tagList);
	}
	
	/**
	 * функция записи списка тэгов
	 */
	async writeTagList(): Promise<boolean> {
		if (this.initializing) { await this.initializing; }
		let result = true;
		await this.tagListSavingProc.startOrChain(async () => {
			await this.fs.writeJSONFile(CONST.USED_FILES_NAMES.tags, this._cacheSrv.tags.list)
				.catch(async function (exc: web3n.files.FileException) {
					logError(exc);
					result = false;
				});
		});
		return result;
	}

	/**
	 * функция проверки имени создаваемого/редактируемого tag на совпадение с уже имеющимся
	 * @param tagName {string}
	 * @return {boolean}
	 */
	checkTagName(tagName: string): boolean {
		return this._cacheSrv.tags.list.some((item) => {
			return item.name.toLocaleLowerCase() === tagName.toLocaleLowerCase();
		});
	}

	/**
	 * изменение названия тэга в сообщениях при переимновании тэга в сервисе тэгов
	 * @param tagOldName {string}
	 * @param tagNewName {string}
	 */
	renameTagInMessages(tagOldName: string, tagNewName: string) {
		const msgIdList = Object.keys(this._cacheSrv.messages.list);
		msgIdList.forEach(msgId => {
			const tagPosition = this._cacheSrv.messages.list[msgId].labels.indexOf(tagOldName);
			if (tagPosition > -1) {
				this._cacheSrv.messages.list[msgId].labels.splice(tagPosition, 1, tagNewName);
			}
		});
		this._msgSrv.writeMsgList();
		// TODO возможно необходимо будет обновлять текущий STATE (например, если как раз сейчас было выбрано какое-то сообщение для просмотра)
	}

	/**
	 * удаление тэга
	 * @param event {MouseEvent}
	 * @param tagIndex {number}
	 */
	deleteTag(event: MouseEvent, tagIndex: number): angular.IPromise<boolean> {
		if (this._cacheSrv.tags.list[tagIndex].qt === 0) {
			this._cacheSrv.tags.list.splice(tagIndex, 1);
			return this.$q.when(this.writeTagList());
		} else {
			const dialog: any = {
				targetEvent: event,
				template: `
					<md-dialog aria-label="delete dialog" ng-class="dialog.css" role="dialog" tabindex="-1">
						<md-dialog-content class="md-dialog-content" role="document" tabindex="-1">
							<h2 class="md-title">Are you sure?</h2>
							<div class="md-dialog-content-body">
								<p>The tag will be deleted from anywhere where it was encountered.</p>
							</div>
						</md-dialog-content>
						<md-dialog-actions>
							<md-button class="md-primary md-cancel-button" ng-click="cancelProcedure()">
								Cancel
							</md-button>
							<md-button class="md-primary md-confirm-button" ng-click="continueProcedure()">
								OK!
							</md-button>
						</md-dialog-actions>
					</md-dialog>
				`,
				escapeToClose: true,
				multiple: true,
				controller: function ($scope, $mdDialog) {
					$scope.cancelProcedure = function() {
						$mdDialog.cancel('cancel');
					};
					$scope.continueProcedure = function () {
						$mdDialog.hide();
					};
				}
			};
			
			return this.$mdDialog.show(dialog)
				.then(() => {
					console.log('OK');
					const deletableTag = angular.copy(this._cacheSrv.tags.list[tagIndex]).name;
					const msgIdList = Object.keys(this._cacheSrv.messages.list);
					msgIdList.forEach(msgId => {
						const deletableTagCurrentIndex = this._cacheSrv.messages.list[msgId].labels.indexOf(deletableTag);
						if (deletableTagCurrentIndex !== -1) {
							this._cacheSrv.messages.list[msgId].labels.splice(deletableTagCurrentIndex, 1);
						}
					});
					this._cacheSrv.tags.list.splice(tagIndex, 1);
					return this.$q.when(this._msgSrv.writeMsgList());
				})
				.then(() => {
					return this.$q.when(this.writeTagList());
				})
				.then(() => {
					return true;
				})
				.catch(err => {
					console.log('CANCEL');
					if (err === 'cancel') {
						return false;	
					} else {
						throw (err);
					}
				});		
			
		}
	}

}