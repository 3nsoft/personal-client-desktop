/*
 Copyright (C) 2016 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. */

import * as Constants from "../../common/services/const-srv"; 
import * as Transform from "../../common/services/transform";
import { SingleProc } from "../../common/services/processes";
import * as CacheSrvMod from "../../common/services/cache-srv";
import * as NotificationsSrvMod from "../../common/notifications/notifications-srv";
import * as FolderListSrvMod from "../nav-folder-list/nav-folder-list-srv";
import * as AttachBlockSrvMod from "../attach-block/attach-block-srv";

export let ModulName = "3nweb.services.mail-app-srv";
export let MailAppSrvName = "mailAppService";

export function addService(angular: angular.IAngularStatic): void {
  let mod = angular.module(ModulName, []);
  mod.service(MailAppSrvName, Srv);
}

export class Srv {
  fs: web3n.storage.FS = null;
  private initializing: Promise<void> = null;
  private msgMapFileSavingProc = new SingleProc<void>(); 

  static $inject = ["$rootScope", "$timeout", "$sanitize", "$mdToast", CacheSrvMod.CacheSrvName, NotificationsSrvMod.NotificationsSrvName, FolderListSrvMod.NavFolderListSrvName, AttachBlockSrvMod.AttachBlockSrvName];
  constructor(
    private $rootScope: angular.IRootScopeService,
    private $timeout: angular.ITimeoutService,
    private $sanitize: angular.sanitize.ISanitizeService,
    private $mdToast: angular.material.IToastService,
    private cacheSrv: CacheSrvMod.Cache,
    private notificationsSrv: NotificationsSrvMod.Srv,
    private folderSrv: FolderListSrvMod.Srv,
    private attachSrv: AttachBlockSrvMod.Srv
    ) {
    this.initializing = w3n.storage.getAppLocalFS("computer.3nweb.mail").then((fs) => { this.fs = fs; this.initializing = null; });
  }

  /**
   * функция чтения списка сообщения 
   * @return {[id: string]: client3N.MessageMapping}
   */
  async readMsgListData(): Promise<{[id: string]: client3N.MessageMapping}> {
    if (this.initializing) { await this.initializing; }
    let thee = this;
    let msgListMappingData = await this.fs.readJSONFile<{[id: string]: client3N.MessageMapping}>(Constants.USED_FILES_NAMES.messagesMap)
      .catch(async function(exc: web3n.files.FileException) {
        if (!exc.notFound) { throw exc; }
        return {};
      });
    if (!msgListMappingData) {
      msgListMappingData = {};
    }
    this.cacheSrv.messages.list = angular.copy(msgListMappingData);
    return msgListMappingData;
  };

  /**
   * функция записи списка сообщений
   * @params {[id: string]: client3N.MessageMapping}
   */
  async writeMsgListData(msgList: {[id: string]: client3N.MessageMapping}): Promise<void> {
    if (this.initializing) { await this.initializing; }
    await this.msgMapFileSavingProc.startOrChain(async () => {
      await this.fs.writeJSONFile(Constants.USED_FILES_NAMES.messagesMap, msgList)
        .catch(async function (exc: web3n.files.FileException) {
          console.error(exc);
          throw exc;
        });
      this.$rootScope.$broadcast("client_msgMapChanged", { folderIds: [], msgIds: [] });
    });
  };

