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

export let ModuleName = "3nweb.components.folder";

class Controller {
  nFolder: {
    id: string,
    content: { [id: string]: client3N.MessageMapping }
  };
  folder: client3N.MailFolderMapping;
  sysFolders: {[id: string]: string};
  message: {
    list: {[id: string]: client3N.MessageMapping}
  };
  formIsLocked: boolean;


  static $inject = ["$scope", "$state", "$stateParams", "$timeout", "$mdDialog", "$mdToast", "$q", CacheSrvMod.CacheSrvName, MailAppSrvMod.MailAppSrvName, MailActionSrvMod.MailActionSrvName,MailSendSrvMod.MailSendSrvName];
  constructor(
    private $scope: angular.IScope,
    private $state: angular.ui.IStateService,
    private $stateParams: any,
    private $timeout: angular.ITimeoutService,
    private $mdDialog: angular.material.IDialogService,
    private $mdToast: angular.material.IToastService,
    private $q: angular.IQService,
    private cacheSrv: CacheSrvMod.Cache,
    private mailSrv: MailAppSrvMod.Srv,
    private mailActionSrv: MailActionSrvMod.Srv,
    private mailSendSrv: MailSendSrvMod.Srv
    ) {
      this.formIsLocked = false;
      this.sysFolders = Constants.SYS_MAIL_FOLDERS;

      this.$timeout(() => {
        this.message = {
          list: this.cacheSrv.messages.list
        };
        this.folder = this.cacheSrv.folders.list[this.$stateParams.folderId];
        if ((this.$stateParams.msgMode !== undefined) && (this.$stateParams.msgMode !== "hide")) {
          this.$state.go("root.mail.folder.message", {msgId: this.cacheSrv.messages.selectId, mode: this.$stateParams.msgMode});
        }

        // console.log("FOLDER :" + JSON.stringify(this.folder, null, 3));
        // console.log("Q: " + JSON.stringify(this.message, null, 2));
      });
    
      this.$scope.$on("client_msgMapChanged", (event, data: { folderIds: string[], msgIds: string[] }) => {
        this.$timeout(() => {
          let folderId = this.$stateParams.folderId;
          this.folder = this.cacheSrv.folders.list[folderId];
          let folderContent: { [id: string]: client3N.MessageMapping } = {};
          for (let msgId of Object.keys(this.cacheSrv.messages.list)) {
            if (this.cacheSrv.messages.list[msgId].folderId === folderId) {
              folderContent[msgId] = this.cacheSrv.messages.list[msgId];
            }
          }
          this.nFolder.content = angular.copy(folderContent);
        });
      });
    
      this.$scope.$on("client_mustSelectMessage", (event, messageId: string) => {
        this.msgSelect(messageId);
      });

      this.$scope.$on("client_sidenavIsOpened", (event) => {
        $timeout(() => {
          this.formIsLocked = true;
          console.log("client_sidenavIsOpened");
        });
      });

      this.$scope.$on("client_sidenavIsClosed", (event) => {
        $timeout(() => {
          this.formIsLocked = false;
          console.log("client_sidenavIsClosed");
        });
      });

    }

    /**
     * выбор сообщения, с которым будут осуществляться действия
     * @param msgId {string} - id сообщения 
     */
    msgSelect(msgId: string): void {
      this.cacheSrv.messages.selectMode = "show";
      this.$scope.$emit("client_toCloseSidenav");
      this.$timeout(() => {
        this.nFolder.content[msgId].isRead = true;
        this.$state.go("root.mail.folder.message", {msgId: msgId, mode: "show"});
      });
    };

    /**
     * запуск процедуры редактирования выбранного сообщения
     * (сообщение может редаутироваться только если оно находится в папке DRAFT)
     */
    editMsg(): void {
      if ((this.$stateParams.folderId === Constants.SYS_MAIL_FOLDERS.draft) && (this.cacheSrv.messages.selectId !== null)) {
        this.cacheSrv.messages.selectMode = "edit";
        this.$scope.$broadcast("client_messageAction", {action: "editMsg"});
      }

    };

