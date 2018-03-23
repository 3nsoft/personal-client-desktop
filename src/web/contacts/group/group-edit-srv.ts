/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. */

import * as Lib from "../../common/services/lib-internal";
import * as TransformC from "../../common/services/transform-contact";
import * as CONST from "../../common/services/const";
import * as CacheSrvMod from "../../common/services/cache-srv";
import * as ContactsAppSrvMod from "../contacts-app/contacts-app-srv";

export let ModuleName = "3nClient.services.group-edit-srv";
export let GroupEditSrvName = "groupEditService";

export function addService(angular: angular.IAngularStatic): void {
  let mod = angular.module(ModuleName, [CacheSrvMod.ModuleName]);
  mod.service(GroupEditSrvName, Srv);
}

export class Srv {
	fs: web3n.files.WritableFS = null;
	private initializing: Promise<void> = null;

	static $inject = ["$rootScope", "$state", "$stateParams", "$q", "$timeout", "$mdDialog", CacheSrvMod.CacheSrvName, ContactsAppSrvMod.ContactsAppSrvName];
	constructor(
		private $rootScope: angular.IRootScopeService,
		private $state: angular.ui.IStateService,
		private $stateParams: angular.ui.IStateParamsService,
		private $q: angular.IQService,
		private $timeout: angular.ITimeoutService,
		private $mdDialog: angular.material.IDialogOptions,
		private cacheSrv: CacheSrvMod.Cache,
		private contactAppSrv: ContactsAppSrvMod.Srv
	) {
		this.initializing = w3n.storage.getAppSyncedFS(`${CONST.FS_USED.CONTACTS}`).then((fs) => { this.fs = fs; this.initializing = null; });
	}

