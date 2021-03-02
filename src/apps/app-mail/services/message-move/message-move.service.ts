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
import { copy, element, IAngularStatic, IScope, ITimeoutService, material } from 'angular';
import { appMailState, messageSyncedFS } from '../../common/app-mail-store';
import { prepareFolderList } from './message-move.helpers';
import { SYS_MAIL_FOLDERS } from '../../../../common/const';
import { transformInToMessage } from '../message-receiving.service';
import { logError } from '../../../../common/services/libs/logging';

export const ModuleName = '3nClient.services.message-mmove';
export const MessageMoveServiceName = 'messageMoveService';

export function addService(ng: IAngularStatic): void {
  const module = ng.module(ModuleName, []);
  module.service(MessageMoveServiceName, MessageMoveService);
}

interface MessageMove extends IScope {
  folders: client3N.MailFolder[];

  close: () => void;
  selectFolder: (id: string) => void;
}

export class MessageMoveService {
  static $inject = ['$mdDialog'];

  constructor(
    private $mdDialog: material.IDialogService,
  ) {}

  public openMessageMoveManager(msgKeys: string[] = []): void {
    this.$mdDialog.show({
      parent: element(document.body),
      clickOutsideToClose: false,
      escapeToClose: false,
      multiple: true,
      templateUrl: './apps/app-mail/services/message-move/message-move-window.html',
      controller: [
        '$scope',
        '$mdConstant',
        '$mdDialog',
        '$timeout',
        async ($scope: MessageMove, $mdConstant: any, $mdDialog: material.IDialogService, $timeout: ITimeoutService) => {
          $scope.folders = prepareFolderList(appMailState.values.list);
          appMailState
            .change$
            .list
            .subscribe(data => {
              $timeout(() => {
                $scope.folders = prepareFolderList(data);
              });
            });

          $scope.close = () => {
            $mdDialog.hide();
          };

          $scope.selectFolder = async (id: string): Promise<void> => {
            console.log('Move to folder with id: ', id);
            if (msgKeys.length === 1) {
              const msgMoveStatus = await this.moveMessageFolder(msgKeys[0], id);
              if (msgMoveStatus) {
                this.afterSuccessMoveMessageFolder(id, msgKeys);
              }
            }
            if (msgKeys.length > 1) {
              const msgsMoveStatus = await this.moveMessagesToFolder(msgKeys, id);
              if (msgsMoveStatus.every(status => status === true)) {
                this.afterSuccessMoveMessageFolder(id, msgKeys);
              }
            }
            $scope.close();
          };
        }],
      });
  }

  public async moveMessageFolder(msgKey: string, targetFolderId: string): Promise<boolean> {
    if (Object.keys(appMailState.values.list).indexOf(targetFolderId) === -1) {
      return false;
    }
    let isMovedSuccess = true;
    const sourceFolderId = appMailState.values.messageList[msgKey].folderId;
    const sourcePath = `${sourceFolderId}/${msgKey}`;
    const targetPath = `${targetFolderId}/${msgKey}`;
    if (sourceFolderId === SYS_MAIL_FOLDERS.inbox) {
      const msgId = appMailState.values.messageList[msgKey].msgId;
      const incomingMsg = await w3n.mail.inbox.getMsg(msgId);
      const msg = await transformInToMessage(incomingMsg);
      if (incomingMsg.attachments) {
        await messageSyncedFS.saveAttachmentsFolderToFS(incomingMsg.attachments, `${targetPath}/attachments`);
      }
      await messageSyncedFS.saveJsonDataToFS(targetFolderId, msgKey, 'data.json', msg);
      await w3n.mail.inbox.removeMsg(msgId)
        .catch(async (exc: web3n.asmail.ASMailSendException) => {
          logError(exc);
          isMovedSuccess = false;
        });
    } else {
      await messageSyncedFS.renameFolder(sourcePath, targetPath)
        .catch(async (exc: web3n.files.FileException) => {
          logError(exc);
          isMovedSuccess = false;
        });
    }
    return isMovedSuccess;
  }

  public async moveMessagesToFolder(msgsKeys: string[], targetFolderId: string): Promise<boolean[]> {
    const pr: Promise<boolean>[] = [];
    msgsKeys.forEach(msgsKey => {
      pr.push(this.moveMessageFolder(msgsKey, targetFolderId));
    });
    return await Promise.all(pr);
  }

  public afterSuccessMoveMessageFolder(targetFolderId: string, msgKeys: string[]): void {
    if (appMailState.values.selectedMessageKeys.length > 0) {
      appMailState.values.selectedMessageKeys = [];
    }
    const tmpMessageList = copy(appMailState.values.messageList);
    msgKeys.forEach(messageKey => tmpMessageList[messageKey].folderId = targetFolderId);
    appMailState.values.messageList = copy(tmpMessageList);
  }

  public async preliminaryMessageDeletion(msgKey: string): Promise<boolean> {
    return await this.moveMessageFolder(msgKey, SYS_MAIL_FOLDERS.trash);
  }

  public async preliminaryMessagesDeletion(msgKeys: string[]): Promise<boolean> {
    const pr: Promise<boolean>[] = [];
    msgKeys.forEach(msgKey => pr.push(this.preliminaryMessageDeletion(msgKey)));
    await Promise.all(pr)
      .catch(err => {
        console.error(err);
        return false;
      });
    this.afterSuccessMoveMessageFolder(SYS_MAIL_FOLDERS.trash, msgKeys);
    return true;
  }

  public async completeMessageDeletion(msgKey: string): Promise<boolean> {
    const folderId = appMailState.values.messageList[msgKey].folderId;
    await messageSyncedFS.deleteFolderFrom3NStorage(folderId, msgKey)
      .catch(err => {
        console.error(err);
        return false;
      });
    return true;
  }

  public async completeMessagesDeletion(msgKeys: string[]): Promise<boolean> {
    const pr: Promise<boolean>[] = [];
    const folderId = appMailState.values.messageList[msgKeys[0]].folderId;
    msgKeys.forEach(msgKey => pr.push(this.completeMessageDeletion(msgKey)));
    await Promise.all(pr)
      .catch(err => {
        console.error(err);
        return false;
      });
    this.afterCompleteMessagesDelete(folderId, msgKeys);
    return true;
  }

  private afterCompleteMessagesDelete(folderId: string, msgKeys: string[]): void  {
    appMailState.values.selectedMessageKeys = [];
    const mailFolders = copy(appMailState.values.list);
    const mailFolder = copy(appMailState.values.list[folderId]);
    const msgListUpdated = copy(appMailState.values.messageList);
    msgKeys.forEach(msgKey => {
      const deletedMsgIndex = mailFolder.messageKeys.indexOf(msgKey);
      if (deletedMsgIndex > -1) {
        mailFolder.messageKeys.splice(deletedMsgIndex, 1);
      }
      delete msgListUpdated[msgKey];
    });
    mailFolders[mailFolder.id] = mailFolder;
    appMailState.values.list = copy(mailFolders);
    appMailState.values.messageList = copy(msgListUpdated);
  }

}
