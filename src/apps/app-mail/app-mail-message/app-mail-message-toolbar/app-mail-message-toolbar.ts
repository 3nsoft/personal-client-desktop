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
import { IAngularStatic, IComponentOptions, IOnChangesObject, IScope, ITimeoutService } from 'angular';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import { fromByteTo, round } from '../../../common/helpers';
import { appMailState } from '../../common/app-mail-store';
import { SYS_MAIL_FOLDERS } from '../../../../common/const';
import { setFlags } from '../app-mail-message.helper';
import { Subscription } from 'rxjs';
import * as MsgSendProgressServiceModule from '../../services/message-send-progress.service';

export interface MailMessageToolbarOptions {
  sendBtn: boolean;
  replyBtn: boolean;
  replyAllBtn: boolean;
  forwardBtn: boolean;
  actions: {
    all: boolean;
    editBtn: boolean;
    saveMsgBtn: boolean;
    saveAttachBtn: boolean;
    moveMsgBtn: boolean;
    unreadBtn: boolean;
    delMsgBtn: boolean;
  };
}

export enum MailMessageToolbarAction {
  SendMsg = 'sendMsg',
  ReplyMsg = 'replyMsg',
  ReplyAllMsg = 'replyAllMsg',
  ForwardMsg = 'forwardMsg',
  EditMsg = 'editMsg',
  SaveMsg = 'saveMsg',
  SaveAttach = 'saveAttach',
  MoveMsg = 'moveMsg',
  UnreadMsg = 'unreadMsg',
  DelMsg = 'delMsg',
  StopSend = 'stopSend',
}

export const ModuleName = '3nClient.component.app-mail-message-toolbar';
export function addComponent(ng: IAngularStatic): void {
  const mod = ng.module(ModuleName, []);
  mod.component('appMailMessageToolbar', componentConfig);
}

export class AppMailMessageToolbarComponent {
  public messageMap: client3N.MessageListItem;
  public action: ({mode: MailMessageToolbarAction}) => void;

  public msgId: string;
  public folderId: string;
  public attach: number;
  public options: MailMessageToolbarOptions;
  public sendingStatusText: string = '';
  public sendingProgress: number = 0;
  private ngUnsubscribe: Subject<void> = new Subject<void>();
  private sub: Subscription;

  static $inject = ['$timeout', MsgSendProgressServiceModule.MsgSendProgressServiceName];
  constructor(
    private $timeout: ITimeoutService,
    private sendProgressSrv: MsgSendProgressServiceModule.MessageSendProgressService,
  ) {}

  $onInit(): void {
    this.options = setFlags(this.messageMap || null);
  }

  $onChanges({messageMap}: IOnChangesObject): void {
    if (messageMap && messageMap.currentValue) {
      this.$timeout(_ => {
        this.msgId = messageMap.currentValue.msgId;
        this.folderId = messageMap.currentValue.folderId;
        this.attach = messageMap.currentValue.attachedFilesNames && messageMap.currentValue.attachedFilesNames.length || 0;
        this.options = setFlags(this.messageMap);
        switch (this.folderId) {
          case SYS_MAIL_FOLDERS.inbox:
            this.options.actions.unreadBtn = messageMap.currentValue.isRead;
            break;
          case SYS_MAIL_FOLDERS.outbox:
            // console.log('Run sending show ...', this.msgId, JSON.stringify(this.sendProgressSrv.getMsgStatuses(), null, 3));
            if (this.sub && !this.sub.closed) { this.sub.unsubscribe(); }
            if (this.sendProgressSrv.getMsgStatus(this.msgId)) {
              this.prepeareSendingStatusText(this.sendProgressSrv.getMsgStatus(this.msgId));
            } else {
              this.sendingProgress = 0;
              this.sendingStatusText = '';
            }
            const delProg$ = new Observable(
              obs => w3n.mail.delivery.observeDelivery(this.msgId, obs));
            this.sub = delProg$.subscribe({
              next: (progress: web3n.asmail.DeliveryProgress) => {
                const totalDataSize = progress.msgSize * Object.keys(progress.recipients).length;
                const sentDataSize = Object.keys(progress.recipients)
                  .map(item => progress.recipients[item].bytesSent)
                  .reduce((sum: number, curVal: number) => {
                    return sum + curVal;
                  }, 0);
                const status = {msgId: this.msgId, totalDataSize, sentDataSize, isComplete: false};
                this.sendProgressSrv.addMsgStatus(this.msgId, status);
                this.prepeareSendingStatusText(status);
              },
              error: () => {
                appMailState.values.sendingStatus = null;
                appMailState.values.selectedMessageKeys = [];
              },
              complete: () => {
                appMailState.values.sendingStatus = null;
                appMailState.values.selectedMessageKeys = [];
              },
            });

            break;
          default:
            this.options.sendBtn = this.options.actions.editBtn = this.folderId === SYS_MAIL_FOLDERS.draft;
            this.options.actions.unreadBtn = messageMap.currentValue.msgKey.indexOf('in') > -1 && messageMap.currentValue.isRead;
            break;
        }
      });
    }
  }

  $onDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public onAction(mode: MailMessageToolbarAction): void {
    this.action({mode});
  }

  private prepeareSendingStatusText(status: client3N.SendingStatus): void {
    if (status && status.totalDataSize) {
      this.$timeout(_ => {
        this.sendingProgress = round(status.sentDataSize / status.totalDataSize * 100, -1);
        this.sendingStatusText = `${this.sendingProgress}% (${fromByteTo(status.sentDataSize)} from ${fromByteTo(status.totalDataSize)})`;
      });
    }
  }
}

const componentConfig: IComponentOptions = {
  bindings: {
    messageMap: '<',
    action: '&',
  },
  templateUrl: './apps/app-mail/app-mail-message/app-mail-message-toolbar/app-mail-message-toolbar.html',
  controller: AppMailMessageToolbarComponent,
};
