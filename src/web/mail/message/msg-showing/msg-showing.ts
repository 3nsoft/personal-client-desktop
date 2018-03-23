/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. */

import * as CONST from '../../../common/services/const';
import * as LIB from '../../../common/services/lib-internal';
import * as CacheSrvMod from '../../../common/services/cache-srv';
import * as CommonSrvMod from '../../../common/services/common-srv';
import * as MailFsSrvMod from '../../mail-app/mail-fs-srv';
import * as MailSrvMod from '../../mail-app/mail-srv';
import * as MsgSrvMod from '../msg-edit/msg-edit-srv';

export let ModuleName = '3nClient.components.msg-showing';

class Controller {
  msgContent: client3N.MessageEditContent;
  currentAttachments: web3n.files.File[];
  fastReplyText: string;
  isShowAll: boolean = false;
  MAIL_FOLDER_IDS: { [key: string]: string } = CONST.SYS_MAIL_FOLDERS;
  show: {
    reply: boolean;
    replyAll: boolean;
    forward: boolean;
    edit: boolean;
  };

	static $inject = ['$state', '$stateParams', '$timeout', CacheSrvMod.CacheSrvName, CommonSrvMod.CommonSrvName, MailFsSrvMod.MailFsSrvName, MailSrvMod.MailSrvName, MsgSrvMod.MsgEditSrvName];
  constructor(
    private $state: angular.ui.IStateService,
    private $stateParams: angular.ui.IStateParamsService,
    private $timeout: angular.ITimeoutService,
    private _cacheSrv: CacheSrvMod.Cache,
    private _commonSrv: CommonSrvMod.Srv,
    private _mailFsSrv: MailFsSrvMod.Srv,
    private _mailSrv: MailSrvMod.Srv,
    private _msgSrv: MsgSrvMod.Srv
	) { 
    this.$timeout(async () => {
      if (!this._cacheSrv.messages.list[this.msgContent.msgId].isRead) {
        this._cacheSrv.messages.list[this.msgContent.msgId].isRead = true;
        await this._mailFsSrv.writeMsgList();
      }
      
      const currentFolderId = this._cacheSrv.messages.list[this.msgContent.msgId].folderId;
      switch (currentFolderId) {
        case CONST.SYS_MAIL_FOLDERS.outbox:
          this.runShowSendingProgress();
          break;
        case CONST.SYS_MAIL_FOLDERS.draft:
          this.show = {
            reply: false,
            replyAll: false,
            forward: false,
            edit: true
          };
          break;
        default:
          const isMsgOut = this._cacheSrv.messages.list[this.msgContent.msgId].isOut;
          this.show = {
            reply: (isMsgOut) ? false : true,
            replyAll: (isMsgOut) ? false : true,
            forward: (this.msgContent.mailAddressTO.length + this.msgContent.mailAddressCC.length + this.msgContent.mailAddressBC.length) > 0 ? true : false,
            edit: false
          };
      }
    });
  }

  private getAddressColor(mail: string): string {
    if (mail === this._cacheSrv.username) return '#ffc765';
    for (let personId of Object.keys(this._cacheSrv.contacts.list)) {
      if (this._cacheSrv.contacts.list[personId].mails[0] === mail) return this._cacheSrv.contacts.list[personId].color;
    }
    return 'rgba(0, 0, 0, 0.54)'
  }

  private getInverseColor(color: string): string {
    return LIB.invertColor(color);
  }

  private showAddresses(): void {
    this.isShowAll = !this.isShowAll;
  }

  private openAddMenu($mdMenu, ev): void {
    $mdMenu.open(ev);
  }

  private async runSaveMsgContent(mode: 'html' | 'text'): Promise<void> {
    this._msgSrv.saveMsgContent(this.msgContent, mode);
  }

  private openForEditing(): void {
    this._msgSrv.editMsg(this.msgContent)
      .then(res=> {
        if (res.status === 'close_with_save') {
          (this.$state as any).reload('root.mail.folder');
        }
      });
  }

  private markAsUnread(): void {
    this._msgSrv.markAsUnread(this.msgContent.msgId);
  }

  private runMoveMsg(): void {
    this._msgSrv.moveMsg(this.msgContent.msgId);
  }

  delMsg(): angular.IPromise<void> {
    return this._msgSrv.deleteMessage(this.msgContent.msgId)
      .then(() => {
        const fId: string = this.$stateParams.folderId;
        this.$state.transitionTo('root.mail.folder', { folderId: fId, msgId: null }, { reload: true, notify: true });
      });
  }

  async runSendMsg(): Promise<void> {
    if (this._cacheSrv.messages.list[this.msgContent.msgId].folderId === CONST.SYS_MAIL_FOLDERS.draft) {
      await this._mailSrv.runSendMsg(this.msgContent, this.currentAttachments);
    } else {
      const pMsg = this._msgSrv.prepareMsgForForwardAndReply(this.msgContent, 'forward');
      this._msgSrv.editMsg(pMsg)
        .then(res => {
          console.info(res);
          if (res.status === 'close_with_save') {
            (this.$state as any).reload('root.mail.folder');
          }
        })
        .catch(err => {
          console.info(err);
        });
    }
  }

  async runReplyMsg(mode: 'reply' | 'replyAll'): Promise<void> {
    const pMsg = this._msgSrv.prepareMsgForForwardAndReply(this.msgContent, mode);
    this._msgSrv.editMsg(pMsg)
      .then(res => {
        console.info(res);
        if (res.status === 'close_with_save') {
          (this.$state as any).reload('root.mail.folder');
        }
      })
      .catch(err => {
        console.info(err);
      });
    
  }

  runFastReply(): void {
    let pMsg = this._msgSrv.prepareMsgForForwardAndReply(this.msgContent, 'reply');
    pMsg.bodyHTML = `<div>${this.fastReplyText}</div>` + pMsg.bodyHTML;
    const pMsgAttachments: web3n.files.File[] = [];
    this._mailSrv.runSendMsg(pMsg, pMsgAttachments);
  }

  async runShowSendingProgress(): Promise<void> {
    await this._mailSrv.showProgress(this.msgContent.msgId);
  }

  async cancelSendMsg(): Promise<void> {
    await this._mailSrv.runSendMsgCancelling(this.msgContent.msgId);
  }

  isItLink(event: MouseEvent) {
    event.preventDefault();
  }

}

let componentConfig: angular.IComponentOptions = {
  bindings: {
    msgContent: '<'
  },
  templateUrl: './templates/mail/message/msg-showing/msg-showing.html',
  controller: Controller
}

export function addComponent(angular: angular.IAngularStatic): void {
  let mod = angular.module(ModuleName, []);
  mod.component('msgShowing', componentConfig);
}

Object.freeze(exports);