/*
 Copyright (C) 2016 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. */

import * as CacheSrvMod from "../../common/services/cache-srv";
import * as Transform from "../../common/services/transform";
import * as NavFolderListSrvMod from "./nav-folder-list-srv";
import * as MailAppSrvMod from "../mail-app/mail-app-srv";

export let ModuleName = "3nweb.components.nav-folder-list";

class Controller {
  folders: {
    list: {[id: string]: client3N.MailFolderMapping};
    idSelect: string;
    modeSelect: string;
    editName: string;
  };

  static $inject = ["$scope", "$state", "$stateParams", "$q", "$timeout", "$mdDialog", CacheSrvMod.CacheSrvName, NavFolderListSrvMod .NavFolderListSrvName, MailAppSrvMod.MailAppSrvName];
  constructor(
    private $scope: angular.IScope,
    private $state: angular.ui.IStateService,
    private $stateParams: any,
    private $q: angular.IQService,
    private $timeout: angular.ITimeoutService,
    private $mdDialog: angular.material.IDialogService,
    private cacheSrv: CacheSrvMod.Cache,
    private foldersSrv: NavFolderListSrvMod.Srv,
    private mailSrv: MailAppSrvMod.Srv
    ) {
      this.$timeout(() => {
        this.foldersSrv.calcUnreadMsg();
        this.folders = {
          list: this.cacheSrv.folders.list,
          idSelect: this.cacheSrv.folders.selectId,
          modeSelect: "normal",
          editName: ""
        };
      });

      this.$scope.$on("client_beforeCloseSidenav", () => {
        this.beforeSideNavClose();
      });
    
      this.$scope.$on("client_msgMapChanged", (event, data: { folderIds: string[], msgIds: string[] }) => {
        this.$timeout(() => {
          if ((data !== undefined) && ((data.folderIds !== undefined) || (data.folderIds.length !== 0))) {
            this.foldersSrv.calcUnreadMsg(data.folderIds);
          } else {
            this.foldersSrv.calcUnreadMsg();  
          }
          this.folders.list = this.cacheSrv.folders.list;
        });
      });

    }

    createFolder(): void {
      this.folders.modeSelect = "create";
      this.folders.editName = "";
      let elemTag = "input#editFolder";
      this.$timeout(() => {
        (<HTMLInputElement>document.querySelector(elemTag)).focus();
      });
    };

    editFolder(): void {
     if (this.folders.list[this.folders.idSelect].isSystem !== true) {
       this.folders.editName = angular.copy(this.folders.list[this.folders.idSelect].folderName);
       this.folders.modeSelect = "edit";
       let elemTag = "input#editFolder";
       this.$timeout(() => {
         (<HTMLInputElement>document.querySelector(elemTag)).focus();
        });
     }
   };

    cancelCreateFolder(): void {
      this.folders.modeSelect = "normal";
      this.folders.editName = "";
    };

    selectFolder(folderId: string): void {
      this.folders.idSelect = folderId;
      this.cacheSrv.folders.selectId = angular.copy(folderId);
      this.$scope.$emit("client_toCloseSidenav");
      this.$state.go("root.mail.folder", {folderId: folderId, msgMode: "hide"});
    };

    preSaveCreateFolder(event: JQueryKeyEventObject, folderId: string): void {
      let keycode = event.keyCode || event.which;
      if (keycode === 13) {
        if (this.folders.editName.length > 0) {
          switch (this.folders.modeSelect) {
            case "create":
              this.saveEditFolder();
              break;
            case "edit":
              this.saveEditFolder();
              break;
          }
        }
      }
      if (keycode === 27) {
        this.cancelCreateFolder();
      }
    };

    async saveEditFolder(): Promise<void> {
      let result = <{status: boolean, newFolderId: string}>{};
      if (this.folders.modeSelect === "edit") {
        // редактирование
        result = await this.foldersSrv.writeFoldersData(this.folders.editName, this.folders.idSelect);
      } else {
        // создание
        result = await this.foldersSrv.writeFoldersData(this.folders.editName);
      }

      if (result.status) {
        this.$timeout(() => {
          this.folders.list = this.cacheSrv.folders.list;
          this.folders.modeSelect = "normal";
          this.folders.idSelect = result.newFolderId;
          this.$state.go("root.mail.folder", {folderId: this.folders.idSelect});
        });
      } else {
        this.$timeout(() => {
         (<HTMLInputElement>document.querySelector("input#editFolder")).focus();
        });
      }
    };

    deleteFolder(ev): void {
     if (this.folders.list[this.folders.idSelect].isSystem !== true) {
       let confirm = this.$mdDialog.confirm()
        .title("Are yoг sure?")
        .textContent("All messages from the remote folder will be moved to the Trash folder.")
        .ariaLabel("delete_folder")
        .targetEvent(ev)
        .ok("OK!")
        .cancel("Cancel");

      this.$mdDialog.show(confirm)
        .then(() => {
          return this.$q.when(this.mailSrv.delMailFolder(this.folders.idSelect));
        })
        .then(() => {
          this.$timeout(() => {
            this.folders.list = this.cacheSrv.folders.list;
          });
          this.folders.idSelect = "0";
          this.cacheSrv.folders.selectId = "0";
          this.$scope.$emit("client_toCloseSidenav");
          this.$state.go("root.mail.folder", {folderId: this.folders.idSelect, msgMode: "hide"});
        });
     }
   };

   beforeSideNavClose(): void {
     if (this.folders.modeSelect !== "normal") {
       this.cancelCreateFolder();
     }
   };

}

let componentConfig: angular.IComponentOptions = {
  bindings: {},
  templateUrl: "./templates/mail/nav-folder-list/nav-folder-list.html",
  controller: Controller
}

export function addComponent(angular: angular.IAngularStatic): void {
  let mod = angular.module(ModuleName, []);
  mod.component("navFolderList", componentConfig);
}

Object.freeze(exports);
