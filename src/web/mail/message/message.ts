/*
 Copyright (C) 2016 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. */
import * as Constants from "../../common/services/const-srv";
import * as CacheSrvMod from "../../common/services/cache-srv";
import * as MailAppSrvMod from "../mail-app/mail-app-srv";
import * as MailActionSrvMod from "../mail-app/mail-action-srv";
import * as MailSendSrvMod from "../mail-app/mail-send-srv";

export let ModuleName = "3nweb.components.message";

class Controller {
  msg: client3N.MessageJSON;
  files: web3n.files.File[];
  targetFolderId: string; // id mail folder для премещения сообщения
  attachedFiles: web3n.files.File[];
  editor: {
    isToolbar: boolean;
  };
  isReadonly: boolean;
  keys: any[];

  static $inject = ["$scope", "$state", "$stateParams", "$q", "$timeout", "$mdDialog", "$mdToast", "$mdConstant", CacheSrvMod.CacheSrvName, MailAppSrvMod.MailAppSrvName, MailActionSrvMod.MailActionSrvName, MailSendSrvMod.MailSendSrvName];
  constructor(
    private $scope: angular.IScope,
    private $state: angular.ui.IStateService,
    private $stateParams: any,
    private $q: angular.IQService,
    private $timeout: angular.ITimeoutService,
    private $mdDialog: angular.material.IDialogService,
    private $mdToast: angular.material.IToastService,
    private $mdConstant: any,
    private cacheSrv: CacheSrvMod.Cache,
    private mailAppSrv: MailAppSrvMod.Srv,
    private mailActionSrv: MailActionSrvMod.Srv,
    private mailSendSrv: MailSendSrvMod.Srv
    ) {
      this.targetFolderId = null;
      this.editor = {
        isToolbar: false
      };
      this.$timeout(() => {
        this.attachedFiles = this.files;
      });
      this.isReadonly = (this.cacheSrv.messages.selectMode !== "show") ? false : true;

      this.keys = [this.$mdConstant.KEY_CODE.ENTER, this.$mdConstant.KEY_CODE.TAB, this.$mdConstant.KEY_CODE.UP_ARROW, this.$mdConstant.KEY_CODE.DOWN_ARROW];

      this.$scope.$on("client_messageAction", (event, data) => {
        let action: string = data.action;
        switch (action) {
          case "editMsg":
            this.isReadonly = false;
            break;
          case "saveMsgInDraft":
            this.saveMsgInDraft();
            break;
          case "sendMsg":
            this.runSendMsg();
            break;
        }
      });

    }

    /**
     * показать тулбар встроенного текстового редактора
     */
    showEditorToolbar(): void {
      this.editor.isToolbar = !this.editor.isToolbar;
    };
    
    editorCreated(editor): void {
      console.log(editor);
    };
  

    /**
     * простейший валиадатор mail адреса:
     * проверка на наличие символа "@" и присутствия текста (строки)
     * после символа "@"
     * @param chip {string} - вводимый chip в angular chips
     */
    checkAddress(chip: string): string {
      if (chip.indexOf("@") === -1) {
        return null;
      } else {
        let part2 = chip.split("@")[1];
        if ((part2.length > 0) && (part2.indexOf(" ") === -1)) {
          return chip;
        } else {
          return null;
        }
      }
    };
  
    /**
     * сохранение сообщения в папке DRAFT
     * обработка события "запущенного" в контроллере компонента "folder"
     */
    private async saveMsgInDraft(): Promise<void> {
      if ((this.msg.mailAddressTO.length + this.msg.mailAddressCC.length + this.msg.mailAddressBC.length) !== 0) {
        await this.mailActionSrv.saveMsgInDraftFolder(this.msg, this.attachedFiles);
      }
    };

    /**
     * запуск процедура отправки сообщения
     */
    async runSendMsg(): Promise<void|boolean> {
      if ((this.msg.mailAddressTO.length + this.msg.mailAddressCC.length + this.msg.mailAddressBC.length) === 0) {
        return false;
      }
      let isDirty = ((this.$stateParams.msgId !== "new") && ((<any>this.$scope).messageForm.$dirty)) ? true : false;
      await this.mailSendSrv.runSendMessage(this.msg, this.attachedFiles, isDirty);
      this.cacheSrv.messages.selectId = null;
      this.cacheSrv.messages.selectMode = "hide";
      this.$stateParams.msgId = "hide";
      this.$stateParams.mode = "hide";
      (<any>this.$state).reload("root.mail.folder");
    };

}




let componentConfig: angular.IComponentOptions = {
  bindings: {
    msg: "<msg",
    files: "<files"
  },
  templateUrl: "./templates/mail/message/message.html",
  controller: Controller
}

export function addComponent(angular: angular.IAngularStatic): void {
  let mod = angular.module(ModuleName, []);
  mod.component("message", componentConfig);
}

Object.freeze(exports);