  /**
   * sanitize bodyHTML
   * @params html {strig}
   * @return sanitized html {strig}
   */
  sanitizeHTML(source: string): string {
    let allowedElems = ["DIV", "P", "SPAN", "A", "IMG", "BR", "B", "I", "U", "S", "OL", "UL", "LI"];
    let allowedStyle = {};
    let wrapElem = document.createElement("div");
    wrapElem.innerHTML = source;
    let childElems = wrapElem.getElementsByTagName("*");
    // удаление не разрешенных элементов
    for (let elem of childElems) {
      if (allowedElems.indexOf(elem.tagName) === -1) {
        elem.remove();
        continue;
      }

      allowedStyle = {
        "font-size": null,
        "font-family": null,
        "color": null,
        "background-color": null,
        "text-align": null
      };
      // запоминаем значения разрешенных css свойств
      for (let key in allowedStyle) {
        if ((<any>elem).style[key] !== "") {
          allowedStyle[key] = (<any>elem).style[key];
        }
      }
      // очищаем аттрибут style
      if (elem.hasAttribute("style")) {
        elem.setAttribute("style", "");
      }
      // восстанавливаем только разрешенные свойства style
      for (let key in allowedStyle) {
        if (allowedStyle[key] !== null) {
          (<any>elem).style[key] = allowedStyle[key];
        }
      }
      // для <a> удаляем все аттрибуты кроме href
      // и добавляем аттрибут target="_blank"
      if (elem.tagName === "A") {
        for (let i = 0; i < elem.attributes.length; i++) {
          if (elem.attributes[i].name !== "href") {
            elem.removeAttribute(elem.attributes[i].name);
          }
        }
        elem.setAttribute("target", "_blank");
      }
      // для <img> удаляем все аттрибуты кроме src
      if (elem.tagName === "IMG") {
        for (let i = 0; i < elem.attributes.length; i++) {
          if (elem.attributes[i].name !== "src") {
            elem.removeAttribute(elem.attributes[i].name);
          }
        }
      }
    }

    return wrapElem.innerHTML;
  };

  /**
   * функция чтения данных сообщения для редактирования
   * @param msgId {string} - id сообщения для редактирования,
   * если null - значит будет "предоставлена" пустая модель
   * для создания нового сообщения
   * @return {client3N.MessageJSON}
   */
  async readMsgData(msgId: string): Promise<client3N.MessageJSON> {
    if (this.initializing) { await this.initializing; }
    let message: client3N.MessageJSON = null;
    if (msgId === "hide") {
      message = null;
      this.cacheSrv.messages.selectId = null;
    }
    if (msgId === "new") {
      message = Transform.newMessageJSON();
      message.mailAddress = this.cacheSrv.username;
      this.cacheSrv.messages.selectId = null;
    }
    if ((msgId !== "hide") && (msgId !== "new")) {
      if (this.cacheSrv.messages.list === null) { return null;}
      let msgFolder = this.cacheSrv.messages.list[msgId].folderId;
      if (msgFolder !== "0") {
        // чтение из storage, если сообщение не в папке Inbox
        let msgFilePath = msgFolder + "/" + this.cacheSrv.messages.list[msgId].msgKey + "/main.json";
        message = await this.fs.readJSONFile<client3N.MessageJSON>(msgFilePath)
          .catch(async function(exc: web3n.files.FileException) {
            if (!exc.notFound) { throw exc; }
            return Transform.newMessageJSON();
          });
      } else {
        let inboxTmp = await w3n.mail.inbox.getMsg(msgId);
        message = await Transform.incomingToJSON(inboxTmp);
      }
    // SANITIZE
    // let tmpBody = ((message.bodyHTML !== undefined) && (message.bodyHTML !== null)) ? this.$sanitize(message.bodyHTML) : "";
    let tmpBody = ((message.bodyHTML !== undefined) && (message.bodyHTML !== null)) ? this.sanitizeHTML(message.bodyHTML) : "";
    message.bodyHTML = angular.copy(tmpBody);
    return message;
    }

  };

