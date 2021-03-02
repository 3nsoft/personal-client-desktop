/*
 Copyright (C) 2018 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under
 the terms of the GNU General Public License as published by the Free Software
 Foundation, either version 3 of the License, or (at your option) any later
 version.

 This program is distributed in the hope that it will be useful, but
 WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with
 this program. If not, see <http://www.gnu.org/licenses/>.
*/
import { copy, IAngularStatic, IComponentOptions, ITimeoutService } from 'angular';
import { Subject } from 'rxjs/Subject';
import { takeUntil } from 'rxjs/operators';
import { appMailState, messageSyncedFS } from '../common/app-mail-store';
import { Message } from '../services/message-manager/message.model';
import * as MessageServiceModule from '../services/message-send.service';
import * as MessageHelpersServiceModule from '../services/message-manager/message-manager.helpers.service';
import { transformInToMessage } from '../services/message-receiving.service';
import * as MessageManagerServiceModule from '../services/message-manager/message-manager.service';
import * as MessageMoveServiceModule from '../services/message-move/message-move.service';
import * as ConfirmServiceModule from '../../common/services/confirm-dialog.service';
import * as AttachServiceModule from '../services/attach.service';
import { SYS_MAIL_FOLDERS } from '../../../common/const';
import { MailMessageToolbarAction  } from './app-mail-message-toolbar/app-mail-message-toolbar';
import { setReadFlag } from './app-mail-message.helper';
import { convertTimestamp, getElementColor } from '../../common/helpers';

export const ModuleName = '3nClient.component.app-mail-message';

export function addComponent(ng: IAngularStatic): void {
  const mod = ng.module(ModuleName, []);
  mod.component('appMailMessage', componentConfig);
}

class AppMailMessageComponent {
  public message: Message;
  public messageMap: client3N.MessageListItem;
  public isDisable: boolean = false;
  public selectedFolderId: string;
  public recipientsQt: number = null;
  public recipients: string[] = [];

  private ngUnsubscribe: Subject<void> = new Subject<void>();

  static $inject = [
    '$timeout',
    MessageServiceModule.MessageSendServiceName,
    MessageManagerServiceModule.MessageManagerServiceName,
    MessageMoveServiceModule.MessageMoveServiceName,
    ConfirmServiceModule.ConfirmDialogServiceName,
    MessageHelpersServiceModule.MessageManagerHelpersServiceName,
    AttachServiceModule.AttachServiceName,
  ];
  constructor(
    private $timeout: ITimeoutService,
    private msgSrv: MessageServiceModule.MessageSendService,
    private msgManager: MessageManagerServiceModule.MessageManagerService,
    private msgMoveSrv: MessageMoveServiceModule.MessageMoveService,
    private confirmSrv: ConfirmServiceModule.ConfirmDialogService,
    private msgHelpersSrv: MessageHelpersServiceModule.MessageManagerHelpersService,
    private attachSrv: AttachServiceModule.AttachService,
  ) {}

  $onInit(): void {
    appMailState
      .change$
      .selectFolderId
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(folderId => {
        this.$timeout(() => {
          this.selectedFolderId = folderId;
        });
      });

    appMailState
      .change$
      .selectedMessageKeys
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(async keys => {
        if (keys && keys.length > 0) {
          const firstSelectMsgFolderId = appMailState.values.messageList[keys[0]].folderId;
          console.log('M: ', JSON.stringify(keys), firstSelectMsgFolderId);
          let dataForMsg: client3N.Message;
          switch (firstSelectMsgFolderId) {
            case SYS_MAIL_FOLDERS.inbox:
              dataForMsg = await this.readIncomingMsg(keys[0]);
              this.message = new Message();
              this.$timeout(() => {
                console.log(0);
                this.message.createFromMessage(dataForMsg);
                this.messageMap = appMailState.values.messageList[this.message.msgKey];
                this.isDisable = keys.length > 1;
              });
              break;
            case SYS_MAIL_FOLDERS.outbox:
              dataForMsg = await messageSyncedFS.readJsonDataFromFS<client3N.Message>(
                firstSelectMsgFolderId,
                keys[0],
              );
              this.message = new Message();
              this.$timeout(_ => {
                this.message.createFromMessage(dataForMsg);
                this.messageMap = appMailState.values.messageList[this.message.msgKey];
              });
              break;
            default:
              dataForMsg = await messageSyncedFS.readJsonDataFromFS<client3N.Message>(
                firstSelectMsgFolderId,
                keys[0],
              );
              this.message = new Message();
              this.$timeout(() => {
                console.log('ANY');
                this.message.createFromMessage(dataForMsg);
                this.messageMap = appMailState.values.messageList[this.message.msgKey];
                this.isDisable = keys.length > 1;
              });
          }
          this.$timeout(() => {
            this.recipientsQt = this.message.alias.length - 1;
            this.getRecipients();
          });

        } else {
          this.$timeout(() => {
            this.message = undefined;
            this.messageMap = undefined;
            this.recipients = [];
            this.recipientsQt = null;
            this.isDisable = false;
          });
        }
      });
  }

