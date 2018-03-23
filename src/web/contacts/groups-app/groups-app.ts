/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. */

import * as CacheSrvMod from "../../common/services/cache-srv";
import * as GroupEditSrvMod from "../group/group-edit-srv";
import * as ContactsSrvMod from "../contacts-app/contacts-app-srv";

export let ModuleName = "3nClient.components.groups-app";

class Controller {

  static $inject = ["$scope", "$state", "$stateParams", "$timeout", CacheSrvMod.CacheSrvName, GroupEditSrvMod.GroupEditSrvName, ContactsSrvMod.ContactsAppSrvName];
  constructor(
    private $scope: angular.IScope,
    private $state: angular.ui.IStateService,
    private $stateParams: angular.ui.IStateParamsService,
    private $timeout: angular.ITimeoutService,
    private cacheSrv: CacheSrvMod.Cache,
    private groupEditSrv: GroupEditSrvMod.Srv,
    private contactsSrv: ContactsSrvMod.Srv
  ) {
    this.$timeout(() => {
      if (!!this.$stateParams.grId) {
        this.cacheSrv.groups.select = angular.copy(this.$stateParams.grId);
        this.$state.go('root.groups.group', { groupId: this.cacheSrv.groups.select });
      } else {
        this.cacheSrv.groups.select = null;
        this.cacheSrv.groups.grMode = "hide";
      }
    });
  }

  goPersons(): void {
    this.$state.go("root.contacts");
  };

  editGroup(groupId: string): void {
    this.cacheSrv.groups.grMode = "create";
    this.groupEditSrv.openGroupEdit(groupId, false);
    this.$timeout(() => {
      this.cacheSrv.groups.select = null;
    });
  };

}

let componentConfig: angular.IComponentOptions = {
  bindings: {},
  templateUrl: "./templates/contacts/groups-app/groups-app.html",
  controller: Controller
}

export function addComponent(angular: angular.IAngularStatic): void {
  let mod = angular.module(ModuleName, []);
  mod.component("groupsApp", componentConfig);
}

Object.freeze(exports);
