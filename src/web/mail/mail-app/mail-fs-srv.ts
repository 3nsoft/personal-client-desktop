/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. */

import * as CONST from '../../common/services/const';
import * as LIB from '../../common/services/lib-internal';
import * as Attach from '../../common/libs/attachments-container';

import * as Transform from "../../common/services/transform-mail";
import { SingleProc } from '../../common/services/processes';
import * as MailFoldersFsSrvMod from '../mail-folders/mail-folders-fs-srv';
import * as CacheSrvMod from "../../common/services/cache-srv";
import { logError } from '../../common/libs/logging';


export let ModuleName = "3nClinet.services.mail-fs-srv";
export let MailFsSrvName = "mailFsService";

export function addService(angular: angular.IAngularStatic): void {
  let mod = angular.module(ModuleName, []);
  mod.service(MailFsSrvName, Srv);
}

export class Srv {
  private fs: web3n.files.WritableFS = null;
  private initializing: Promise<void> = null;
  private msgListSavingProc = new SingleProc();

  static $inject = ['$rootScope', '$state', '$stateParams', '$timeout', '$mdDialog', MailFoldersFsSrvMod.MailFoldersFsSrvName, CacheSrvMod.CacheSrvName];
  constructor(
    private $rootScope: angular.IRootScopeService,
    private $state: angular.ui.IStateService,
    private $stateParams: angular.ui.IStateParamsService,
    private $timeout: angular.ITimeoutService,
    private $mdDialog: angular.material.IDialogService,
    private _folderFsSrv: MailFoldersFsSrvMod.Srv,
    private _cacheSrv: CacheSrvMod.Cache
  ) {
    this.initializing = w3n.storage.getAppLocalFS(`${CONST.FS_USED.MAIL}`).then((fs) => { this.fs = fs; this.initializing = null; });
  }

  /**
   * функция удаления папки
   * @param folderPath {string}
   * @returns {Promise<void>}
   */
  async deleteFolder(folderPath: string): Promise<void> {
    if (this.initializing) { await this.initializing; }

    await this.fs.deleteFolder(folderPath, true);
  }


  /**
   * функция чтения списка сообщения и сохранение его в cache service
   * @return {Promise<void>}
   */
  async readMsgList(): Promise<void> {
    if (this.initializing) { await this.initializing; }

    let msgListMappingData = await this.fs.readJSONFile<{[id: string]: client3N.MessageMapping}>(CONST.USED_FILES_NAMES.messagesMap)
      .catch(async (exc: web3n.files.FileException) => {
        if (!exc.notFound) { throw exc; }
        return {};
      });
    if (!msgListMappingData) {
      msgListMappingData = {};
    }
    this._cacheSrv.messages.list = angular.copy(msgListMappingData);
  }

  /**
   * функция записи списка сообщений в 3N файловую систему
   * @returns {Promise<boolean>}
   */
  async writeMsgList(): Promise<boolean> {
    if (this.initializing) { await this.initializing; }

    let result = true;

    await this.msgListSavingProc.startOrChain(async () => {
      await this.fs.writeJSONFile(CONST.USED_FILES_NAMES.messagesMap, this._cacheSrv.messages.list)
        .catch(async function (exc: web3n.files.FileException) {
          logError(exc);
          result = false;
        });

      this.$rootScope.$broadcast('client_msgMapChanged', this.$stateParams.folderId);
    });

    return result;
  }

  /**
   * функция чтения сообщения (без приаттаченных файлов) из папки в 3NStorage
   * @param msgId {string}
   * @returns {Promise<client3N.MessageJSON>}
   */
  async readMsgData(msgId: string): Promise<client3N.MessageJSON> {
    if (this.initializing) { await this.initializing; }

    const path = `${this._cacheSrv.messages.list[msgId].folderId}/${this._cacheSrv.messages.list[msgId].msgKey}/${CONST.USED_FILES_NAMES.message}`;
    const msgData = await this.fs.readJSONFile<client3N.MessageJSON>(path)
    .catch(async (exc: web3n.files.FileException) => {
      logError(exc);
    });
    return !!msgData ? msgData : null;
  }

  /**
   * функция записи сообщения (без приаттаченных файлов) в папку в 3NStorage
   * @param folderId {string}
   * @param msgData {client3N.MessageJSON}
   * @returns {Promise<boolean>} true - success
   */
  async writeMsgData(folderId: string, msgData: client3N.MessageJSON): Promise<boolean> {
    if (this.initializing) { await this.initializing; }

    const isMsgNew = (msgData.msgId === 'new') ? true : false;
    let tmpMsgMap = Transform.msgJsonToMapping(msgData, folderId);
    if (isMsgNew) {
      msgData.msgId = tmpMsgMap.msgId;
      msgData.msgKey = tmpMsgMap.msgKey;
      msgData.timeCr = tmpMsgMap.timeCr;
    } else {
      // корректируются те поля msgMapping, которые могли быть неправильно сформированы
      // методом msgJsonToMapping
      if (!!this._cacheSrv.messages.list[msgData.msgId]) {
        tmpMsgMap.timeCr = angular.copy(msgData.timeCr);
        tmpMsgMap.labels = angular.copy(this._cacheSrv.messages.list[msgData.msgId].labels);
        tmpMsgMap.isRead = angular.copy(this._cacheSrv.messages.list[msgData.msgId].isRead);
        tmpMsgMap.isReply = angular.copy(this._cacheSrv.messages.list[msgData.msgId].isReply);
      }
    }

    // запись message в storage
    const msgFileName = `${folderId}/${msgData.msgKey}/${CONST.USED_FILES_NAMES.message}`;
    let saveSuccess = true;
    await this.fs.writeJSONFile(msgFileName, msgData)
      .catch(async (exc: web3n.files.FileException) => {
        logError(exc);
        saveSuccess = false;
      });
    this._cacheSrv.messages.list[msgData.msgId] = angular.copy(tmpMsgMap);
    await this.writeMsgList();

    // если id сообщения еще не добавлен в список сообщений в папке
    // (поле messageIds), то  добавляем его
    if (this._cacheSrv.folders.list[folderId].messageIds.indexOf(msgData.msgId) === -1) {
      this._cacheSrv.folders.list[folderId].messageIds.push(msgData.msgId);
      await this._folderFsSrv.writeFolderList();
    }

    return saveSuccess;
  }

