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
import { IAngularStatic, IComponentOptions, ITimeoutService } from 'angular';
import { Subject } from 'rxjs/Subject';
import { takeUntil } from 'rxjs/operators';
import { appMailState } from '../common/app-mail-store';
import * as MsgMoveSrvModule from '../services/message-move/message-move.service';
import * as ConfirmServiceModule from '../../common/services/confirm-dialog.service';
import { getMessageListByFolder, messageListToArray } from '../common/app-mail-messages.helper';
import { setReadFlag } from '../app-mail-message/app-mail-message.helper';
import { SYS_MAIL_FOLDERS } from '../../../common/const';
import { isDateInPeriod } from '../../common/helpers/forDateTime';

export const ModuleName = '3nClient.component.app-mail-messages';

export function addComponent(ng: IAngularStatic): void {
  const mod = ng.module(ModuleName, []);
  mod.component('appMailMessages', componentConfig);
}

class AppMailMessagesComponent {
  public messageList: client3N.MessageListItem[] = [];
  public filteredMessageList: client3N.MessageListItem[] = [];
  public selectMessagesIds: string[];
  public timeFilterType: 'today'|'week'|'all' = 'all';
  public isToolbarBtnShow: boolean = false;

  private ngUnsubscribe: Subject<void> = new Subject<void>();

  static $inject = [
    '$timeout',
    MsgMoveSrvModule.MessageMoveServiceName,
    ConfirmServiceModule.ConfirmDialogServiceName,
  ];

  constructor(
    private $timeout: ITimeoutService,
    private msgMoveSrv: MsgMoveSrvModule.MessageMoveService,
    private confirmSrv: ConfirmServiceModule.ConfirmDialogService,
  ) {}

  $onInit(): void {
    this.messageList = getMessageListByFolder(
      messageListToArray(appMailState.values.messageList),
      appMailState.values.selectFolderId,
    );
    this.filterChange();
    this.selectMessagesIds = appMailState.values.selectedMessageKeys;

    appMailState
      .change$
      .messageList
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(list => {
        console.log('App Mail:', list);
        this.$timeout(() => {
          this.messageList = getMessageListByFolder(
            messageListToArray(list),
            appMailState.values.selectFolderId,
          );
          this.filterChange();
        });
      });

    appMailState
      .change$
      .selectedMessageKeys
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(ids => {
        this.selectMessagesIds = ids;
        if (
          ids &&
          ids.length > 0 &&
          ids[0].indexOf('in=') > -1 &&
          !appMailState.values.messageList[ids[0]].isRead
        ) {
          this.$timeout(() => {}, 200) // tslint:disable-line:no-empty
            .then(() => {
              setReadFlag(ids[0], true);
            });
        }
      });
  }

  $onDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public isMsgSelect(item: client3N.MessageListItem): boolean {
    return this.selectMessagesIds.includes(item.msgKey);
  }

  public filterChange(): void {
    this.filteredMessageList = this.messageList
      .filter(item => isDateInPeriod(new Date(item.timestamp), this.timeFilterType))
      .sort((a: client3N.MessageListItem, b: client3N.MessageListItem) => b.timestamp - a.timestamp);
    // console.log(`Filter is '${this.timeFilterType}: ${this.filteredMessageList}'`);
    this.isToolbarBtnShow = this.filteredMessageList.length > 0 &&
      this.filteredMessageList[0].folderId === SYS_MAIL_FOLDERS.trash;
  }

  public selectMsg(ev: MouseEvent, item: client3N.MessageListItem): void {
    const element = ev.target as HTMLElement;
    switch (element.tagName.toLocaleLowerCase()) {
      case 'path':
        if (appMailState.values.selectFolderId !== SYS_MAIL_FOLDERS.outbox) {
          const itemSelectedIndex = appMailState.values.selectedMessageKeys.indexOf(item.msgKey);
          const tmpSelectedMsg = appMailState.values.selectedMessageKeys.slice();
          if (itemSelectedIndex > -1) {
            tmpSelectedMsg.splice(itemSelectedIndex, 1);
          } else {
            tmpSelectedMsg.push(item.msgKey);
          }
          appMailState.values.selectedMessageKeys = tmpSelectedMsg.slice();
          break;
        }
        break;
      default:
        const isMsgSelected = appMailState.values.selectedMessageKeys.includes(item.msgKey);
        appMailState.values.selectedMessageKeys = isMsgSelected ? [] : [item.msgKey];
        break;
    }
  }

  public async onAction(action: string): Promise<void> {
    switch (action) {
      case 'cancel':
        console.log('Action: CANCEL');
        appMailState.values.selectedMessageKeys = [];
        break;
      case 'select_all':
        console.log('Action: SELECT ALL');
        const allMsgsKeys = Object.keys(appMailState.values.messageList);
        const allMsgInSelectedFolder = allMsgsKeys
          .filter(msgKey => appMailState.values.messageList[msgKey].folderId === appMailState.values.selectFolderId);
        appMailState.values.selectedMessageKeys = allMsgInSelectedFolder.slice();
        break;
      case 'move':
        console.log('Action: MOVE TO FOLDER');
        await this.msgMoveSrv.openMessageMoveManager(this.selectMessagesIds);
        break;
      case 'delete':
        console.log('Action: DELETE');
        if (appMailState.values.messageList[this.selectMessagesIds[0]].folderId !== SYS_MAIL_FOLDERS.trash) {
          await this.msgMoveSrv.preliminaryMessagesDeletion(this.selectMessagesIds);
        } else {
          this.confirmSrv.showConfirm<string[]>(
            'Are you sure?',
            '',
            'messages_delete',
            this.selectMessagesIds,
          );
        }
        break;
      case 'clear_trash':
        const allMsgIdsToDelete = this.filteredMessageList.map(msg => msg.msgKey);
        this.confirmSrv.showConfirm<string[]>(
          'Clear trash',
          'Warning, mails which you are going to delete, will be destroyed and you won’t recover it.',
          'clear_trash',
          allMsgIdsToDelete,
        );
        break;

    }
  }

}

const componentConfig: IComponentOptions = {
  bindings: {},
  templateUrl: './apps/app-mail/app-mail-messages/app-mail-messages.component.html',
  controller: AppMailMessagesComponent,
};
