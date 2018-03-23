/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. */

import * as LIB from '../../../common/services/lib-internal';
import * as CacheSrvMod from '../../../common/services/cache-srv';
import * as CommonSrvMod from '../../../common/services/common-srv';

export let ModuleName = '3nClient.components.mail-folder-item';

class Controller {
  item: client3N.MessageMapping;
  private contact: string;
  private msgTime: string;

  static $inject = ['$scope', '$state', '$timeout', '$filter', CacheSrvMod.CacheSrvName, CommonSrvMod.CommonSrvName];
  constructor(
    private $scope: angular.IScope,
    private $state: angular.ui.IStateService,
    private $timeout: angular.ITimeoutService,
    private $filter: angular.IFilterService,
    private _cacheSrv: CacheSrvMod.Cache,
    private _commonSrv: CommonSrvMod.Srv
  ) {
    this.$timeout(() => {
      this.contact = LIB.findNameByMail(this._cacheSrv.contacts.list, this.item.mailAddress, this._cacheSrv.username);
      this.msgTime = this._commonSrv.getMsgDate(this.item.timeCr);
    });
  }

}

let componentConfig: angular.IComponentOptions = {
  bindings: {
    item: '<'
  },
  templateUrl: './templates/mail/mail-folder/mail-folder-item/mail-folder-item.html',
  controller: Controller
}

export function addComponent(angular: angular.IAngularStatic): void {
  let mod = angular.module(ModuleName, []);
  mod.component('mailFolderItem', componentConfig);
}

Object.freeze(exports);