  /**
   * копирование содержимого папки сообщения
   * @param sourceMsgId {string}
   * @param targetMsgId {string}
   */
  async copyMsgFolder(sourceMsgId: string, targetMsgId: string): Promise<void> {
    if (this.initializing) { await this.initializing; }

    const sourcePath = `${this._cacheSrv.messages.list[sourceMsgId].folderId}/${this._cacheSrv.messages.list[sourceMsgId].msgKey}`;
    const targetPath = `${this._cacheSrv.messages.list[targetMsgId].folderId}/${this._cacheSrv.messages.list[targetMsgId].msgKey}`;
    await this.fs.copyFolder(sourcePath, targetPath);
  }

  /**
   * подготовка AttachmentsContainer для OutgoingMessage перед отправкой
   * msgId {string}
   * attached {client3N.AttachFileInfo[]}
   */
  async prepareAttachContainer(msgId: string, attached: client3N.AttachFileInfo[]): Promise<web3n.asmail.AttachmentsContainer> {
    if (this.initializing) { await this.initializing; }
    let container = {} as web3n.asmail.AttachmentsContainer;

    const path = `${CONST.SYS_MAIL_FOLDERS.outbox}/${this._cacheSrv.messages.list[msgId].msgKey}/attachments`;
    for (let item of attached) {
      if (item.mode !== 'saved') continue;

      let mode = await LIB.whatIsIt(this.fs, path, item.name);
      let srcFile: web3n.files.File;
      switch (mode) {
        case 'file':
          srcFile = await this.fs.readonlyFile(`${path}/${item.name}`);
          break;
        case 'link':
          const srcLink = await this.fs.readLink(`${path}/${item.name}`);
          srcFile = (await srcLink.target()) as web3n.files.File;
          break;
      }
      Attach.addFileTo(container, srcFile, item.name);
    }

    return container;
  }

  /**
   * функция физического перемещения папки сообщения внутри 3N файловой
   * системы из одной почтовой папки в другую
   * @param msgId {string} - message ID
   * @param targetFolderId {string} - ID целевой папки
   * @returns {Promise<boolean>}
   */
  async moveMsgInsideFS(msgId: string, targetFolderId: string): Promise<boolean> {
    if (this.initializing) { await this.initializing; }
    let isMovedSuccess = true;

    const allFolderIds = Object.keys(this._cacheSrv.folders.list);
    // если целевой почтовой папки "не существует"
    if (allFolderIds.indexOf(targetFolderId) === -1) { return false; }

    const msgKey = this._cacheSrv.messages.list[msgId].msgKey;
    const sourceFolderId = this._cacheSrv.messages.list[msgId].folderId;
    const indexMovedMsgInFolder = this._cacheSrv.folders.list[sourceFolderId].messageIds.indexOf(msgId);

    const sourcePath = `${sourceFolderId}/${msgKey}`;
    const targetPath = `${targetFolderId}/${msgKey}`;

    if (sourceFolderId === CONST.SYS_MAIL_FOLDERS.inbox) {
      // перемещение из Inbox
      const incomMsg = await w3n.mail.inbox.getMsg(msgId);
      let msg = await Transform.incomingToJSON(incomMsg);
      if ('attachments' in incomMsg) {
        await this.fs.saveFolder(incomMsg.attachments, `${targetPath}/attachments`);
      }
      await this.fs.writeJSONFile(`${targetPath}/${CONST.USED_FILES_NAMES.message}`, msg);
      await w3n.mail.inbox.removeMsg(msgId)
        .catch(async (exc: web3n.asmail.ASMailSendException) => {
          logError(exc);
          isMovedSuccess = false;
        });
    } else {
      // перемещение не из Inbox
      await this.fs.move(sourcePath, targetPath)
        .catch(async (exc: web3n.files.FileException) => {
          logError(exc);
          isMovedSuccess = false;
        });
    }

    this._cacheSrv.messages.selectId = null;
    this._cacheSrv.messages.list[msgId].folderId = targetFolderId;
    this._cacheSrv.folders.list[sourceFolderId].messageIds.splice(indexMovedMsgInFolder, 1);
    this._cacheSrv.folders.list[targetFolderId].messageIds.push(msgId);

    /* внесение изменений в маппинг списка папок и списка сообщений */
    await this.writeMsgList();
    await this._folderFsSrv.writeFolderList();

    const fId: string = this.$stateParams.folderId;
    /* TODO необходим ли этот переход при перемещении папки сообщения??? */
    // this.$state.transitionTo('root.mail.folder', { folderId: fId, msgId: null }, { reload: true, notify: true });

    return isMovedSuccess;
  }

}
