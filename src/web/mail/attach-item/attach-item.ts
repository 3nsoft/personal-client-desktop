/*
 Copyright (C) 2016 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. */

import * as Transform from "../../common/services/transform";
import * as AttachBlockSrvMod from "../attach-block/attach-block-srv";

export let ModuleName = "3nweb.components.attach-item";

class Controller {
  fileInfo: client3N.AttachFileInfo;
  msgKey: string;
  moreInfo: {fileExt: string, color: string, fileSize: string};
  fileAction: (params: {action: string, folderId: number, msgKey: string, fileName: string}) => void;
  disable: boolean;


  static $inject = ["$scope", "$stateParams", "$q", "$timeout", "$mdToast", AttachBlockSrvMod.AttachBlockSrvName];
  static injectShim = (<any>Controller.$inject).concat(($scope, $stateParams, $q, $timeout, $mdToast, attachSrv) => {
    return new Controller($scope, $stateParams, $q, $timeout, $mdToast, attachSrv);
  });
  constructor(
    private $scope: angular.IScope,
    private $stateParams: any,
    private $q: angular.IQService,
    private $timeout: angular.ITimeoutService,
    private $mdToast: angular.material.IToastService,
    private attachSrv: AttachBlockSrvMod.Srv
    ) {
      this.moreInfo = {
        fileExt: "",
        color: "",
        fileSize: ""
      };

      this.$scope.$watch("$ctrl.fileInfo", (nV: any, oV: any) => {
        this.moreInfo = {
          fileExt: this.getFileExt(nV.name),
          color: Transform.getColor(this.getFileExt(nV.name)),
          fileSize: Transform.fromByteTo(nV.size)
        };
      });

    }

  private getFileExt(name: string): string {
    let position = name.lastIndexOf(".");
    let result = (position !== -1) ? name.substr(position + 1) : "***";
    return result;
  };

  delAttach(): void {
    // если файл уже сохранен в storage то необходимо:
    // - удалить название(отображение) файла из "списка";
    // - указать что файл необходимо реально удалить (mode = "delete");
    // иначе - только удалить название
    let params: any;
    if (this.fileInfo.mode === "saved") {
      params = {
        action: "delete",
        folderId: this.$stateParams.folderId,
        msgKey: this.msgKey,
        fileName: this.fileInfo.name
      };
    } else {
      params = {
        action: "clear",
        folderId: this.$stateParams.folderId,
        msgKey: this.msgKey,
        fileName: this.fileInfo.name
      };
    }
    this.fileAction(params);
  };

  async downloadAttach(): Promise<void> {
    // console.log("FOLDER: " + this.$stateParams.folderId);
    // console.log("MSG: " + this.msgKey);
    // console.log(this.fileInfo);

    let pathInStorage = this.$stateParams.folderId + "/" + this.msgKey + "/attachments/" + this.fileInfo.name;
    let status = await this.attachSrv.saveFileToFS(this.fileInfo.name, pathInStorage)
    if (status === "error") {
      this.$mdToast.show({
          position: "bottom right",
          hideDelay: 1000,
          template: `<md-toast><span md-colors="{color: 'red-500'}">
                    Error writing file!</span></md-toast>`
          });
    }
    if (status === "success") {
      this.$mdToast.show({
        position: "bottom right",
        hideDelay: 1000,
        template: `<md-toast><span md-colors="{color: 'green-500'}">
                  The file is saved!</span></md-toast>`
      });
    }
  };

}


let componentConfig: angular.IComponentOptions = {
  bindings: {
    fileInfo: "<",
    msgKey: "<",
    fileAction: "&",
    disable: "<"
  },
  templateUrl: "./templates/mail/attach-item/attach-item.html",
  controller: Controller.injectShim
}

export function addComponent(angular: angular.IAngularStatic): void {
  let mod = angular.module(ModuleName, []);
  mod.component("attachItem", componentConfig);
}

Object.freeze(exports);
