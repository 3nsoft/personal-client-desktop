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

import {
  copy,
  element,
  equals,
  IAngularStatic,
  IFormController,
  IScope,
  isObject,
  ITimeoutService,
} from 'angular';
import { appState } from '../../../common/services/app-store';
import { appContactsState } from '../../../app-contact/common/app-contact-store';
import { appMailState, messageSyncedFS } from '../../common/app-mail-store';
import * as ConfirmDialogService from '../../../common/services/confirm-dialog.service';
import * as MsgSendService from '../message-send.service';
import * as AttachSrvModule from '../attach.service';
import * as MessageManagerHelpersServiceModule from './message-manager.helpers.service';
import { checkAddress, getAlias, getElementColor } from '../../../common/helpers';
import { Message } from './message.model';
import { SYS_MAIL_FOLDERS } from '../../../../common/const';
import {
  contactsSearch,
  getTitleText,
  prepareForwardBodyHTML,
  prepareMsgForMessageManager,
  prepareReplyBodyHTML,
  saveDataAfterRemoval,
} from './message-manager.helper';

export const ModuleName = '3nClient.services.message-manager';
export const MessageManagerServiceName = 'messageManagerService';

export function addService(ng: IAngularStatic): void {
  const module = ng.module(ModuleName, []);
  module.service(MessageManagerServiceName, MessageManagerService);
}

interface MessageManager extends IScope {
  message: Message;
  msgManager: IFormController;
  attachmentsMode: 'normal'|'ban_of_addition';
  startAttached: client3N.AttachFileInfo[];
  isShowQuillToolbar: boolean;
  keys: any[];
  utility: {
    search: string;
    selected: any;
  };
  isFullMailList: boolean;
  sendingFlag: boolean;

  hide: () => void;
  saveAndHide: () => void;
  getTitle: () => string;
  showEditorToolbar: () => void;
  onAdd: () => void;
  transformAddress: (chip: client3N.Person|string) => string;
  removeAddress: (chip: string, index: number) => void;
  queryContactsSearch: (search: string) => client3N.Person[];
  isAddressSendError: (chip: string) => boolean;
  showFullMailList: () => void;
  send: () => void;
  completeRemoval: (attached: client3N.AttachFileInfo[]) => Promise<void>;
}

export class MessageManagerService {
  static $inject = [
    '$timeout',
    '$mdDialog',
    ConfirmDialogService.ConfirmDialogServiceName,
    MsgSendService.MessageSendServiceName,
    AttachSrvModule.AttachServiceName,
    'Notification',
    MessageManagerHelpersServiceModule.MessageManagerHelpersServiceName,
  ];

  constructor(
    private $timeout: ITimeoutService,
    private $mdDialog: angular.material.IDialogService,
    private confirmSrv: ConfirmDialogService.ConfirmDialogService,
    private msgService: MsgSendService.MessageSendService,
    private attachSrv: AttachSrvModule.AttachService,
    private Notification: angular.uiNotification.INotificationService,
    private msgHelpersSrv: MessageManagerHelpersServiceModule.MessageManagerHelpersService,
  ) {}

