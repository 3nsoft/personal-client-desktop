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

import { copy, IAngularEvent, IAngularStatic, IRootScopeService } from 'angular';
import { appMailState, mailSyncedFS } from '../common/app-mail-store';
import { createNewMailFolderList } from '../../common/helpers';
import * as MsgMoveSrvModule from './message-move/message-move.service';

export let ModuleName = '3nClient.services.app-mail';
export let AppMailServiceName = 'appMailService';

export function addService(ng: IAngularStatic): void {
  const module = ng.module(ModuleName, []);
  module.service(AppMailServiceName, AppMailService);
}

export class AppMailService {
  static $inject = ['$rootScope', MsgMoveSrvModule.MessageMoveServiceName];
  constructor(
    private $rootScope: IRootScopeService,
    private msgMoveSrv: MsgMoveSrvModule.MessageMoveService,
  ) {
    this.$rootScope.$on(
      'confirmEvent',
      async (event: IAngularEvent, arg: client3N.ConfirmEventArguments<string>) => {
          if (arg.eventType === 'message_delete' && arg.value === true) {
            await this.msgMoveSrv.completeMessagesDeletion([arg.data]);
          }
      },
    );

    this.$rootScope.$on(
      'confirmEvent',
      async (event: IAngularEvent, arg: client3N.ConfirmEventArguments<string[]>) => {
        if (arg.eventType === 'messages_delete' && arg.value === true) {
          await this.msgMoveSrv.completeMessagesDeletion(arg.data);
        }
      },
    );

    this.$rootScope.$on(
      'confirmEvent',
      async (event: IAngularEvent, arg: client3N.ConfirmEventArguments<string[]>) => {
        if (arg.eventType === 'clear_trash' && arg.value === true) {
          await this.msgMoveSrv.completeMessagesDeletion(arg.data);
        }
      },
    );
  }

  public getMailFolderList(): void {
    mailSyncedFS.getMailFolders()
      .then(list => {
        if (list) {
          appMailState.values.list = list;
        } else {
          const folderList = createNewMailFolderList();
          appMailState.values.list = copy(folderList);
          mailSyncedFS.saveMailFolders(appMailState.values.list);
        }
      });
  }

  public getMessageList(): void {
    mailSyncedFS.getMessageList()
      .then(list => {
        if (list) {
          appMailState.values.messageList = list;
        } else {
          appMailState.values.messageList = {};
        }
      });
  }

  public async saveMailFolderList(list: {[id: string]: client3N.MailFolder}): Promise<void> {
    return mailSyncedFS.saveMailFolders(list);
  }

  public async saveMessageList(list: {[id: string]: client3N.MessageListItem}): Promise<void> {
    return mailSyncedFS.saveMessageList(list);
  }

  // private afterDelete(folderId: string, msgKeys: string[]): void {
  //   appMailState.values.selectedMessageKeys = [];
  //   const mailFolders = copy(appMailState.values.list);
  //   const mailFolder = copy(appMailState.values.list[folderId]);
  //   const msgListUpdated = copy(appMailState.values.messageList);
  //   msgKeys.forEach(msgKey => {
  //     const deletedMsgIndex = mailFolder.messageKeys.indexOf(msgKey);
  //     if (deletedMsgIndex > -1) {
  //       mailFolder.messageKeys.splice(deletedMsgIndex, 1);
  //     }
  //     delete msgListUpdated[msgKey];
  //   });
  //   mailFolders[mailFolder.id] = mailFolder;
  //   appMailState.values.list = copy(mailFolders);
  //   appMailState.values.messageList = copy(msgListUpdated);
  // }

}
