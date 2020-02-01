/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it
 under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License,
 or (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 or FITNESS FOR A PARTICULAR PURPOSE.
 See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program.
 If not, see <http://www.gnu.org/licenses/>.
*/

import { IAngularStatic, IComponentOptions } from 'angular';
import { appChatState, chat } from '../common/app-chat-store';
import { convertTimestamp, invertColor } from '../../common/helpers';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { logError } from '../../../common/lib/logging';

export const ModuleName = '3nClient.components.chat-list';
export function addComponent(angular: IAngularStatic): void {
  const module = angular.module(ModuleName, []);
  module.component('appChatList', componentConfig);
}

class Controller {
  public chatList: client3N.ChatRoom[] = [];
  // public chatIdSelected: string;
  private ngUnsubscribe: Subject<void> = new Subject<void>();

  static $inject = [];

  $onInit(): void {
    this.chatList = appChatState.values.list;
    // this.chatIdSelected = appChatState.values.selected;

    appChatState
      .change$
      .list
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(list => {
        this.chatList = list;
      });

    // appChatState
    //   .change$
    //   .selected
    //   .pipe(takeUntil(this.ngUnsubscribe))
    //   .subscribe(chatId => {
    //     this.chatIdSelected = chatId;
    //   });
  }

  $onDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public invertColor(color: string): string {
    return invertColor(color);
  }

  public getTimeStr(timestamp: number): string {
    return convertTimestamp(timestamp);
  }

  public async selectChat(chatId: string): Promise<void> {
    console.log(`Select chat ${chatId}`);
    appChatState.values.selected = chatId;
    appChatState.values.logContent = await chat.readLogChat(chatId)
      .catch(err => {
        logError(err);
        return [];
      });
  }

}

const componentConfig: IComponentOptions = {
  bindings: {},
  templateUrl: './apps/app-chat/app-chat-list/app-chat-list.html',
  controller: Controller,
};
