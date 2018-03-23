/*
 Copyright (C) 2016 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. */

import * as CacheSrvMod from "../cache-srv";
import * as NotificationsSrvMod from "./notifications-srv";

export let ModuleName = "3nClient.components.notifications";

class Controller {
  notifs: client3N.Notification[];

  static $inject = ["$scope", "$rootScope", "$state", "$stateParams", "$timeout", "$sanitize", CacheSrvMod.CacheSrvName, NotificationsSrvMod.NotificationsSrvName];
  constructor(
    private $scope: angular.IScope,
    private $rootScope: angular.IRootScopeService,
    private $state: angular.ui.IStateService,
    private $stateParams: angular.ui.IStateParamsService,
    private $timeout: angular.ITimeoutService,
    private $sanitize: any,
    private cacheSrv: CacheSrvMod.Cache,
    private notifsSrv: NotificationsSrvMod.Srv
    ) {
      this.$timeout(() => {
        this.notifs = this.cacheSrv.notifications.list;
      });

      this.$scope.$on("client_changeNotifications", () => {
        this.$timeout(() => {
          this.notifs = this.cacheSrv.notifications.list;
        });
      });
    }

  delNotif(index: number): void {
    this.notifsSrv.deleteNotification(index);
  };

  runNotifAction(index: number): void {
    let notif = angular.copy(this.cacheSrv.notifications.list[index]);

    let currentFolder = (this.$stateParams as any).folderId;
    let folderToTransfer = angular.copy(notif.actionData.folderId);
    let msgId = angular.copy(notif.actionData.msgId);
    if ((notif.actionData !== undefined) && (notif.type === "action")) {
      this.$rootScope.$broadcast("client_toCloseSidenav");
      this.cacheSrv.messages.selectId = msgId;
      this.delNotif(index);
      if (currentFolder === folderToTransfer) {
        this.$rootScope.$broadcast("client_mustSelectMessage", msgId);
      } else {
        this.$state.go("root.mail.folder", { folderId: folderToTransfer, msgId: msgId });
      }
    }
  };

}


let componentConfig: angular.IComponentOptions = {
  bindings: {},
  templateUrl: "./templates/common/services/notifications/notifications.html",
  controller: Controller
}

export function addComponent(angular: angular.IAngularStatic): void {
  let mod = angular.module(ModuleName, [CacheSrvMod.ModuleName, NotificationsSrvMod.ModuleName]);
  mod.component("notifications", componentConfig);
}

Object.freeze(exports);
