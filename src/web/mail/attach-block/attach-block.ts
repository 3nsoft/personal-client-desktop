/*
 Copyright (C) 2016 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. */

import * as Transform from "../../common/services/transform";
import * as AttachBlockSrvMod from "./attach-block-srv";

export let ModuleName = "3nweb.components.attach-block";

class Controller {
  attached: client3N.AttachFileInfo[];
  attachedFiles: web3n.files.File[];
  msgKey: string;
  disable: boolean;

  static $inject = ["$scope", "$stateParams", "$q", "$timeout", AttachBlockSrvMod.AttachBlockSrvName];
  constructor(
    private $scope: angular.IScope,
    private $stateParams: any,
    private $q: angular.IQService,
    private $timeout: angular.ITimeoutService,
    private attachSrv: AttachBlockSrvMod.Srv
  ) {}

  async attachFiles(): Promise<void> {
    let title = "Select file(s):";
    let attachFiles = await w3n.device.openFileDialog(title, null, true);
    if ((attachFiles !== undefined) && (attachFiles.length > 0)) {
      for (let file of attachFiles) {
        let tmpSource = await file.getByteSource();
        let tmpAttach = {
          name: this.attachSrv.checkAttachFileName(file.name, this.attached),
          size: await tmpSource.getSize(),
          mode: "not_saved"
        };
        this.$timeout(() => {
          this.attached.push(tmpAttach);
          this.attachedFiles.push(file);
          (<any>this.$scope.$parent).messageForm.$setDirty();
          // console.log("ATTACH");
          // console.log(this.attached);
          console.log(this.attachedFiles);
        });
      }
    }
  };

  async attachItemAction(action: string, folderId: number, msgKey: string, fileName: string): Promise<void> {
    switch (action) {
      case "clear":
        this.clearAttachItem(fileName, "clear");
        break;
      case "delete":
        this.clearAttachItem(fileName, "delete");
        break;
    }

  };

  clearAttachItem(fileName: string, mode: string): void {
    let clearIndex: number = null;
    for (let i = 0; i < this.attached.length; i++) {
      clearIndex = (fileName === this.attached[i].name) ? i : clearIndex;
    }

    if ((clearIndex !== null) && (mode === "clear")) {
      this.$timeout(() => {
        this.attached.splice(clearIndex, 1);
      });
    }

    if ((clearIndex !== null) && (mode === "delete")) {
      this.$timeout(() => {
        this.attached[clearIndex].mode = "delete";
      });
    }
  };

}




let componentConfig: angular.IComponentOptions = {
  bindings: {
    attached: "=",
    attachedFiles: "=",
    msgKey: "<",
    disable: "<"
  },
  templateUrl: "./templates/mail/attach-block/attach-block.html",
  controller: Controller
}

export function addComponent(angular: angular.IAngularStatic): void {
  let mod = angular.module(ModuleName, []);
  mod.component("attachBlock", componentConfig);
}

Object.freeze(exports);
