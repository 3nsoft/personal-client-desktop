/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. 
*/

import * as CONST from '../../common/services/const'
import * as LIB from '../../common/services/lib-internal'
import * as BusMod from '../../common/services/cache-srv'

export const ModuleName = '3nClient.components.chat-list'

class Controller {

  static $inject = ['$scope', '$state', '$timeout', BusMod.CacheSrvName]
  constructor(
    private $scope: angular.IScope,
    private $state: angular.ui.IStateService,
    private $timeout: angular.ITimeoutService,
    private $bus: BusMod.Cache
  ) {

  }

  invertColor(color: string): string {
    return LIB.invertColor(color)
  }

  getTimeStr(timestamp: number): string {
    return LIB.convertTimestamp(timestamp)
  }

  selectChat(chatId: string): void {
    console.log(`Select chat ${chatId}`)
    this.$bus.chats.selected = chatId
    this.$state.go('root.chat.room', {chatId: chatId})
  }


}

const componentConfig: angular.IComponentOptions = {
  bindings: {},
  templateUrl: './templates/chat/chat-list/chat-list.html',
  controller: Controller
}

export function addComponent(angular: angular.IAngularStatic): void {
  const module = angular.module(ModuleName, [])
  module.component('chatList', componentConfig)
}