  /**
   * функция записи сообщения
   * @param message {MessageJSON} - записываемое сообщение
   * @param attachedFile {Web3N.Files.File[]} - присоединяемый файлы
   * @param folderId {string} - id папки, в которую будет
   * помещено сообщение
   * @return {Promise<boolean>}
   */
  async writeMsgData(message: client3N.MessageJSON, attachedFile: web3n.files.File[], folderId: string): Promise<boolean> {
    if (this.initializing) { await this.initializing; }

    let isMsgNew = (message.msgId === "new") ? true : false;
    let tmpMsgMap: client3N.MessageMapping;
    tmpMsgMap = Transform.msgJsonToMapping(message, folderId);
    if (isMsgNew) {
      message.msgId = tmpMsgMap.msgId;
      message.msgKey = tmpMsgMap.msgKey;
      message.timeCr = tmpMsgMap.timeCr;
    } else {
      // корректируются те поля msgMapping, которые могли измениться
      tmpMsgMap.timeCr = angular.copy(this.cacheSrv.messages.list[message.msgId].timeCr);
      tmpMsgMap.labels = angular.copy(this.cacheSrv.messages.list[message.msgId].labels);
      tmpMsgMap.isRead = angular.copy(this.cacheSrv.messages.list[message.msgId].isRead);
      tmpMsgMap.isReply = angular.copy(this.cacheSrv.messages.list[message.msgId].isReply);
    }

    /* процедура сохранения новых приаттаченных файлов */
    // подготовка списка новых приаттаченных файлов для записи в storage
    let filesForSave: {name: string, index: number}[] = [];
    for (let i = 0; i < message.attached.length; i++) {
      if (message.attached[i].mode === "not_saved") {
        let tmp = {
          name: message.attached[i].name,
          index: i
        };
        filesForSave.push(tmp);
      }
    }

    // запись новых приаттаченных файлов в storage
    for (let i = 0; i < filesForSave.length; i++) {
      let params = {
        folderId: folderId,
        msgKey: message.msgKey,
        fileName: filesForSave[i].name
      };
      await this.attachSrv.saveFileToStorage(attachedFile[i], params)
        .catch(async function(exc: web3n.files.FileException) {
          console.error(exc);
          throw exc;
        });
      message.attached[filesForSave[i].index].mode = "saved";
    }

    /* процедура удаления приаттаченных файлов с mode === "delete" */
    for (let file of message.attached) {
      if (file.mode === "delete") {
        let params = {
          folderId: folderId,
          msgKey: message.msgKey,
          fileName: file.name
        };
        let reply = await this.attachSrv.deleteFileFromStorage(params);
        if (!reply) {
          console.info("File " + params.fileName + " was missing in the Storage!");
        }
      }
    }
    let clearIndex: number[] = [];
    for (let i = 0; i < message.attached.length; i++) {
      if (message.attached[i].mode === "delete") {
        clearIndex.unshift(i);
      }
    }
    for (let index of clearIndex) {
      message.attached.splice(index, 1);
    }
    
    // запись message в storage
    let msgFileName = `${folderId}/${message.msgKey}/${Constants.USED_FILES_NAMES.message}`;
    let saveError = false;
    await this.fs.writeJSONFile(msgFileName, message)
      .catch(async function(exc: web3n.files.FileException) {
        console.error(exc);
        saveError = true;
      });
    
    this.cacheSrv.messages.list[tmpMsgMap.msgId] = angular.copy(tmpMsgMap);
    await this.writeMsgListData(this.cacheSrv.messages.list);
    

    // если id сообщения еще не добавлен в список сообщений в папке (messageIds),
    // то  добавляем его
    if (this.cacheSrv.folders.list[folderId].messageIds.indexOf(message.msgId) === -1) {
      this.cacheSrv.folders.list[folderId].messageIds.push(message.msgId);
      await this.folderSrv.writeAllFoldersData(this.cacheSrv.folders.list)
    }

    return saveError;
  };

