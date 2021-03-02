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
import {copy, element, IAngularEvent, IAngularStatic, IScope, ITimeoutService} from 'angular';
import { appMailState } from '../../common/app-mail-store';
import * as ConfirmDialogService from '../../../common/services/confirm-dialog.service';
import * as MsgMoveSrvModule from '../message-move/message-move.service';
import { createNewMailFolder, generateNewFolderIdAndOrdernum } from '../../common/app-mail-folders.helper';
import { SYS_MAIL_FOLDERS } from '../../../../common/const';
import { logError } from '../../../../common/services/libs/logging';

export let ModuleName = '3nClient.services.mail-folder-manager';
export let MailFolderManagerServiceName = 'mailFolderManagerService';

export function addService(ng: IAngularStatic): void {
  const module = ng.module(ModuleName, []);
  module.service(MailFolderManagerServiceName, MailFolderManagerService);
}

interface FolderManager extends IScope {
  folderList: {[id: string]: client3N.MailFolder};
  editFolder: client3N.MailFolder;
  isNameInvalid: boolean;
  isBlocked: boolean;
  hide: () => void;
  editCancel: () => void;
  editDone: () => void;
  startEditFolder: (id: string) => void;
  startDeleteFolder: (id: string) => void;
  onKey: (ev: KeyboardEvent) => void;
}

export class MailFolderManagerService {

  static $inject = [
    '$mdDialog',
    ConfirmDialogService.ConfirmDialogServiceName,
    MsgMoveSrvModule.MessageMoveServiceName,
  ];

  constructor(
    private $mdDialog: angular.material.IDialogService,
    private confirmSrv: ConfirmDialogService.ConfirmDialogService,
    private msgMoveSrv: MsgMoveSrvModule.MessageMoveService,
  ) {}

  public openFolderManager(): void {
    this.$mdDialog.show({
      parent: element(document.body),
      clickOutsideToClose: false,
      escapeToClose: false,
      multiple: true,
      templateUrl: './apps/app-mail/services/mail-folder-manager/mail-folder-manager.html',
      onComplete: () => {
        document.getElementById('inputName').focus();
      },
      controller: [
        '$scope',
        '$timeout',
        '$mdDialog',
        ($scope: FolderManager, $timeout: ITimeoutService, $mdDialog: angular.material.IDialogService) => {
        $scope.isNameInvalid = false;
        $scope.isBlocked = false;
        $scope.folderList = appMailState.values.list;
        $scope.editFolder = createNewMailFolder();

        $scope.hide = () => {
          $mdDialog.hide();
        };

        $scope.editCancel = () => {
          $scope.editFolder = createNewMailFolder();
          $scope.isNameInvalid = false;
        };

        $scope.editDone = async () => {
          if (this.checkFolderName($scope.editFolder.name)) {
            $scope.isNameInvalid = true;
            document.getElementById('inputName').focus();
          } else {
            $scope.isNameInvalid = false;
            if ($scope.editFolder.id === 'new') {
              const { newId, newOrderNum } = generateNewFolderIdAndOrdernum(appMailState.values.list);
              $scope.editFolder.id = newId;
              $scope.editFolder.orderNum = newOrderNum;
            }
            const tmpList = copy(appMailState.values.list);
            tmpList[$scope.editFolder.id] = copy($scope.editFolder);
            appMailState.values.list = copy(tmpList);
            $timeout(() => {
              $scope.editFolder = createNewMailFolder();
              document.getElementById('inputName').focus();
              $scope.folderList = copy(appMailState.values.list);
            });
          }
        };

        $scope.startEditFolder = (id: string) => {
          $scope.editFolder = copy($scope.folderList[id]);
          document.getElementById('inputName').focus();
        };

        $scope.startDeleteFolder = (id: string) => {
          this.confirmSrv.showConfirm<string>(
            'Are you sure?',
            '',
            'mail_folder_delete',
            id,
          );
        };

        $scope.onKey = (event: KeyboardEvent) => {
          if ($scope.editFolder.name.length > 0) {
            switch (event.key) {
              case 'Escape':
                $scope.editCancel();
                break;
              case 'Enter':
                $scope.editDone();
                break;
            }
          }
        };

        $scope.$on(
          'confirmEvent',
          async (event: IAngularEvent, arg: client3N.ConfirmEventArguments<string>) => {
            switch (arg.eventType) {
              case 'mail_folder_delete':
                if (
                  !!arg.value &&
                  !appMailState.values.list[arg.data].isSystem
                ) {
                  $scope.isBlocked = true;
                  if (appMailState.values.list[arg.data].messageKeys.length > 0) {
                    await this.clearDeletedMailFolder(appMailState.values.list[arg.data].messageKeys);
                  }
                  if (arg.data === appMailState.values.selectFolderId) {
                    appMailState.values.selectFolderId = SYS_MAIL_FOLDERS.inbox;
                  }
                  const tmpFolderList = copy(appMailState.values.list);
                  delete tmpFolderList[arg.data];
                  appMailState.values.list = copy(tmpFolderList);
                  $timeout(() => {
                    $scope.editFolder = createNewMailFolder();
                    $scope.isBlocked = false;
                    document.getElementById('inputName').focus();
                    $scope.folderList = copy(appMailState.values.list);
                  });
                }
                break;
            }
          },
        );

      }],
    });
  }

  private checkFolderName(folderName: string): boolean {
    return Object.keys(appMailState.values.list).some(
      id => appMailState.values.list[id].name.toLocaleLowerCase() === folderName.toLocaleLowerCase(),
    );
  }

  private async clearDeletedMailFolder(msgKeys: string[]): Promise<boolean> {
    const pr: Promise<boolean>[] = [];
    msgKeys.forEach(msgKey => {
      pr.push(this.msgMoveSrv.moveMessageFolder(msgKey, SYS_MAIL_FOLDERS.trash));
    });
    const moveMessagesStatus = await Promise.all(pr)
      .catch(err => {
        logError(err);
        return false;
      });
    let isSuccess = false;
    if (Array.isArray(moveMessagesStatus)) {
      isSuccess = moveMessagesStatus.every(status => status === true);
    } else {
      isSuccess = moveMessagesStatus;
    }
    if (isSuccess) {
      this.msgMoveSrv.afterSuccessMoveMessageFolder(SYS_MAIL_FOLDERS.trash, msgKeys);
    }

    return true;
  }

}
