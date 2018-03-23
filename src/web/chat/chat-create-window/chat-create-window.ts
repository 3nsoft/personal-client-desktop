/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>.
*/

import * as LIB from '../../common/services/lib-internal'
import { getInitials } from '../../common/services/transform-contact'
import * as BusMod from '../../common/services/cache-srv'
import * as ChatNetSrvMod from '../common/chat-net-srv'
import { Chats } from '../common/chats'

export let ModuleName = "3nClient.services.chat-create-window"
export let ChatCreateWindowName = "chatCreateWindow"

export function addService(angular: angular.IAngularStatic): void {
  const module = angular.module(ModuleName, [])
  module.service(ChatCreateWindowName, Srv)
}

interface CreateChatScope extends angular.IScope {
  filterName: string;
  chatName: string;
  selectedPersons: string[];
  contacts: {
    list: {[id: string]: client3N.PersonMapping};
    letters: string[];
  };
  
  closeModal: Function;
  searchName: Function;
  selectContact: Function;
  isPersonInList: Function;
  createNewChat: Function;
}

export class Srv {
  private chats: Chats

  static $inject = ['$state', '$timeout', '$mdDialog', BusMod.CacheSrvName, ChatNetSrvMod.ChatNetSrvName]
  constructor(
    private $state: angular.ui.IStateService,
    private $timeout: angular.ITimeoutService,
    private $mdDialog: angular.material.IDialogOptions,
    private $bus: BusMod.Cache,
    private _chatNetSrv: ChatNetSrvMod.Srv
  ) {
    this.chats = new Chats()
  }


  openChatCreateWindow(): angular.IPromise<void> {
    return (this.$mdDialog as any).show({
      parent: angular.element(document.body),
			clickOutsideToClose: false,
			escapeToClose: true,
			templateUrl: 'templates/chat/chat-create-window/chat-create-window.html',
			fullscreen: true,
      controller: [
        '$scope', '$mdDialog', BusMod.CacheSrvName,
        ($scope: CreateChatScope, $mdDialog: angular.material.IDialogService, $bus: BusMod.Cache) => {

          $scope.filterName = ''
          $scope.chatName = ''
          $scope.selectedPersons = []
          $scope.contacts = {
            list: $bus.contacts.list,
            letters: LIB.getAllLetters($bus.contacts.list)
          }

          $scope.closeModal = () => {
            $mdDialog.cancel('cancel')
          }

          /**
  				 * фильтр по имени
  				 */
  				$scope.searchName = (search: string): Function => {
  					return (person: client3N.PersonMapping) => {
              return person.nickName.toLocaleLowerCase().includes(search.toLocaleLowerCase())
            }
          }

          /**
           * добавление/удаление контакта в список для создания чата
           */
          $scope.selectContact = (personId: string) => {
            if (personId === '0') return

            const indexSelectedPerson = $scope.selectedPersons.indexOf(personId)
            if (indexSelectedPerson === -1) {
              $scope.selectedPersons.push(personId)
            } else {
              $scope.selectedPersons.splice(indexSelectedPerson, 1)
            }

            if ($scope.selectedPersons.length === 1) {
              $scope.chatName = $bus.contacts.list[$scope.selectedPersons[0]].nickName
            }
          }

          /**
           * контакт в списке?
           */
          $scope.isPersonInList = (personId: string): boolean => {
            return $scope.selectedPersons.includes(personId)
          }

          /**
           * создание нового чата
           */
          $scope.createNewChat = async () => {
            const now = Date.now()
            const newChatId = this.chats.generateChatId(now)
            const newChatName = $scope.chatName
            const mailAddresses = $scope.selectedPersons.map(pId => $bus.contacts.list[pId].mails[0])
            mailAddresses.push(this.$bus.username)
            $mdDialog.hide()
            this._chatNetSrv.createNewChat(newChatId, newChatName, true, now, mailAddresses)
          }

        }
      ]
    })
  }

}
