/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. */

import * as LIB from '../../common/services/lib-internal';
import * as CacheSrv from "../../common/services/cache-srv";

export let ModuleName = "3nClient.components.groups";

class Controller {

  static $inject = ["$scope", "$state", "$anchorScroll", "$location", "$timeout", CacheSrv.CacheSrvName];
  constructor(
    private $scope: angular.IScope,
    private $state: angular.ui.IStateService,
    private $anchorScroll: angular.IAnchorScrollService,
    private $location: angular.ILocationService,
		private $timeout: angular.ITimeoutService,
    private cacheSrv: CacheSrv.Cache
  ) {
    this.$timeout(() => {
      if (!!this.cacheSrv.groups.select) {
        this.selectGroupWithScroll(this.cacheSrv.groups.select);
      }
    });
	}

  selectGroup(event: JQueryEventObject, group: client3N.GroupMapping): void {
    let elemClass = event.target.className;
    if (elemClass.indexOf("avatar-field") === -1) {
      this.cacheSrv.groups.select = group.groupId;
      this.cacheSrv.groups.grMode = "show";
      this.$state.go("root.groups.group", { groupId: group.groupId });
    }
  };

  selectGroupWithScroll(groupId: string): void {
    this.cacheSrv.groups.select = groupId;
    this.cacheSrv.groups.grMode = "show";
    this.scrollToSelectGroup(groupId);
    this.$state.go("root.groups.group", { groupId: groupId });
  };

  /**
   * прокрутка списка сообщений к выбранному
   * @param groupId {string}
   * @returns {void}
   */
  private scrollToSelectGroup(groupId: string): void {
    const htmlElemId = `g${groupId}`;
    if (this.$location.hash() !== htmlElemId) {
      this.$location.hash(htmlElemId);
    } else {
      this.$anchorScroll();
    }
  }

  invertColor(color: string): string {
    return LIB.invertColor(color);
  };

}

let componentConfig: angular.IComponentOptions = {
	bindings: {},
  templateUrl: "./templates/contacts/group-list/group-list.html",
  controller: Controller
}

export function addComponent(angular: angular.IAngularStatic): void {
  let mod = angular.module(ModuleName, []);
  mod.component("groupList", componentConfig);
}

Object.freeze(exports);
