/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. 
*/

import { Subject, Observable } from 'rxjs' 
import * as CONST from '../../common/services/const'
import * as LIB from '../../common/services/lib-internal'
import * as BusMod from '../../common/services/cache-srv'
import * as ChatCreateWindow from '../chat-create-window/chat-create-window'

export const ModuleName = '3nClient.components.chat-app'

class Controller {
  private selectedChat: client3N.ChatRoom

  static $inject = ['$scope', '$state', '$timeout', BusMod.CacheSrvName, ChatCreateWindow.ChatCreateWindowName]
  constructor(
    private $scope: angular.IScope,
    private $state: angular.ui.IStateService,
    private $timeout: angular.ITimeoutService,
    private $bus: BusMod.Cache,
    private _newChat: ChatCreateWindow.Srv
  ) {

  }

  newChat(): void {
    console.log(`Create new chat ...`)
    this._newChat.openChatCreateWindow()
  }

}

const componentConfig: angular.IComponentOptions = {
  bindings: {},
  templateUrl: './templates/chat/chat-app/chat-app.html',
  controller: Controller
}

export function addComponent(angular: angular.IAngularStatic): void {
  const module = angular.module(ModuleName, [])
  module.component('chatApp', componentConfig)
}
