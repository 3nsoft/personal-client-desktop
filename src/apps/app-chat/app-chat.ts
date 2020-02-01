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

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { IAngularStatic, IComponentOptions } from 'angular';
import { appChatState } from './common/app-chat-store';
import * as AppChatCreateWindowSrvModule from './app-chat-create-window/app-chat-create-window';

export let ModuleName = '3nClient.app.chat';

export function addComponent(ng: IAngularStatic): void {
  const mod = ng.module(ModuleName, []);
  mod.component('appChat', componentConfig);
}

class AppChatComponent {
  public chatIdSelected: string = null;

  private ngUnsubscribe: Subject<void> = new Subject<void>();

  static $inject = [AppChatCreateWindowSrvModule.AppChatCreateWindowName];
  constructor(
    private chatCreateSrv: AppChatCreateWindowSrvModule.Srv,
  ) {}

  $onInit(): void {
    this.chatIdSelected = appChatState.values.selected;
    appChatState
      .change$
      .selected
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(chatId => this.chatIdSelected = chatId);

  }

  $onDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public openNewChat(): void {
    console.log(`Create new chat ...`);
    this.chatCreateSrv.openChatCreateWindow();
  }
}

const componentConfig: IComponentOptions = {
  bindings: {},
  templateUrl: './apps/app-chat/app-chat.html',
  controller: AppChatComponent,
};
