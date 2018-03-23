/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. */

import * as LIB from '../../../common/services/lib-internal';
import * as CONST from '../../../common/services/const';
import * as Transform from '../../../common/services/transform-mail';
import * as CacheSrvMod from '../../../common/services/cache-srv';
import * as CommomSrvMod from '../../../common/services/common-srv';
import * as MsgEditSrvMod from './msg-edit-srv';
import * as MailSrvMod from '../../mail-app/mail-srv';

export let ModuleName = '3nClient.components.msg-edit';

class Controller {
  private content: client3N.MessageEditContent;
  private currentAttachments: web3n.files.File[];
  private keys: any[];
  private utility: {
    to: { search: string; selected: string; };
    cc: { search: string; selected: string; };
    bc: { search: string; selected: string; };
  };
  private isShowMoreAddress: boolean = false;
  private isShowEditorToolbar: boolean = false;

  static $inject = ['$scope', '$state', '$timeout', '$mdConstant', CacheSrvMod.CacheSrvName, MsgEditSrvMod.MsgEditSrvName, MailSrvMod.MailSrvName, CommomSrvMod.CommonSrvName];
  constructor(
    private $scope: angular.IScope,
    private $state: angular.ui.IStateService,
    private $timeout: angular.ITimeoutService,
    private $mdConstant: any,
    private _cacheSrv: CacheSrvMod.Cache,
    private _msgEditSrv: MsgEditSrvMod.Srv,
    private _mailSrv: MailSrvMod.Srv,
    private _commonSrv: CommomSrvMod.Srv
  ) {
    this.keys = [this.$mdConstant.KEY_CODE.ENTER, this.$mdConstant.KEY_CODE.TAB, this.$mdConstant.KEY_CODE.UP_ARROW, this.$mdConstant.KEY_CODE.DOWN_ARROW];

    this.utility = {
      to: { search: null, selected: null },
      cc: { search: null, selected: null },
      bc: { search: null, selected: null }
    };

    this.$scope.$on('client_runMsgSavingToDraftProcess', async () => {
      const result = await this.runMsgSaveToDraft();
      if (!!result) {
        this.$scope.$emit('client_endMsgSavingToDraftProcess', result);
      }
    });

  }

  /**
   * показать поля "Copy" и "Hidden copy"
   */
  showMore(): void {
    const moreElems = document.querySelectorAll('div[more]') as any as Element[];
    const toElem = document.querySelector('div[to]');
    this.isShowMoreAddress = !this.isShowMoreAddress;
    for (let elem of moreElems) {
      (elem as HTMLElement).style.display = (this.isShowMoreAddress) ? 'flex' : 'none';
    }
  }

  /**
   * показать тулбар редактора
   */
  showEditorToolbar(): void {
    this.isShowEditorToolbar = !this.isShowEditorToolbar;
    const editorToolbarElem = document.querySelector('.ql-toolbar');
    (editorToolbarElem as HTMLElement).style.display = (this.isShowEditorToolbar) ? 'block' : 'none';
  }

  /**
   * функция трансформации chip при автопоиске контакта
   * - если chip = Object (т.е. найден похожий контакт в списке), то
   * в массив, "отвечающий" за отображение добавляется nickName, а в
   * поле адреса добавляется адрес (mail)
   * - если chip = string и он проходит валидацию как mail (т.е. не найден похожий
   * контакт, но вводимый текст является 3nmail), то и в массив, "отвечающий"
   * за отображение, и в поле адреса добавляется вводимый текст
   * @param field {'to'|'cc'|'bc'}
   * @param chip {client3N.PersonMapping | string}
   */  
  transformAddress(field: 'to'|'cc'|'bc', chip: client3N.PersonMapping | string): string {
    let part = (field === "to") ? "mailAddressTO" : ((field === "cc") ? "mailAddressCC" : "mailAddressBC");

    if (angular.isObject(chip)) {
      this.content[part].push((chip as client3N.PersonMapping).mails[0]);
      return (chip as client3N.PersonMapping).nickName;
    }

    if (LIB.checkAddress((chip as string))) {
      this.content[part].push(chip);
      return (chip as string);
    }

    return null;
  }
  
