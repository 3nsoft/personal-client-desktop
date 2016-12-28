/*
 Copyright (C) 2016 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. */

import { SYS_APP_UI } from "../../common/services/const-srv"; 
import * as CacheSrvMod from "../../common/services/cache-srv";
import * as FolderListSrvMod from "../../mail/nav-folder-list/nav-folder-list-srv";
import * as MailAppSrvMod from "../../mail/mail-app/mail-app-srv";

export let ModuleName = "3nweb.components.basis";

const APPS = {
  "chat": {
    app: 0, stateName: "root.chat"
  },
  "mail": {
    app: 1, stateName: "root.mail.folder"
  },
  "contacts": {
    app: 2, stateName: "root.contacts"
  },
  "storage": {
    app: 3, stateName: "root.storage"
  }
};

class Controller {
  username: string;
  appSelected: number;
  sideNav: {
    content: string;
    isOpen: boolean;
    isLocked: boolean;
    isShow: boolean;
  };
  selectFolderId: string;

  static $inject = ["$scope", "$state", "$stateParams", "$location", "$timeout", "$mdSidenav", CacheSrvMod.CacheSrvName, FolderListSrvMod.NavFolderListSrvName, MailAppSrvMod.MailAppSrvName];
  constructor(
    private $scope: angular.IScope,
    private $state: angular.ui.IStateService,
    private $stateParams: any,
    private $location: angular.ILocationService,
    private $timeout: angular.ITimeoutService,
    private $mdSidenav: angular.material.ISidenavService,
    private cacheSrv: CacheSrvMod.Cache,
    private folderListSrv: FolderListSrvMod.Srv,
    private mailSrv: MailAppSrvMod.Srv
    ) {

      this.sideNav = {
        isOpen: false,
        isLocked: false,
        isShow: false,
        content: ""
      };

      this.username = this.cacheSrv.username;
      this.selectFolderId = this.cacheSrv.folders.selectId;

      this.$scope.$on("client_toCloseSidenav", () => {
        // if (this.sideNav.isOpen && (this.sideNav.content === "folders")) {
        if (this.sideNav.isOpen) {
          this.$scope.$broadcast("client_beforeCloseSidenav");
          this.closeSidenav();
        }
      });

      let cState = (this.$location.url() === "/root") ? "mail" : this.$location.url().split("/")[2];
      this.appSelected = APPS[cState].app;
      console.log("BASIS:");
      console.log(this.$location.url());
      console.log(cState);
      console.log(APPS[cState].stateName);
      this.goApp(cState);
      console.log(this.cacheSrv.general.progressBar);
  }

  goApp(state: string): void {
    let stateName = APPS[state].stateName;
    switch (state) {
      case "mail":
        this.selectFolderId = this.cacheSrv.folders.selectId;
        this.$state.go(stateName, {folderId: this.selectFolderId, msgMode: "hide"});
        break;
      default:
        if (this.sideNav.isOpen && (this.sideNav.content === "folders")) {
          this.$scope.$broadcast("client_beforeCloseSidenav");
          this.closeSidenav();
        }
        this.$state.go(stateName);
    }
  };

  toggleSideNav(content: string): void {
    if (this.sideNav.isOpen && (content === "folders")) {
      this.$scope.$broadcast("client_beforeCloseSidenav");
    }
    this.sideNav.content = content;
    if (this.sideNav.isOpen) {
      this.closeSidenav();
    } else {
      this.openSidenav();
    }
  };

  private closeSidenav(): void {
    this.sideNav.isOpen = false;
    this.$timeout(() => {
      this.sideNav.isShow = false;
      this.$scope.$broadcast("client_sidenavIsClosed")
    }, SYS_APP_UI.sidenavAnimationTime);
  };

  private openSidenav(): void {
    this.sideNav.isShow = true;
    this.sideNav.isOpen = true;
    this.$timeout(() => {
      this.$scope.$broadcast("client_sidenavIsOpened");
    }, SYS_APP_UI.sidenavAnimationTime);
  };

  async resfresh(): Promise<void> {
    await this.mailSrv.refreshInbox();
    this.$state.reload();
  }

}

let componentConfig: angular.IComponentOptions = {
  bindings: {},
  templateUrl: "./templates/common/basis/basis.html",
  controller: Controller
}

export function addComponent(angular: angular.IAngularStatic): void {
  let mod = angular.module(ModuleName, []);
  mod.component("basis", componentConfig);
}

Object.freeze(exports);