  /**
   * функция обновления inbox folder
   */
  async refreshInbox(): Promise<void> {
    console.log("INBOX REFRESH");
    this.$timeout(() => {
      this.cacheSrv.general.progressBar = true;
    });
    let inboxMsgInfoList: {deliveryTS: number, msgId: string, msgKey: string}[] = [];
    let inboxList = await w3n.mail.inbox.listMsgs(this.cacheSrv.messages.refreshTS);
    for (let inboxListItem of inboxList) {
      inboxMsgInfoList.push({
        deliveryTS: inboxListItem.deliveryTS,
        msgId: inboxListItem.msgId,
        msgKey: Transform.newMsgKey("in", inboxListItem.msgId)
      });
    }
    // проверяем имеются ли в приложении сообщения с такими же
    // msgId; при отсутствии "забираем" сообщения
    let msgPromises: Promise<web3n.asmail.IncomingMessage>[] = [];
    for (let msgInfoItem of inboxMsgInfoList) {
      if (msgInfoItem.msgId in this.cacheSrv.messages.list) {
        continue
      } else {
        msgPromises.push(w3n.mail.inbox.getMsg(msgInfoItem.msgId));
      }
    }
    let inboxMsgs: {result: web3n.asmail.IncomingMessage, error: any}[] = [];
    if (msgPromises.length > 0) {
      inboxMsgs = await Transform.waitAll(msgPromises)
        .catch(async function(exc: web3n.asmail.ASMailSendException) {
          console.log(exc);
          throw exc;
        });
    }
    let targetInboxMsgs: web3n.asmail.IncomingMessage[] = [];
    for (let item of inboxMsgs) {
      if (item.error === null) {
        let tmp = item.result;
        targetInboxMsgs.push(tmp);  
      }
    }
    console.log(JSON.stringify(targetInboxMsgs));
    targetInboxMsgs.sort((itemA, itemB) => {
      return itemB.deliveryTS - itemA.deliveryTS;
    });
    this.cacheSrv.messages.refreshTS = (targetInboxMsgs.length > 0)  ? targetInboxMsgs[0].deliveryTS : this.cacheSrv.messages.refreshTS;
    let targetInboxMsgsMap = Transform.incomingToMapping(targetInboxMsgs);
    console.log(targetInboxMsgsMap);
    for (let id in targetInboxMsgsMap) {
      this.cacheSrv.messages.list[id] = angular.copy(targetInboxMsgsMap[id]);
      this.cacheSrv.folders.list[Constants.SYS_MAIL_FOLDERS.inbox].messageIds.push(id);
    }
    await this.folderSrv.writeAllFoldersData(this.cacheSrv.folders.list);
    await this.writeMsgListData(this.cacheSrv.messages.list);
    this.$timeout(() => {
      this.cacheSrv.general.progressBar = false;
    });
  };

  /**
   * функция перемещения сообщения (всей папки сообщения) внутри 3N файловой
   * системы из одной почтовой папки в другую;
   * если targetFolderId === "trash" или не задана, то запускается перемещение
   * в рамках процесса удаления (сначала в папку "Trash", а затем полное удаление)
   * @param msgKey {string} - ключ перемещаемого сообщения
   * @param isAction {boolean} - если true, то перемещение производится
   * в рамках перемещения пользователем, false - как вспомогательное действие
   * в рамках родительского процесса
   * @param targetFolderId? {string} - целевая для перемещения почтовая папка
   * @return {Promise<boolean>}
   */
   async moveMessageInsideFS(msgKey: string, isAction: boolean, targetFolderId?: string): Promise<boolean> {
     if (this.initializing) { await this.initializing; }
     // в рамках процесса перемещения пользователем не можем
     // перемещать в папки "Inbox", "Draft", "Outbox" , "Sent";
     // sourceFolderId не должен = targetFolderId
     let msgId = msgKey.substr(msgKey.indexOf("=") + 1);
     let sourceFolderId = this.cacheSrv.messages.list[msgId].folderId;

     if (isAction && ((Number(targetFolderId) < 4) || (sourceFolderId === targetFolderId))) { return false; }
     targetFolderId = targetFolderId || "trash";

     let indexMovedMsgInFolder = this.cacheSrv.folders.list[sourceFolderId].messageIds.indexOf(msgId);

     let sourcePath = sourceFolderId + "/" + msgKey;
     let currentTargetFolderId = (targetFolderId !== "trash") ? targetFolderId : Constants.SYS_MAIL_FOLDERS.trash;
     let targetPath = currentTargetFolderId + "/" + msgKey;
     
     let moveMode: number; // 0 - полное удаление, 1 - перемещение не из INBOX, 2 - перемещение из INBOX
     if (sourceFolderId === currentTargetFolderId) {
       moveMode = 0;
     } else {
       moveMode = (sourceFolderId !== Constants.SYS_MAIL_FOLDERS.inbox) ? 1 : 2;
     }
     
     let actionResult = true;
     switch (moveMode) {
       case 0:
         await this.fs.deleteFolder(sourcePath, true)
          .catch(async function(exc: web3n.files.FileException) {
            console.error(exc);
            actionResult = false;
           });
         delete this.cacheSrv.messages.list[msgId];
         this.cacheSrv.folders.list[sourceFolderId].messageIds.splice(indexMovedMsgInFolder, 1);
         break;

       case 1:
         await this.fs.move(sourcePath, targetPath)
           .catch(async function(exc: web3n.files.FileException) {
             console.error(exc);
             actionResult = false;
           });
         this.cacheSrv.messages.list[msgId].folderId = currentTargetFolderId;
         this.cacheSrv.folders.list[sourceFolderId].messageIds.splice(indexMovedMsgInFolder, 1);
         this.cacheSrv.folders.list[currentTargetFolderId].messageIds.push(msgId);
         break;
         
       case 2:
         let incomTmp = await w3n.mail.inbox.getMsg(msgId);
         let message = await Transform.incomingToJSON(incomTmp);
         if ("attachments" in incomTmp) {
          //  let incomTmpFileList = await incomTmp.attachments.listFolder(".")
          //  let incomTmpFilesSource: web3n.ByteSource[] = [];
          //  await this.fs.makeFolder(targetPath);
          //  for (let fileItem of incomTmpFileList) {
          //    if (fileItem.isFile) {
          //      let tmpFileName = fileItem.name;
          //      let tmpSource = await incomTmp.attachments.getByteSource(tmpFileName);
          //      incomTmpFilesSource.push(tmpSource);
          //      let tmpSink = await this.fs.getByteSink(targetPath + "/attachments/" + tmpFileName);
          //      await Transform.pipe(tmpSource, tmpSink);
          //    }
          //  }
           await this.fs.saveFolder(incomTmp.attachments, targetPath + "/attachments");
         }
         await this.fs.writeJSONFile(targetPath + "/" + Constants.USED_FILES_NAMES.message, message);
         await w3n.mail.inbox.removeMsg(msgId)
          .catch(async function(exc: web3n.asmail.ASMailSendException) {
            console.error(exc);
            actionResult = false;
           });
         this.cacheSrv.messages.list[msgId].folderId = currentTargetFolderId;
         this.cacheSrv.folders.list[sourceFolderId].messageIds.splice(indexMovedMsgInFolder, 1);
         this.cacheSrv.folders.list[currentTargetFolderId].messageIds.push(msgId);
         break;
     }
     
     /* внесение изменений в маппинг списка папок и списка сообщений */  
     await this.writeMsgListData(this.cacheSrv.messages.list);   
     await this.folderSrv.writeAllFoldersData(this.cacheSrv.folders.list);

     return actionResult;
   };

