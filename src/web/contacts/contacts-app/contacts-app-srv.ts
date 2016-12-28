/*
 Copyright (C) 2016 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. */

import * as Transform from "../../common/services/transform";
import * as CacheSrvMod from "../../common/services/cache-srv";
import * as NotificationsSrvMod from "../../common/notifications/notifications-srv";

export let ModulName = "3nweb.services.contacts-app-srv";
export let ContactsAppSrvName = "contactsAppService";

export function addService(angular: angular.IAngularStatic): void {
  let mod = angular.module(ModulName, [CacheSrvMod.ModulName, NotificationsSrvMod.ModulName]);
  mod.service(ContactsAppSrvName, Srv);
}

export class Srv {
  fs: web3n.storage.FS = null;
  private initializing: Promise<void> = null;

  static $inject = ["$rootScope", "$timeout", "$sanitize", "$mdToast", CacheSrvMod.CacheSrvName, NotificationsSrvMod.NotificationsSrvName];
  constructor(
    private $rootScope: angular.IRootScopeService,
    private $timeout: angular.ITimeoutService,
    private $sanitize: angular.sanitize.ISanitizeService,
    private $mdToast: angular.material.IToastService,
    private cacheSrv: CacheSrvMod.Cache,
    private notificationsSrv: NotificationsSrvMod.Srv
    ) {
    this.initializing = w3n.storage.getAppLocalFS("computer.3nweb.mail").then((fs) => { this.fs = fs; this.initializing = null; });
  }



}