  /**
   * функция удаления необходимого элемента из поля адреса (массива, содержащего адреса),
   * при удалении элемента из массив, отвечающего за отображение
   * @param field {'to'|'cc'|'bc'}
   * @param chip {string} - содержимое удаляемого элемента массива, отвечающего за отображение
   * @param index {number} - номер (индекс) удаляемого элемента массива, отвечающего за отображение
   */
  removeAddress(field: 'to'|'cc'|'bc', chip: string, index: number): void {
    let part = (field === "to") ? "mailAddressTO" : ((field === "cc") ? "mailAddressCC" : "mailAddressBC");

    this.content[part].splice(index, 1);
  }

  /**
   * поиск контакта по полям nickName и mails[0]
   * @param search {string}
   * @return {client3N.PersonMapping[]}
   */
  queryContactsSearch(search: string): client3N.PersonMapping[] {
    let transformSearch = search.toLocaleLowerCase();
    let arrayPerson = Object.keys(this._cacheSrv.contacts.list).map((key) => {
      return this._cacheSrv.contacts.list[key];
    });
    return arrayPerson.filter((item) => {
      return (item.nickName.toLocaleLowerCase().indexOf(transformSearch) > -1) || (item.mails[0].toLocaleLowerCase().indexOf(transformSearch) > -1);
    });
  }

  /**
   * подготовка данных для отображения присоедененного файла
   * @param attachItem {client3N.AttachFileInfo}
   * @returns { fileName: string; fileExt: string }
   */
  prepareAttachItemInfo(attachItem: client3N.AttachFileInfo): { fileName: string; fileExt: string } {
    let result = {
      fileName: '',
      fileExt: ''
    };
    const fileTitleParts = attachItem.name.split('.');
    const fileTitlePartsSize = fileTitleParts.length;
    result = {
      fileName: fileTitleParts.splice(0, fileTitlePartsSize - 1).join('.'),
      fileExt: fileTitleParts[fileTitlePartsSize - 1]
    }
    return result;
  }

  /**
   * прекращение создания/редактирования сообщения
   */
  cancelEditMsg(): void {
    this.$scope.$emit('client_cancelEditMsg');
  }

  /**
   * запуск процесса записи сообщения в папку Draft
   */
  async runMsgSaveToDraft(): Promise<{msgId: string, attached?: client3N.AttachFileInfo[]}> {
    const result = await this._msgEditSrv.saveMsgToFolder(this.content, this.currentAttachments, CONST.SYS_MAIL_FOLDERS.draft);

    // TO DO сообщение об ошибке если она возникла
    if (!result) {
      this._commonSrv.sysNotification('error', null, 'Application error. Inform the developers.');
    }  
    
    return result;
  }

  /**
   * отправка сообщения
   */
  async runSendMsg(): Promise<void> {
    // console.info('The message will send!');
    // console.log(this.content);
    // console.log(this.currentAttachments);
    this._cacheSrv.messages.selectId = null;
    const form: angular.IFormController = this.$scope.msgEditForm;
    this.$scope.$emit('client_sendingEditMsg');
    if (this.content.msgId === 'new' || (this.content.msgId !== 'new' && !form.$dirty)) {
      this._mailSrv.runSendMsg(this.content, this.currentAttachments);
    } else {
      this._mailSrv.runSendMsg(this.content, this.currentAttachments, true);
    }
  }
  
}

let componentConfig: angular.IComponentOptions = {
  bindings: {
    content: '<'
  },
  templateUrl: './templates/mail/message/msg-edit/msg-edit.html',
  controller: Controller
}

export function addComponent(angular: angular.IAngularStatic): void {
  let mod = angular.module(ModuleName, []);
  mod.component('msgEdit', componentConfig);
}

Object.freeze(exports);