/*
 Copyright (C) 2017 3NSoft Inc.

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
import { appState } from '../../../common/services/app-store';
import { appChatState } from '../../common/app-chat-store';
import { saveFileToExternalFS } from '../../common/attach.service';
import {
  convertDate,
  convertTimestamp,
  fromByteTo,
  getAlias,
  getElementColor,
  getInitials,
  invertColor,
} from '../../../common/helpers';

export const ModuleName = '3nClient.components.chat-content-msg';
export function addComponent(angular: IAngularStatic): void {
  const module = angular.module(ModuleName, []);
  module.component('appChatContentMsg', componentConfig);
}

class Controller {
  public isGroup: boolean;
  public msg: client3N.ChatDisplayedMessage;
  public mId: string;
  public creator: {
    name: string;
    initials: string;
    bgColor: string;
    color: string;
  };
  public isSameCreator: boolean;
  public prevTimestamp: number;
  public msgIn: boolean;
  public msgDate: string;
  public attachWrapOpen: boolean = false;

  static $inject = ['$timeout', 'Notification'];
  constructor(
    private $timeout: ITimeoutService,
    private Notification: angular.uiNotification.INotificationService,
  ) {
    this.$timeout(() => {
      this.msgIn = !!this.msg.creator && this.msg.creator !== appState.values.user;
      this.mId = this.msgIn
        ? `in${this.msg.timestamp}`
        : `out${this.msg.timestamp}`;
      this.creator = this.getCreatorInfo();
      console.log(this.msg);
    });
  }

  public getMsgCreatorName(): string {
    return getAlias(this.msg.creator);
  }

  public sameDates(): boolean {
    return convertDate(this.msg.timestamp, true) === convertDate(this.prevTimestamp, true);
  }

  public sameDateTime(): boolean {
    return convertDate(this.msg.timestamp) === convertDate(this.prevTimestamp);
  }

  public getMsgDate(): string {
    return convertTimestamp(this.msg.timestamp, true);
  }

  public getTimestamp(): string {
    return convertTimestamp(this.msg.timestamp);
  }

  public getCreatorInfo(): {name: string, initials: string, bgColor: string, color: string} {
    const name = getAlias(this.msg.creator);
    const initials = getInitials(this.msg.creator);
    const bgColor = getElementColor(initials);
    const color = invertColor(bgColor);
    return {name, initials, bgColor, color};
  }

  public getFileSize(size: number): string {
    return fromByteTo(size);
  }

  public async download(index: number): Promise<void> {
    const result = await saveFileToExternalFS(
      appChatState.values.selected,
      this.msg.msgId,
      !this.msgIn,
      this.msg.attached[index].name,
    );
    if (result) {
      this.Notification.success({message: 'The file is saved'});
    } else {
      this.Notification.error({message: 'Error writing file!'});
    }
  }

}

const componentConfig: IComponentOptions = {
  bindings: {
    isGroup: '<',
    msg: '<',
    isSameCreator: '<',
    prevTimestamp: '<',
  },
  templateUrl: './apps/app-chat/app-chat-content/app-chat-content-msg/app-chat-content-msg.html',
  controller: Controller,
};
