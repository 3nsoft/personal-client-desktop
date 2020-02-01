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

import { copy, element, IAngularStatic, IPromise, IScope } from 'angular';
import { appState } from '../../common/services/app-store';
import { appContactsState } from '../../app-contact/common/app-contact-store';
import * as ChatNetSrvMod from '../common/chat-net.service';
import { Chat } from '../common/chat';
import { getAllLetters, getElementColor, invertColor } from '../../common/helpers';

export let ModuleName = '3nClient.services.app-chat-create-window';
export let AppChatCreateWindowName = 'appChatCreateWindow';

export function addService(ng: IAngularStatic): void {
  const module = ng.module(ModuleName, []);
  module.service(AppChatCreateWindowName, Srv);
}

interface CreateChatScope extends IScope {
  filterName: string;
  chatName: string;
  selectedPersons: string[];
  contacts: {
    list: {[id: string]: client3N.Person};
    letters: string[];
  };

  closeModal: Function;
  searchName: Function;
  getInitials: Function;
  getAvatarStyle: Function;
  selectContact: Function;
  isPersonInList: Function;
  createNewChat: Function;
}

export class Srv {
  private chat: Chat;

  static $inject = ['$mdDialog', ChatNetSrvMod.ChatNetSrvName];
  constructor(
    private $mdDialog: angular.material.IDialogOptions,
    private chatNetSrv: ChatNetSrvMod.Srv,
  ) {
    this.chat = new Chat();
  }

  public openChatCreateWindow(): IPromise<void> {
    return (this.$mdDialog as any).show({
      parent: element(document.body),
      clickOutsideToClose: false,
      escapeToClose: true,
      templateUrl: './apps/app-chat/app-chat-create-window/app-chat-create-window.html',
      fullscreen: true,
      controller: [
        '$scope', '$mdDialog',
        ($scope: CreateChatScope, $mdDialog: angular.material.IDialogService) => {

          $scope.filterName = '';
          $scope.chatName = '';
          $scope.selectedPersons = [];
          $scope.contacts = {
            list: this.prepareContactList(appContactsState.values.list),
            letters: getAllLetters(this.prepareContactList(appContactsState.values.list)),
          };

          $scope.closeModal = () => {
            $mdDialog.cancel('cancel');
          };

          /**
           * фильтр по имени
           */
          $scope.searchName = (search: string): Function => {
            return (person: client3N.Person) => {
              return person.name.toLocaleLowerCase().includes(search.toLocaleLowerCase());
            };
          };

          $scope.getInitials = (person: client3N.Person): string => {
            const str = person.name ||
              (
                person.mails && person.mails.length ? person.mails[0] : '?'
              );
            if (str) {
              return str.length > 1 ?
                `${str[0].toLocaleUpperCase()}${str[1].toLocaleLowerCase()}` :
                str[0].toLocaleUpperCase();
            }
            return '';
          };

          $scope.getAvatarStyle = (person: client3N.Person): {[name: string]: string} => {
            if (person.avatar) {
              return {'background-image': `url(${person.avatar})`};
            }
            const str = person.name ||
              (
                person.mails && person.mails.length ? person.mails[0] : '?'
              );
            const bgColor = getElementColor(str);
            const color = invertColor(bgColor);
            return {
              'background-color': bgColor,
              'color': color,
            };
          };

          /**
           * добавление/удаление контакта в список для создания чата
           */
          $scope.selectContact = (personId: string) => {
            if (personId === '0') { return; }
            const indexSelectedPerson = $scope.selectedPersons.indexOf(personId);
            if (indexSelectedPerson === -1) {
              $scope.selectedPersons.push(personId);
            } else {
              $scope.selectedPersons.splice(indexSelectedPerson, 1);
            }

            if ($scope.selectedPersons.length === 1) {
              $scope.chatName = appContactsState.values.list[$scope.selectedPersons[0]].name;
            }
          };

          /**
           * контакт в списке?
           */
          $scope.isPersonInList = (personId: string): boolean => $scope.selectedPersons.includes(personId);

          /**
           * создание нового чата
           */
          $scope.createNewChat = async () => {
            const now = Date.now();
            const newChatId = this.chat.generateChatId(now);
            const newChatName = $scope.chatName;
            const mailAddresses = $scope.selectedPersons.map(pId => appContactsState.values.list[pId].mails[0]);
            mailAddresses.push(appState.values.user);
            $mdDialog.hide();
            return this.chatNetSrv.createNewChat(
              newChatId,
              newChatName,
              true,
              now,
              mailAddresses,
            );
          };

        },
      ],
    });
  }

  private prepareContactList(contacts: Record<string, client3N.Person>): Record<string, client3N.Person> {
    const tmpList = copy(contacts);
    const meId = Object.keys(tmpList).find(id => {
      const person = tmpList[id];
      return person.mails[0] === appState.values.user;
    });
    delete tmpList[meId];
    return tmpList;
  }

}