    /**
     * запуск процедуры создания нового сообщения
     */
    newMsg(): void {
      this.cacheSrv.messages.selectMode = "create";
      let fldrId = this.$stateParams.folderId;
      this.$state.go("root.mail.folder.message", {msgId: "new", mode: "create"});
    };

    /**
     * запуск процедуры ответа на входящее сообщение отправителю
     */
    replyMsg(): void {
      this.cacheSrv.messages.selectMode = "create";
      console.log(this.$stateParams.msgId);
      this.$state.go("root.mail.folder.message", {msgId: this.$stateParams.msgId, mode: "reply"});
    };

    /**
     * запуск процедуры ответа на входящее сообщение отправителю и всем 
     * остальным указанным получателям письма
     */
    replyMsgAll(): void {
      this.cacheSrv.messages.selectMode = "create";
      this.$state.go("root.mail.folder.message", {msgId: this.$stateParams.msgId, mode: "replyAll"});
    };

    /**
     * запуск процедуры пересылки выбранного сообщения
     */
    forwardMsg(): void {
      this.cacheSrv.messages.selectMode = "create";
      this.$state.go("root.mail.folder.message", {msgId: this.$stateParams.msgId, mode: "forward"});
    };


    /**
     * прерывание процедуры создания нового сообщения
     */
    cancelCreateMsg(): void {
      this.cacheSrv.messages.selectMode = "hide";
      console.log("CANCEL");
      console.log(this.$stateParams);
      console.log(this.message);
      this.$state.go("root.mail.folder.message", {msgId: "hide", mode: "hide"});
    };

    /**
     * запуск процедуры полуения новых сообщений
     * reread папки INBOX
     */
    resfresh(): void {
      this.mailSrv.refreshInbox();
    }
  
    /**
     * открытие меню с доп.действиями над выбранным сообщением
     */
    openMsgMenu($mdOpenMenu, event): void {
      $mdOpenMenu(event);
    };
  
    /**
     * запуск процедуры сохранения сообщения в папке DRAFT
     */
    saveMsgInDraft(even): void {
      this.$scope.$broadcast("client_messageAction", {action: "saveMsgInDraft"});
    };
  
    /**
     * запуск процедуры удаления сообщения
     */
    async deleteMsg(): Promise<void> {
      await this.mailActionSrv.deleteMessage(this.cacheSrv.messages.selectId);
    };

    /**
     * запуск процедуры перемещения сообщения из одной почтовой папки в другую
     */
    async moveMsg(): Promise<void> {
      await this.mailActionSrv.movingMessage(this.cacheSrv.messages.selectId);
    };

    /**
     * запуск процедуры записи сообщения в виде файла во внешнюю файловую систему
     */
    async saveAsMsg(mode: string): Promise<void> {
      await this.mailSrv.saveAsMsgContent(mode, this.cacheSrv.messages.selectId);
    };


    sendMsg(event): void {
      this.$scope.$broadcast("client_messageAction", {action: "sendMsg"});
    };
  
    async cancelSendMsg(): Promise<void> {
      this.cacheSrv.messages.sendStatus = 0;
      this.cacheSrv.general.blockUI = true;
      await this.mailSendSrv.cancelSendMessage(this.cacheSrv.messages.selectId);
      this.$mdToast.show({
        position: "bottom right",
        hideDelay: 1000,
        template: `<md-toast><span md-colors="{color: 'red-500'}">Message sending cancelled!</span></md-toast>`
      }).then(() => {
        this.cacheSrv.messages.selectId = null;
        this.cacheSrv.messages.selectMode = "hide";
        (<any>this.$stateParams).msgId = "hide";
        (<any>this.$stateParams).msgMode = "hide";
        this.cacheSrv.general.blockUI = false;
        this.$state.go("root.mail.folder", {folderId: Constants.SYS_MAIL_FOLDERS.outbox, msgMode: "hide" }, {reload: true});
      });
    };


}


let componentConfig: angular.IComponentOptions = {
  bindings: {
    nFolder: "<"
  },
  templateUrl: "./templates/mail/folder/folder.html",
  controller: Controller
}

export function addComponent(angular: angular.IAngularStatic): void {
  let mod = angular.module(ModuleName, []);
  mod.component("folder", componentConfig);
}

Object.freeze(exports);