   /**
   * функция удаления mail folder
   * ф-ция находитя не в nav-folder-list-srv.ts, т.к. для ее
   * правильной работы необходимо использовать метод из mail-app-srv.ts,
   * а подключить этот модуль в nav-folder-list-srv.ts не представляется
   * возможным из-за возникновения циклического импорта модулей, что
   * приводит к ошибке
   * @param folderId {string} - id удаляемой mail folder
   * @return {Promise<void>}
   */
    async delMailFolder(folderId: string): Promise<void> {
      // при удалении папки все сообщения из удаляемой папки
      // необходимо переместить в папку "Trash"
      let relocatableMessages = angular.copy(this.cacheSrv.folders.list[folderId].messageIds);
      delete this.cacheSrv.folders.list[folderId];
      // физическое перемещение сообщения в папку "Trash"
      let movePromises: Promise<boolean>[] = [];
      for (let msgId of relocatableMessages) {
        let msgKey = this.cacheSrv.messages.list[msgId].msgKey;
        let promiseItem = this.moveMessageInsideFS(msgKey, true, Constants.SYS_MAIL_FOLDERS.trash);
        movePromises.push(promiseItem);
      }
      let result = Transform.waitAll(movePromises);
      // "перемещение" сообщений в объекте folderMapping и msgMapping
      let newTrashMessageIds = this.cacheSrv.folders.list[Constants.SYS_MAIL_FOLDERS.trash].messageIds.concat(relocatableMessages);
      this.cacheSrv.folders.list[Constants.SYS_MAIL_FOLDERS.trash].messageIds = angular.copy(newTrashMessageIds);
      await this.folderSrv.writeAllFoldersData(this.cacheSrv.folders.list);
      for (let msgId of relocatableMessages) {
        this.cacheSrv.messages.list[msgId].folderId = Constants.SYS_MAIL_FOLDERS.trash;
      }
      
      await this.writeMsgListData(this.cacheSrv.messages.list);
   };
  
