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

export let ModuleName = "3nClient.services.person-edit-srv";
export let PersonEditSrvName = "personEditService";

export function addService(angular: angular.IAngularStatic): void {
  let mod = angular.module(ModuleName, [CacheSrvMod.ModuleName]);
  mod.service(PersonEditSrvName, Srv);
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
   * @param personId {string}
   * @param content? {client3N.PersonDataToEdit} - пареметр передается, если полные данные по контакту уже прочитаны
   */
  async openPersonEdit(personId: string, content?: client3N.PersonDataToEdit): Promise<void> {

    (this.$mdDialog as any).show({
      parent: angular.element(document.body),
      clickOutsideToClose: false,
      escapeToClose: true,
      templateUrl: "templates/contacts/person/person-edit.html",
      fullscreen: true,
      controllerAs: "ctrl",
      controller: ["$scope", "$mdDialog", "person", ($scope, $mdDialog: angular.material.IDialogService, person: {data: client3N.PersonDataToEdit, dataMap: client3N.PersonMapping}) => {
        $scope.person = {
          data: angular.copy(person.data),
          dataMap: angular.copy(person.dataMap)
        };

        this.$timeout(() => {
          $scope.groups = {
            list: this.cacheSrv.groups.list
          };
        });

        /**
         * запуск добавления фото на аватар
         */
        $scope.runAddAvatar = (): angular.IPromise<void> => {
          return this.$q.when(this.contactAppSrv.openFileAndConvertToBase64())
            .then((sourceImageDataUrl) => {
              if (!!sourceImageDataUrl) {
                $scope.person.data.avatar = Lib.resizeImage(sourceImageDataUrl, 300);
                $scope.person.dataMap.minAvatar = Lib.resizeImage(sourceImageDataUrl, 50);
                $scope.editPersonForm.$setDirty();
              }
            });
        };

        /**
         * запуск удаления фото с аватара
         */
        $scope.runDelAvatar = (): void => {
          this.$timeout(() => {
            $scope.person.dataMap.color = Lib.getColor(TransformC.getInitials($scope.person.data.nickName));
            $scope.person.dataMap.minAvatar = "";
            $scope.person.data.avatar = "";
            $scope.editPersonForm.$setDirty();
          });
        };


        /**
         * запуск процедуры сохранения контакта
         */
        $scope.runSavePerson = async (): Promise<void> => {
          let tmpMap = TransformC.PersonDataToEditToMapping($scope.person.data);
          tmpMap.mode = "saved";
          tmpMap.minAvatar = $scope.person.dataMap.minAvatar;
          tmpMap.inBlackList = ($scope.person.data.groups.indexOf("1") !== -1) ? true : false;
          tmpMap.isConfirm = ($scope.person.data.groups.indexOf("0") === -1) ? true : false;

          tmpMap.personId = $scope.person.data.personId = ($scope.person.data.personId === null) ? (new Date()).getTime().toFixed() : $scope.person.data.personId;

          let tmpJSOM = TransformC.PersonDataToEditToJSON($scope.person.data);
          await this.contactAppSrv.writePersonData(tmpJSOM);

          // внесение необходимых изменений в группы контактов
          let groups = {
            forAdding: <string[]>[],
            forRemoving: <string[]>[]
          };

          for (let groupId of Object.keys(this.cacheSrv.groups.list)) {
            if (tmpMap.groups.indexOf(groupId) > -1) {
              // контакт должен быть добавлен в группу, если его еще там нет
              if (this.cacheSrv.groups.list[groupId].members.indexOf(tmpMap.personId) === -1) {
                this.cacheSrv.groups.list[groupId].members.push(tmpMap.personId);
                groups.forAdding.push(groupId);
              }
            } else {
              // контакт должен быть удален из группы, если его там не должно быть
              let grIndex = this.cacheSrv.groups.list[groupId].members.indexOf(tmpMap.personId);
              if (grIndex > -1) {
                this.cacheSrv.groups.list[groupId].members.splice(grIndex, 1);
                groups.forRemoving.push(groupId);
              }
            }
          }

          await this.contactAppSrv.writeGroupsMap(this.cacheSrv.groups.list);

          this.$timeout(async () => {
            this.cacheSrv.contacts.list[tmpMap.personId] = angular.copy(tmpMap);
            await this.contactAppSrv.writePersonsMap(this.cacheSrv.contacts.list);
          });
          this.$rootScope.$broadcast("client_savePerson", {personDataToEdt: $scope.person.data});
          $mdDialog.hide();
        };

        /**
         * закрыть модальное окно
         */
        $scope.closeModal = () => {
          // this.cacheSrv.contacts.cMode = "hide";
          $mdDialog.hide("cancel");
        };

      }],
      resolve: {
        person: async () => {
          let result = {
            data: <client3N.PersonDataToEdit>null,
            dataMap: <client3N.PersonMapping>null
          };

          if (!!content) {
            result.data = content;
            result.dataMap = this.cacheSrv.contacts.list[personId];

            return result;
          } else {
            if (personId === "new") {
              result = {
                data: TransformC.PersonDataToEdit(),
                dataMap: TransformC.newPersonMapping()
              };
              result.dataMap.mode = "create";
            } else {
              let tmpJSON = await this.contactAppSrv.readPersonData(personId);
              result.dataMap = this.cacheSrv.contacts.list[personId];
              result.data = {
                personId: tmpJSON.personId,
                nickName: tmpJSON.nickName,
                fullName: tmpJSON.fullName,
                phone: tmpJSON.phone,
                notice: tmpJSON.notice,
                avatar: tmpJSON.avatar,
                mails: result.dataMap.mails,
                groups: result.dataMap.groups
              };

            }
            return result;
          }
        }
      }
    }).then((response) => {
      if (response === "cancel") {
        console.log(`You click "CANCEL"!`);
      } else {
        console.log(`Modal window was close normal!`);
      }
    }, () => {
      console.log(`CANCEL!`);
    });
  };

}
