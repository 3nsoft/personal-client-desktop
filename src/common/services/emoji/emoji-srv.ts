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

import { element, IAngularStatic, IScope, IPromise, material } from 'angular';
import { emojiGroups, emojiList } from './emoji-list';

export const ModuleName = '3nClient.services.emoji';
export const EmojiServiceName = 'emojiService';

export function addService(angular: IAngularStatic): void {
  const module = angular.module(ModuleName, []);
  module.service(EmojiServiceName, Srv);
}

interface EmojiScope extends IScope {
  emGroups: {id: string, name: string}[];
  emList: client3N.Emoji[];

  closeModal: Function;
  selectEmoji: Function;
}

export class Srv {

  static $inject = ['$mdDialog'];
  constructor(
    private $mdDialog: material.IDialogOptions,
  ) {}

  openEmojiList(): IPromise<client3N.Emoji> {
    return (this.$mdDialog as any).show({
      parent: element(document.body),
      clickOutsideToClose: true,
      escapeToClose: true,
      templateUrl: './common/services/emoji/emoji.html',
      controller: ['$scope', '$mdDialog', ($scope: EmojiScope, $mdDialog: material.IDialogService) => {
        $scope.emGroups = emojiGroups.slice();
        $scope.emList = emojiList.slice();

        $scope.closeModal = () => {
          $mdDialog.cancel('cancel');
        };

        $scope.selectEmoji = (emoji: client3N.Emoji) => {
          $mdDialog.hide(emoji);
        };
      }],
    });

  }

}