  $onDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public getDate(): string {
    return convertTimestamp(this.message.timestamp);
  }

  public getColor(str: string): string {
    return getElementColor(str);
  }

  public async onAction(mode: MailMessageToolbarAction): Promise<void> {
    console.log('Action ', mode);
    switch (mode) {
      case MailMessageToolbarAction.EditMsg:
        this.msgManager.openMessageManager(this.message.msgId, 'edit');
        break;
      case MailMessageToolbarAction.DelMsg:
        if (appMailState.values.messageList[this.message.msgKey].folderId !== SYS_MAIL_FOLDERS.trash) {
          const moveMessageStatus = await this.msgMoveSrv.moveMessageFolder(this.message.msgKey, SYS_MAIL_FOLDERS.trash);
          if (moveMessageStatus) {
            this.msgMoveSrv.afterSuccessMoveMessageFolder(SYS_MAIL_FOLDERS.trash, [this.message.msgKey]);
          }
          const msgListUpdated = copy(appMailState.values.messageList);
          msgListUpdated[this.message.msgKey].folderId = SYS_MAIL_FOLDERS.trash;
          appMailState.values.messageList = copy(msgListUpdated);
          appMailState.values.selectedMessageKeys = [];
        } else {
          this.confirmSrv.showConfirm<string>(
            'Are you sure?',
            '',
            'message_delete',
            this.message.msgKey,
          );
        }
        break;
      case MailMessageToolbarAction.SendMsg:
        console.log('Send ...');
        this.msgSrv.runSendMessage(this.message);
        break;
      case MailMessageToolbarAction.ReplyMsg:
        console.log('Reply ...');
        this.msgManager.openMessageManagerReply(this.message, 'reply');
        break;
      case MailMessageToolbarAction.ReplyAllMsg:
        console.log('Reply all...');
        this.msgManager.openMessageManagerReply(this.message, 'replyAll');
        break;
      case MailMessageToolbarAction.ForwardMsg:
        console.log('Forward ...');
        const folderId = appMailState.values.messageList[this.message.msgKey].folderId;
        this.msgManager.openMessageManagerForward(this.message, folderId);
        break;
      case MailMessageToolbarAction.SaveMsg:
        console.log('Save message to external FS ...');
        this.msgHelpersSrv.saveMsgContent(this.message, 'html');
        break;
      case MailMessageToolbarAction.SaveAttach:
        console.log('Save all attachments ...');
        this.attachSrv.saveAttachments(this.message.msgKey);
        break;
      case MailMessageToolbarAction.MoveMsg:
        console.log('Move message to mail folder ...');
        this.msgMoveSrv.openMessageMoveManager([this.message.msgKey]);
        break;
      case MailMessageToolbarAction.UnreadMsg:
        console.log('Set unread flag ...');
        setReadFlag(this.message.msgKey, false);
        break;
      case MailMessageToolbarAction.StopSend:
        console.log('Stop sending message ...');
        this.msgSrv.cancelSending(this.message.msgId);
        appMailState.values.selectedMessageKeys = [];
        break;
    }
  }

  public showRecipients(): void {
    if (this.recipientsQt) {
      this.recipientsQt = null;
    } else {
      this.recipientsQt = this.message.alias.length - 1;
    }
    this.$timeout(() => {
      this.getRecipients();
    });
  }

  public completeRemoval(attach: client3N.AttachFileInfo): void {
    console.log(attach);
  }

  private async readIncomingMsg(msgKey: string): Promise<client3N.Message> {
    const msgId = appMailState.values.messageList[msgKey].msgId;
    const inMsg = await w3n.mail.inbox.getMsg(msgId);
    console.log(inMsg);
    const res = await transformInToMessage(inMsg);
    return res;
  }

  private getRecipients(): void {
    if (!this.recipientsQt) {
      this.recipients = this.message.alias.slice();
    } else {
      this.recipients = [this.message.alias[0]];
    }
  }

}

const componentConfig: IComponentOptions = {
  bindings: {},
  templateUrl: './apps/app-mail/app-mail-message/app-mail-message.component.html',
  controller: AppMailMessageComponent,
};