  /**
   * открытие модального окна
   * @param groupId {string}
	 * @param onlyMembers {boolean} - если true, то открывается блок  добавления контактов в группу
   * @param content? {client3N.GroupJSON} - параметр передается, если полные данные по группе уже прочитаны
   */
	async openGroupEdit(groupId: string, onlyMembers: boolean, content?: client3N.GroupJSON): Promise<void> {

  	(this.$mdDialog as any).show({
			parent: angular.element(document.body),
			clickOutsideToClose: false,
			escapeToClose: true,
			templateUrl: "templates/contacts/group/group-edit.html",
			fullscreen: true,
			controllerAs: "ctrl",
			controller: ["$scope", "$mdDialog", CacheSrvMod.CacheSrvName, "group", ($scope, $mdDialog: angular.material.IDialogService, cacheSrv: CacheSrvMod.Cache, group: { data: client3N.GroupJSON, dataMap: client3N.GroupMapping, part: number }) => {
				console.log(group);
				$scope.group = {
          data: angular.copy(group.data),
					dataMap: angular.copy(group.dataMap)
				};

				$scope.part = group.part;
				$scope.filterName = "";
				$scope.contacts = {
					list: cacheSrv.contacts.list,
					letters: Lib.getAllLetters(cacheSrv.contacts.list)
				};

				/**
         * закрыть модальное окно
         */
        $scope.closeModal = () => {
          // this.cacheSrv.contacts.cMode = "hide";
          $mdDialog.hide("cancel");
				};

				/**
				 * фильтр по имени
				 */
				$scope.searchName = (search: string): Function => {
					return (person: client3N.PersonMapping) => {
						if (person.nickName.toLocaleLowerCase().indexOf(search.toLocaleLowerCase()) > -1) {
						return true;
					}
					return false;
					}
				};

        $scope.invertColor = (color: string): string => {
      		return Lib.invertColor(color);
        };

				/**
				 * переход по частям формы создания/редактирования группы
				 */
				$scope.next = () => {
					$scope.part = ($scope.part === 1) ? 2 : 1;
				};

				/**
				 * пометка контактов для добавления в группу
				 * @param event {JQueryEventObject}
				 * @param personId {string}
				 * @return {void}
				 */
				$scope.markPersons = (event: JQueryEventObject, personId: string): void => {
					let elemClass = event.target.className;
			    if (elemClass.indexOf("avatar-field") > -1) {
						let personIndex = $scope.group.dataMap.members.indexOf(personId);
						if (personIndex > -1) {
							$scope.group.dataMap.members.splice(personIndex, 1);
			      } else {
							$scope.group.dataMap.members.push(personId);
						}
						$scope.editGroupForm.$setDirty();
			    }
				};

				/**
         * запуск добавления фото на аватар
         */
				$scope.runAddAvatar = (): angular.IPromise<void> => {
          return this.$q.when(this.contactAppSrv.openFileAndConvertToBase64())
            .then((sourceImageDataUrl) => {
              if (!!sourceImageDataUrl) {
                $scope.group.data.avatar = Lib.resizeImage(sourceImageDataUrl, 300);
                $scope.group.dataMap.minAvatar = Lib.resizeImage(sourceImageDataUrl, 50);
                $scope.editGroupForm.$setDirty();
              }
            });
				};

				/**
         * запуск удаления фото с аватара
         */
        $scope.runDelAvatar = (): void => {
          this.$timeout(() => {
            $scope.group.dataMap.color = Lib.getColor(TransformC.getInitials($scope.group.data.name));
            $scope.group.dataMap.minAvatar = "";
            $scope.group.data.avatar = "";
            $scope.editGroupForm.$setDirty();
          });
				};

				/**
				 * запуск процедуры сохранения группы
				 */
				$scope.runSaveGroup = async (): Promise<void> => {
					$scope.group.data.groupId = ($scope.group.data.groupId === null) ? (new Date()).getTime().toFixed() : $scope.group.data.groupId;
					let tmpMap = TransformC.groupJsonToMapping($scope.group.data);
					tmpMap.members = angular.copy($scope.group.dataMap.members);
					tmpMap.minAvatar = angular.copy($scope.group.dataMap.minAvatar);
					cacheSrv.groups.list[tmpMap.groupId] = angular.copy(tmpMap);

					await this.contactAppSrv.writeGroupData($scope.group.data);
					await this.contactAppSrv.writeGroupsMap(cacheSrv.groups.list);

					// внесение изменений в контакты (к каким группам они относятся)
					let persons = {
						forAdding: <string[]>[],
						forRemoving: <string[]>[]
					};

					for (let personId of Object.keys(cacheSrv.contacts.list)) {
						if (tmpMap.members.indexOf(personId) > -1) {
							// в контакте необходимо пометить что он в этой группе, если его еще там нет
							if (cacheSrv.contacts.list[personId].groups.indexOf(tmpMap.groupId) === -1) {
								cacheSrv.contacts.list[personId].groups.push(tmpMap.groupId);
								persons.forAdding.push[personId];
								cacheSrv.contacts.list[personId].inBlackList = (groupId === "1") ? true : cacheSrv.contacts.list[personId].inBlackList;
								cacheSrv.contacts.list[personId].isConfirm = (groupId === "0") ? false : cacheSrv.contacts.list[personId].isConfirm;
							}
						} else {
							// в контакте необходимо убрать пометку что он в этой группе
							let index = cacheSrv.contacts.list[personId].groups.indexOf(tmpMap.groupId);
							if (index > -1) {
								cacheSrv.contacts.list[personId].groups.splice(index, 1);
								persons.forRemoving.push(personId);
								cacheSrv.contacts.list[personId].inBlackList = (groupId === "1") ? false : cacheSrv.contacts.list[personId].inBlackList;
								cacheSrv.contacts.list[personId].isConfirm = (groupId === "0") ? true : cacheSrv.contacts.list[personId].isConfirm;
							}
						}
					}


					await this.contactAppSrv.writePersonsMap(cacheSrv.contacts.list);

					this.$rootScope.$broadcast("client_saveGroup", {groupDataToEdit: $scope.group.data});
					$mdDialog.hide();

				};


			}],
			resolve: {
				group: [CacheSrvMod.CacheSrvName, async (cacheSrv: CacheSrvMod.Cache) => {
					let result = {
            data: <client3N.GroupJSON>null,
						dataMap: <client3N.GroupMapping>null,
						part: 1
					};

					if (!!content) {
						result.data = content;
						result.dataMap = cacheSrv.groups.list[content.groupId];
						result.part = (onlyMembers) ? 2 : 1;
						return result;
					} else {
						if (groupId === "new") {
              result = {
                data: TransformC.newGroupJSON(),
								dataMap: TransformC.newGroupMapping(),
								part: 1
							};
              result.dataMap.mode = "create";
						} else {
							result.data = await this.contactAppSrv.readGroupData(groupId);
							result.dataMap = this.cacheSrv.groups.list[groupId];
							result.part = (onlyMembers) ? 2 : 1;
						}
						return result;
					}

				}]
			}
		});

	}


}
