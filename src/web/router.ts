/*
 Copyright (C) 2016 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. */

import { SYS_MAIL_FOLDERS } from "./common/services/const-srv";
import * as Transform from "./common/services/transform";
import * as CacheSrvMod from "./common/services/cache-srv";
import * as NotificationsSrvMod from "./common/notifications/notifications-srv";
import * as FolderListSrvMod from "./mail/nav-folder-list/nav-folder-list-srv";
import * as MailAppSrvMod from "./mail/mail-app/mail-app-srv";
import * as MailSendSrvMod from "./mail/mail-app/mail-send-srv";

export let ModulName = "3nweb.services.router";

export let RouterSrvName = "routerService";

export function routerSrv($stateProvider: angular.ui.IStateProvider, $urlRouterProvider: angular.ui.IUrlRouterProvider) {

  $urlRouterProvider
    .when("/", "/root")
    .otherwise("/root");

  $stateProvider
    .state("root", {
      url: "/root",
      template: `<basis></basis>`,
      controller: function() {},
      controllerAs: "$ctrl",
      resolve: {
        data: ["$stateParams", CacheSrvMod.CacheSrvName, NotificationsSrvMod.NotificationsSrvName, FolderListSrvMod.NavFolderListSrvName, MailAppSrvMod.MailAppSrvName, async function($stateParams: any, cacheSrv: CacheSrvMod.Cache, notificationsSrv: NotificationsSrvMod.Srv, folderSrv: FolderListSrvMod.Srv, mailSrv: MailAppSrvMod.Srv): Promise<void> {
          try {
            // username пользователя приложения
            let username = await w3n.mail.getUserId();
            cacheSrv.username = username;
            // mail folders приложения
            let mailFolders = await folderSrv.readFoldersData();
            cacheSrv.folders.list = mailFolders;
            // список сохраненных сообщений
            let msgList = await mailSrv.readMsgListData();
            // дополнение списка сообщениями из inbox
            await mailSrv.refreshInbox();
            folderSrv.calcUnreadMsg();
            // чтение записанных ранее notifications
            await notificationsSrv.readNotifications();
            console.log("BASIS");
            console.log(cacheSrv.folders);
            console.log(cacheSrv.messages);
          } catch(err) {
            console.error(err);
            //throw err;
          }

        }]
      }
    })
    .state("root.chat", {
      url: "/chat",
      templateUrl: "./templates/chat/chat-app/chat-app.html"
    })
    .state("root.mail", {
      abstract: true,
      url: "/mail",
      template: `<mail-app></mail-app>`
    })
    .state("root.mail.folder", {
      url: "/folder/{folderId}",
      params: {
        msgMode: null
      },
      template: `<folder n-folder="$ctrl.folder"></folder>`,
      controller: ["$timeout", "data", function($timeout: angular.ITimeoutService, data: any) {
        $timeout(() => {
          this.folder = data;
        });
      }],
      controllerAs: "$ctrl",
      resolve: {
        data: ["$stateParams", "$timeout", CacheSrvMod.CacheSrvName, function($stateParams: any, $timeout: angular.ITimeoutService, cacheSrv: CacheSrvMod.Cache) {
          try {
            let fldrContent: {[id: string]: client3N.MessageMapping} = {};
            let fldrId: string = null;
            if ($stateParams.folderId === "") {
              fldrId = angular.copy(cacheSrv.folders.selectId);
            } else {
              fldrId = $stateParams.folderId;
              cacheSrv.folders.selectId = angular.copy(fldrId);
            }
            let msgList = cacheSrv.messages.list;
            // создаем список сообщений выбранной mail folder
            for (let id in msgList) {
              if (msgList[id].folderId === fldrId) {
                fldrContent[id] = angular.copy(msgList[id]);
              }
            }
            // устанавливаем id выбранного сообщения в null
            // if (($stateParams.mode === undefined) || ($stateParams.mode === "hide")) {
            if (($stateParams.msgMode === undefined) || ($stateParams.msgMode === "hide")) {
              cacheSrv.messages.selectId = null;
              cacheSrv.messages.selectMode = "hide";
            } else {
              cacheSrv.messages.selectMode = $stateParams.msgMode;
            }

            cacheSrv.messages.sendStatus = 0;
            return {id: fldrId, content: fldrContent};
          } catch(err) {
            console.error(err);
            throw err;
          }
        }]
      }
    })
    .state("root.mail.folder.message", {
      url: "/message/{msgId}/{mode}",
      template: `<message msg="$ctrl.msg" files="$ctrl.files"></message>`,
      controller: ["data", function(data: {msg: client3N.MessageJSON, files: web3n.files.File[]}) {
        this.msg = data.msg;
        this.files = data.files;
      }],
      controllerAs: "$ctrl",
      resolve: {
        data: ["$state", "$stateParams", "$rootScope", "$timeout", CacheSrvMod.CacheSrvName, MailAppSrvMod.MailAppSrvName, MailSendSrvMod.MailSendSrvName, FolderListSrvMod.NavFolderListSrvName, NotificationsSrvMod.NotificationsSrvName,
        async function ($state: angular.ui.IStateService, $stateParams: any, $rootScope: angular.IRootScopeService, $timeout: angular.ITimeoutService, cacheSrv: CacheSrvMod.Cache, mailSrv: MailAppSrvMod.Srv, mailSendSrv: MailSendSrvMod.Srv, folderSrv: FolderListSrvMod.Srv, notifSrv: NotificationsSrvMod.Srv): Promise<{ msg: client3N.MessageJSON, files: web3n.files.File[] }> {
          try {
            console.log("MSG_STATE. MsgId = " + $stateParams.msgId + ", mode = " + $stateParams.mode);
            let result: {msg: client3N.MessageJSON, files: web3n.files.File[]} = {
              msg: <client3N.MessageJSON>{},
              files: <web3n.files.File[]>[]
            };
            let msgId = $stateParams.msgId;
            let mode = $stateParams.mode;
            let msg: client3N.MessageJSON = <client3N.MessageJSON>{};
            let files: web3n.files.File[] = <web3n.files.File[]>[];
            switch (mode) {
              case "hide":
                cacheSrv.messages.selectId = null;
                cacheSrv.messages.selectMode = mode;
                break;
              case "create":
                cacheSrv.messages.selectId = null;
                cacheSrv.messages.selectMode = mode;
                break;
              case "reply":
              case "replyAll":
              case "forward":
                cacheSrv.messages.selectId = null;
                // cacheSrv.messages.selectMode = "new";
                cacheSrv.messages.selectMode = "create";
                break;
              default:
                cacheSrv.messages.selectId = msgId;
                cacheSrv.messages.selectMode = mode;
              break;
            }

            if (mode === "create") {
              msg = Transform.newMessageJSON();
              msg.mailAddress = cacheSrv.username;
            }

            if ((mode === "reply") || (mode === "replyAll")) {
              let sourceMsg = await mailSrv.readMsgData(msgId);
              msg = Transform.newMessageJSON();
              msg.mailAddress = cacheSrv.username;
              msg.mailAddressTO.push(sourceMsg.mailAddress);
              if (mode === "replyAll") {
                let allAddress = sourceMsg.mailAddressTO.concat(sourceMsg.mailAddressCC);
                // исключаем mailaddress текущего пользователя
                let index = allAddress.indexOf(cacheSrv.username);
                if (index !== -1) {
                  allAddress.splice(index, 1);
                }
                msg.mailAddressCC = allAddress;
              }
              msg.subject = "Re: " + sourceMsg.subject;
              msg.sourceMsgId = msgId;
              let sourceMsgTime = Transform.convertDate(sourceMsg.timeCr);
              let beginReplyTxt = "Sent from " + sourceMsg.mailAddress + " at " + sourceMsgTime;
              msg.bodyHTML = `<br><i style="color: rgba(0,0,0,0.56)">` +  beginReplyTxt + `</i><br><section class="quote">` + sourceMsg.bodyHTML + `</section>`;
            }

            if (mode === "forward") {
              let sourceMsg = await mailSrv.readMsgData(msgId);
              console.log(sourceMsg);
              msg = Transform.newMessageJSON();
              msg.mailAddress = cacheSrv.username;
              msg.subject = sourceMsg.subject;
              msg.bodyHTML = sourceMsg.bodyHTML;
              msg.attached = sourceMsg.attached;
              let sourceFolderId = cacheSrv.messages.list[msgId].folderId;
              let sourceMsgKey = cacheSrv.messages.list[msgId].msgKey;

              for (let aboutFile of msg.attached) {
                aboutFile.mode = "not_saved";
                let fileName = aboutFile.name;
                let file = await Transform.fromMsgToFiles(sourceMsgKey, sourceFolderId, fileName);
                files.push(file);
              }
            }

            if ((mode !== "reply") && (mode !== "replyAll") && (mode !== "forward") && (mode !== "create") && (mode !== "hide")) {
              msg = await mailSrv.readMsgData(msgId);
              if (cacheSrv.messages.list !== null) {
                if (!cacheSrv.messages.list[msgId].isOut && !cacheSrv.messages.list[msgId].isRead) {
                  cacheSrv.messages.list[msgId].isRead = true;
                  await mailSrv.writeMsgListData(cacheSrv.messages.list);
                  $rootScope.$broadcast("client_msgMapChanged", { folderIds: [$stateParams.folderId], msgIds: [msgId] });
                }
              }
              if ($stateParams.folderId === SYS_MAIL_FOLDERS.outbox) {
                if (cacheSrv.messages.progeessCbId !== null) {
                  w3n.mail.delivery.deregisterProgressCB(cacheSrv.messages.progeessCbId);
                }
                mailSendSrv.showProgress(msgId);
              }
            }

            // $rootScope.$broadcast("client_msgMapChanged", { folderIds: [$stateParams.folderId], msgIds: [msgId] });

            result = {
              msg: msg,
              files: files
            };

            return result;
          } catch(err) {
            console.error(err);
            if ((err.type === "inbox") && err.msgNotFound) {
              let fldrId = angular.copy(cacheSrv.messages.list[err.msgId].folderId);
              let msgId = err.msgId;
              let addr = angular.copy(cacheSrv.messages.list[msgId].mailAddress);
              let subj = angular.copy(cacheSrv.messages.list[msgId].subject);

              let mailErrors: client3N.SendMailErrors = {
                recipientsQt: 1,
                status: "error",
                errors: [{
                  address: addr,
                  error: `A critical failure. The message "${subj}" was deleted.`
                }]
              };

              delete cacheSrv.messages.list[msgId];
              await mailSrv.writeMsgListData(cacheSrv.messages.list);

              let msgIndex = cacheSrv.folders.list[fldrId].messageIds.indexOf(msgId);
              cacheSrv.folders.list[fldrId].messageIds.splice(msgIndex, 1);
              await folderSrv.writeAllFoldersData(cacheSrv.folders.list);

              $rootScope.$broadcast("client_msgMapChanged", { folderIds: [$stateParams.folderId], msgIds: [msgId] });

              await notifSrv.mailErrorNotif(msgId, fldrId, mailErrors, "info")
                .then(() => {
                  $state.go("root.mail.folder", { folderId: $stateParams.folderId });
                });
            } else {
              throw err;
            }
          }
        }]
      }
    })
    .state("root.contacts", {
      url: "/contacts/{section}/{cMode}/{unitId}",
      template: "<contacts-app></contacts-app>"
    })
    .state("root.storage", {
      url: "/storage",
      templateUrl: "./templates/storage/storage-app/storage-app.html"
    });

}

Object.freeze(exports);