  /**
   * функция сохранения сообщения во внешнем файле html
   * @param mode {string} - "html" or "text"
   * @param msgId {string} - id сохраняемого сообщения
   * @return {Promise<void>}
   */
   async saveAsMsgContent(mode: string, msgId: string): Promise<void> {
     let msg = await this.readMsgData(msgId);
     let title: string;
     let outFileName: string;
     let msgContent: string = "";
     let isOut = (this.cacheSrv.messages.list[msgId].isOut);

     switch (mode) {
       case "html":
         title = "Save message as html";
         outFileName = `msg${msg.timeCr.toString()}.html`;
         msgContent = `<div style="font-size: 14px; position: relative; width: 100%"><div><b>FROM: </b>${msg.mailAddress}</div><div><b>TO: </b>`
         msgContent = msgContent + ((msg.mailAddressTO !== undefined) ? msg.mailAddressTO.join(", ") : "");
         msgContent = msgContent + `</div><div><b>COPY: </b>`;
         msgContent = msgContent + ((msg.mailAddressCC !== undefined) ? msg.mailAddressCC.join(", ") : "");
         msgContent = msgContent + `</div><div><b>HIDDEN COPY: </b>`;
         msgContent = msgContent + ((msg.mailAddressBC !== undefined) ? msg.mailAddressBC.join(", ") : "");
         msgContent = msgContent + `</div><br><div><b>SUBJECT: </b> ${msg.subject}</div><div style="position: relative; with: 100%; height: 1px; border-bottom: 1px solid rgba(0,0,0,0.12)"></div><br>${msg.bodyHTML}</div></br>`;
         if (msg.attached.length !== 0) {
           msgContent = msgContent + `<div style="font-size: 14px; position: relative; width: 100%"><b>ATTACHED: </b>`;
           for (let item of msg.attached) {
             msgContent = msgContent + `<span>${item.name}(${item.size}) </span>`;
           }
           msgContent = msgContent + "</div>";
         }

         break;

       case "text":
         title = "Save message as text";
         outFileName = `msg${msg.timeCr.toString()}.txt`;
         msgContent = msgContent + "FROM: " + ((msg.mailAddress !== undefined) ? msg.mailAddress : "") + "\n";
         msgContent = msgContent + "TO: " + ((msg.mailAddressTO !== undefined) ? msg.mailAddressTO.join(", ") : "") + "\n";
         msgContent = msgContent + "COPY: " + ((msg.mailAddressCC !== undefined) ? msg.mailAddressCC.join(", ") : "") + "\n";
         msgContent = msgContent + "HIDDEN COPY: " + ((msg.mailAddressBC !== undefined) ? msg.mailAddressBC.join(", ") : "") + "\n";
         msgContent = msgContent + "\nSUBJECT: " + msg.subject + "\n";
         msgContent = msgContent + "---------------------------------------------\n\n";
         msgContent = msgContent + Transform.html2text(msg.bodyHTML) + "\n\n";
         if (msg.attached.length !== 0) {
           msgContent = msgContent + "ATTACHED: ";
           for (let item of msg.attached) {
             msgContent = msgContent + item.name + "(" + item.size + ")  ";
           }
         }

         break;
     }

     let outFile = await w3n.device.saveFileDialog(title, null, outFileName);

     if (outFile !== undefined) {
       await outFile.writeTxt(msgContent)
        .catch((err) => {
          console.error(err);
          this.$mdToast.show({
            position: "bottom right",
            hideDelay: 1500,
            template: `<md-toast><span md-colors="{color: 'red-500'}">
                    Error on writing file!</span></md-toast>`
          })
          .then(() => {
            return;  
          })
        });
       
       this.$mdToast.show({
         position: "bottom right",
         hideDelay: 1500,
         template: `<md-toast><span md-colors="{color: 'green-500'}">
                    The file is saved!</span></md-toast>`
       });  
     }

   };



}
