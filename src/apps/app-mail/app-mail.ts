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

import { IAngularStatic, IComponentOptions } from 'angular';
import { StateService } from '@uirouter/angularjs';
import { appMailState } from './common/app-mail-store';
import * as MessageManager from './services/message-manager/message-manager.service';

export let ModuleName = '3nClient.app.mail';

export function addComponent(ng: IAngularStatic): void {
  const mod = ng.module(ModuleName, []);
  mod.component('appMail', componentConfig);
}

class AppMailComponent {
  static $inject = ['$state', MessageManager.MessageManagerServiceName];
  constructor(
    private $state: StateService,
    private messageManager: MessageManager.MessageManagerService,
  ) {}

  $onInit(): void {
    this.$state.go('root.app-mail.content', {folderId: appMailState.values.selectFolderId, msgId: null});
  }

  public newMail(): void {
    this.messageManager.openMessageManager('new');
  }
}

const componentConfig: IComponentOptions = {
  bindings: {},
  templateUrl: './apps/app-mail/app-mail.html',
  controller: AppMailComponent,
};
