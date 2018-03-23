/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. */

import * as CONST from '../../../common/services/const';
import * as LIB from '../../../common/services/lib-internal';
import * as CacheSrvMod from '../../../common/services/cache-srv';
import * as AttachSrvMod from "./msg-attach-srv";

export let ModuleName = '3nClient.components.msg-attach';

class Controller {
  private attached: client3N.AttachFileInfo[];
  private attachments: web3n.files.File[];
  private msgId: string;
  private sourceMsgId: string;
  private readOnly: boolean;
  private MAIL_FOLDER_IDS: { [key: string]: string };
  private listIsOpen: boolean = false;

  static $inject= ['$scope', '$timeout', CacheSrvMod.CacheSrvName, AttachSrvMod.MsgAttachSrvName];
  constructor(
    private $scope: angular.IScope,
    private $timeout: angular.ITimeoutService,
    private _cacheSrv: CacheSrvMod.Cache,
    private _attachSrv: AttachSrvMod.Srv
  ) {
    this.$timeout(async () => {
      this.MAIL_FOLDER_IDS = CONST.SYS_MAIL_FOLDERS;
      await this.init();
    });
  }

  async init(): Promise<void> {
    let currentMsgId = (!!this.sourceMsgId) ? this.sourceMsgId : this.msgId;
    this.attachments = await this._attachSrv.readMsgAttachedFiles(currentMsgId, this.attached);
    if (this.msgId === 'new') {
      for (let item of this.attached) {
        item.mode = 'not_saved';
      }
    }
  }

  /**
   * отфильтровывание файлов с пометкой "к удалению"
   */
  onlyHave(value: client3N.AttachFileInfo) {
    return value.mode !== 'delete';
  }

  /**
   * запуск процедуры присоединения файлов к сообщению
   */
  async attachFiles(): Promise<void> {
    console.info('Attach action ...');
    const response = await this._attachSrv.loadFilesFromExternalFS(this.attached);
    this.$timeout(() => {
      this.attached = response.attached;
      this.attachments = this.attachments.concat(response.attachments);
    });
  }

  /**
   * запуск процедуры удаления всех присоединенных к сообщению файлов
   */
  deleteFiles(): void {
    console.info('Delete all files ...');
    this.attachments = [];
    let markFilesIndex: number[] = []; // массив для хранения индексов файлов с mode === 'not_saved'
    for (let i = 0; i < this.attached.length; i++) {
      if (this.attached[i].mode === 'saved') {
        this.attached[i].mode = 'delete';
      } else {
        markFilesIndex.push(i);
      }
    }
    markFilesIndex.reverse();
    for (let index of markFilesIndex) {
      this.attached.splice(index, 1)
    }
    this.listIsOpen = false;
  }

  /**
   * показать/скрыть список присоединенных к сообщению файлов
   */
  openList(): void {
    this.listIsOpen = !this.listIsOpen;
  }

  /**
   * запуск процедуры удаления одного присоединенного файла
   * @param index {number}
   */
  delFile(index: number): void {
    console.log(`File ${this.attached[index].name} will delete ...`);
    if (this.attached[index].mode === 'not_saved') {
      let notSavedIndex: number = null;
      let j: number = 0;
      for (let i = 0; i < this.attached.length; i++) {
        if (this.attached[i].mode === 'not_saved') {
          notSavedIndex = (i === index) ? j : notSavedIndex;
          j += 1;
        }
      }
      this.attached.splice(index, 1);
      this.attachments.splice(notSavedIndex, 1);
    } else {
      this.attached[index].mode = 'delete';
    }
    let hasItemNotSaved = 0;
    for (let item of this.attached) {
      hasItemNotSaved = (item.mode === 'not_saved') ? hasItemNotSaved + 1 : hasItemNotSaved;
    }
    if (hasItemNotSaved === 0) {
      this.listIsOpen = false;
    }

  }

  /**
   * запуск процедуры сохранения присоединенного файла во "внешнюю" ФС
   * @param index {number}
   */
  async downloadFile(index: number): Promise<void> {
    if ((this.attached[index].mode === "saved") && (this._cacheSrv.messages.list[this.msgId].folderId !== CONST.SYS_MAIL_FOLDERS.outbox)) {
      console.log(`File ${this.attached[index].name} will download ...`);
      this._attachSrv.saveFileToExternalFS(this.msgId, this.attached[index].name);
    }
  }

}


let componentConfig: angular.IComponentOptions = {
  bindings: {
    attached: '=',
    attachments: '=',
    msgId: '<',
    sourceMsgId: '<',
    readOnly: '<'
  },
  templateUrl: './templates/mail/message/msg-attach/msg-attach.html',
  controller: Controller
}

export function addComponent(angular: angular.IAngularStatic): void {
  let mod = angular.module(ModuleName, []);
  mod.component('msgAttach', componentConfig);
}

Object.freeze(exports);
