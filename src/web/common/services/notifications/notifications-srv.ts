/*
 Copyright (C) 2016 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. */

import * as CONST from '../const';
import * as CacheSrvMod from "../cache-srv";
import { logError } from '../../libs/logging';

export let ModuleName = "3nClient.services.notifications-srv";
export let NotificationsSrvName = "notificationsService";

export function addService(angular: angular.IAngularStatic): void {
 let mod = angular.module(ModuleName, [CacheSrvMod.ModuleName]);
 mod.service(NotificationsSrvName, Srv);
}

export class Srv {
  fs: web3n.files.WritableFS = null;
  private initializing: Promise<void> = null;

  static $inject = ["$rootScope", "$timeout", '$q', "$mdToast", CacheSrvMod.CacheSrvName];
  constructor(
    private $rootScope: angular.IRootScopeService,
    private $timeout: angular.ITimeoutService,
    private $q: angular.IQService,
    private $mdToast: angular.material.IToastService,
    private cacheSrv: CacheSrvMod.Cache
  ) {
    this.initializing = w3n.storage.getAppLocalFS(`${CONST.FS_USED.MAIL}`).then((fs) => { this.fs = fs; this.initializing = null; });
  }

  async readNotifications(): Promise<void> {
    if (this.initializing) { await this.initializing; }
    let listNotifications = await this.fs.readJSONFile<client3N.Notification[]>("notifications.json")
      .catch(async function(exc: web3n.files.FileException) {
        if (!exc.notFound) { throw exc; }
        return [];
      });
    if (!listNotifications) { listNotifications = []; }
    this.$timeout(() => {
      this.cacheSrv.notifications.list = listNotifications;
    });
  };

  /**
   * запись файла, хранящего notifications
   * @param data {client3N.Notification[]}
   */
  async writeNotifications(data: client3N.Notification[]): Promise<void> {
    if (this.initializing) { await this.initializing; }
    await this.fs.writeJSONFile("notifications.json", data)
      .catch(async function(exc: web3n.files.FileException) {
        logError(exc);
        throw exc;
      });
    this.$rootScope.$broadcast("client_changeNotifications");
  };

  /**
   * вывод пассивного (не сохраняемого в сервис) notification
   * @param mode {string} - "success" or "errors"
   * @param text {string} - текст notification
   */
  passiveNotif(mode: string, text: string): ng.IPromise<any> {
    let tmpl = (mode === "success") ? `<md-toast><span md-colors="{color: 'green-500'}">${text}</span></md-toast>` : `<md-toast><span md-colors="{color: 'red-500'}">${text}</span></md-toast>`

    return this.$mdToast.show({
      position: "bottom right",
      hideDelay: 1000,
      template: tmpl
    });
  };

  /**
   * вывод и сохранение в notification service сообщений об ошибках
   * Mail app
   * @param msgId {string} - id почтового сообщения с ошибкой
   * @param folderId {string} - id почтовой папки, содержащей почтовое сообщение с ошибкой
   * @param sendErrors {client3N.SendMailErrors} - объект, с информацией об ошибках в сообщении
   * @param mode {string} - "action" | "info"
   * @return {ng.IPromise<any>}
   */
  mailErrorNotif(msgId: string, folderId: string, sendErrors: client3N.SendMailResult, mode: string): ng.IPromise<any> {
    let textError = "";
    for (let item of sendErrors.errors) {
      textError = textError + "\n" + item.error;
    }

    let newNotification: client3N.Notification = {
      app: "mail",
      type: (mode === "action") ? mode : "info",
      text: textError,
      actionData: {
        folderId: folderId,
        msgId: msgId
      }
    };
    this.cacheSrv.notifications.list.push(newNotification);
    this.writeNotifications(this.cacheSrv.notifications.list);

    return this.$mdToast.show({
      position: "bottom right",
      hideDelay: 1000,
      templateUrl: "templates/common/services/notifications/msg-toast.html",
      controller: function ($mdToast, infoErrors) {
        this.info = infoErrors;

        this.closeToast = function () {
          $mdToast.hide();
        }
      },
      controllerAs: "$ctrl",
      locals: {
        infoErrors: sendErrors
      }
    });

  };

  /**
   * удаление notificftion из сервиса
   * @param index {number}
   * @return {angular.IPromise<void>}
   */
  deleteNotification(index: number): void {
    this.cacheSrv.notifications.list.splice(index, 1);
    this.$rootScope.$broadcast("client_toCloseSidenav");
    this.writeNotifications(this.cacheSrv.notifications.list);
  };

  /**
   * проверка наличия notification для выбранного messageId
   * @param msgId {string}
   * @return {number} - index the notification in notification service
   */
  findInService(msgId): number {
    let result = -1;
    for (let i = 0; i < this.cacheSrv.notifications.list.length; i++) {
      if (this.cacheSrv.notifications.list[i].actionData) {
        if (this.cacheSrv.notifications.list[i].actionData.msgId == msgId) {
          result = i;
          break;
        }
      }
    }
    return result;
  };

}