  public openMessageManager(
    id: string,
    action?: string,
    preparedData?: client3N.MessageEdited): void {
    this.$mdDialog.show({
      parent: element(document.body),
      clickOutsideToClose: false,
      escapeToClose: false,
      multiple: true,
      templateUrl: './apps/app-mail/services/message-manager/message-manager.html',
      controller: [
        '$scope',
        '$mdConstant',
        '$mdDialog',
        async ($scope: MessageManager, $mdConstant: any, $mdDialog: angular.material.IDialogService) => {
          $scope.message = await prepareMsgForMessageManager(id, preparedData);
          if ($scope.message.alias && $scope.message.alias.length > 0) {
            this.setChipsStyle($scope.message.alias);
          }

          $scope.attachmentsMode = 'normal';
          $scope.startAttached = copy($scope.message.attached);
          $scope.isShowQuillToolbar = false;
          $scope.keys = [
            $mdConstant.KEY_CODE.ENTER,
            $mdConstant.KEY_CODE.TAB,
            $mdConstant.KEY_CODE.UP_ARROW,
            $mdConstant.KEY_CODE.DOWN_ARROW,
          ];
          $scope.utility = {
            search: null,
            selected: null,
          };
          $scope.isFullMailList = true;
          $scope.sendingFlag = false;

          $scope.getTitle = (): string => {
            return getTitleText(id, action);
          };

          $scope.showEditorToolbar = () => {
            $scope.isShowQuillToolbar = !$scope.isShowQuillToolbar;
          };

          /**
           * функция трансформации chip при автопоиске контакта
           * - если chip = Object (т.е. найден похожий контакт в списке), то
           * в массив, "отвечающий" за отображение добавляется nickName, а в
           * поле адреса добавляется адрес (mail)
           * - если chip = string и он проходит валидацию как mail (т.е. не найден похожий
           * контакт, но вводимый текст является 3nmail), то и в массив, "отвечающий"
           * за отображение, и в поле адреса добавляется вводимый текст
           * @param chip {client3N.Person | string}
           */
          $scope.transformAddress = (chip: client3N.Person | string): string => {
            if (isObject(chip)) {
              $scope.message.mailAddresses.push((chip as client3N.Person).mails[0]);
              return (chip as client3N.Person).name || (chip as client3N.Person).mails[0];
            }
            if (checkAddress((chip as string))) {
              $scope.message.mailAddresses.push(chip);
              return (chip as string);
            }
            return null;
          };

          /**
           * функция удаления необходимого элемента из поля адреса
           * (массива, содержащего адреса),
           * при удалении элемента из массив, отвечающего за отображение
           * @param chip {string} - содержимое удаляемого элемента массива,
           * отвечающего за отображение
           * @param index {number} - номер (индекс) удаляемого элемента массива,
           * отвечающего за отображение
           */
          $scope.removeAddress = (chip: string, index: number): void => {
            $scope.message.mailAddresses.splice(index, 1);
            this.setChipsStyle($scope.message.alias);
          };

          /**
           * поиск контакта по полям name и mails[0]
           * @param search {string}
           * @return {client3N.Person[]}
           */
          $scope.queryContactsSearch = (search: string): client3N.Person[] => {
            return contactsSearch(search);
          };

          $scope.isAddressSendError = (chip: string): boolean => {
            return $scope.message.errorsWhenSend.some((item: client3N.ErrorWhenSend) => item.mailAddress === chip);
          };

          $scope.onAdd = (): void => {
            this.setChipsStyle($scope.message.alias);
          };

          $scope.showFullMailList = (): void => {
            this.$timeout(() => {
              $scope.isFullMailList = !$scope.isFullMailList;
            });
          };

          $scope.send = (): void => {
            console.log($scope.msgManager);
            $scope.sendingFlag = true;
            $scope.saveAndHide();
          };

          $scope.hide = async () => {
            if ($scope.message.msgId === 'new' && $scope.message.attached && $scope.message.attached.length > 0) {
              await this.attachSrv.deleteFolder();
            }
            if (!equals($scope.message.attached, $scope.startAttached)) {
              const folderId = $scope.message.msgId === 'new' ?
                SYS_MAIL_FOLDERS.draft :
                appMailState.values.messageList[$scope.message.msgKey].folderId;
              await messageSyncedFS.attachmentStateAlignment(
                folderId,
                $scope.message.msgKey,
                $scope.startAttached,
              );
            }
            $mdDialog.hide().then(() => {
              appMailState.values.selectedMessageKeys = [];
            });
          };

          $scope.saveAndHide = async (): Promise<void> => {
            if ($scope.message.mailAddresses.length > 0) {
              $scope.$broadcast('attachment:complete');
            }
          };

          $scope.completeRemoval = async (attached: client3N.AttachFileInfo[]): Promise<void> => {
            console.log('Files were removed!');
            $scope.message.attached = attached.slice();
            await saveDataAfterRemoval($scope.message);
            console.log('Save and hide.');

            if ($scope.sendingFlag) {
              this.msgService.runSendMessage($scope.message);
            }

            appMailState.values.selectedMessageKeys = [];
            $mdDialog.hide();
          };

          $scope.$watch(
            'message.attached',
            (nVal: client3N.AttachFileInfo[], oVal: client3N.AttachFileInfo[]) => {
            if (!equals(oVal, nVal)) {
              $scope.msgManager.$setDirty();
            }
          });

        }],
    });
  }

  public openMessageManagerReply(
    fromMsg: client3N.MessageEdited,
    mode: 'reply'|'replyAll',
  ): void {
    const replyMsgData: client3N.MessageEdited = {
      msgId: undefined,
      msgKey: undefined,
      sender: undefined,
      senderAlias: undefined,
      mailAddresses: mode === 'reply' ?
        [fromMsg.sender] :
        [fromMsg.sender, ...fromMsg.mailAddresses],
      alias: undefined,
      subject: `Re: ${fromMsg.subject}`,
      timestamp: undefined,
      bodyHTML: prepareReplyBodyHTML(fromMsg.sender, fromMsg.timestamp, fromMsg.bodyHTML),
      attached: undefined,
      errorsWhenSend: undefined,
    };
    if (mode === 'replyAll') {
      const myAddressIndex = replyMsgData.mailAddresses.findIndex(addr => addr === appState.values.user);
      replyMsgData.mailAddresses.splice(myAddressIndex, 1);
    }
    console.log(replyMsgData);
    this.openMessageManager(
      'new',
      mode,
      replyMsgData,
    );
  }

  async openMessageManagerForward(fromMsg: client3N.MessageEdited, folderId: string): Promise<void> {
    console.log(fromMsg, folderId);
    const forwardMsgData: client3N.MessageEdited = {
      msgId: undefined,
      msgKey: undefined,
      sender: undefined,
      senderAlias: undefined,
      mailAddresses: undefined,
      alias: undefined,
      subject: fromMsg.subject,
      timestamp: undefined,
      bodyHTML: prepareForwardBodyHTML(fromMsg.sender, fromMsg.timestamp, fromMsg.bodyHTML),
      attached: fromMsg.attached,
      errorsWhenSend: undefined,
    };
    if (fromMsg.attached && fromMsg.attached.length > 0) {
      await this.attachSrv.copyAttachments(
        fromMsg.msgKey,
        'out=new',
        SYS_MAIL_FOLDERS.draft,
      );
    }
    this.openMessageManager(
      'new',
      'forward',
      forwardMsgData,
    );
  }

  private setChipsStyle(alias: string[]): void {
    if (alias && alias.length > 0) {
      this.$timeout(() => {
        const chipElements = document.querySelectorAll('md-chip');
        Array.from(chipElements).forEach((chip: HTMLElement, index: number) => {
          chip.style.backgroundColor = getElementColor(alias[index]);
          chip.querySelector('svg').style.fill = '#ffffff';
        });
      });
    }
  }

}
