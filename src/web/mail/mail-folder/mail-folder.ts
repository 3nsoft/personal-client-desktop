/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. */

import * as LIB from '../../common/services/lib-internal';
import * as CacheSrvMod from '../../common/services/cache-srv';

export let ModuleName = '3nClient.components.mail-folder';

class Controller {
  msgList:  {[id: string]: client3N.MessageMapping };
  msgSel: client3N.MessageMapping;

  filterItem: string;

  static $inject = ['$scope', '$state', '$stateParams', '$anchorScroll', '$location', '$timeout', CacheSrvMod.CacheSrvName];
  constructor(
    private $scope: angular.IScope,
    private $state: angular.ui.IStateService,
    private $stateParams: angular.ui.IStateParamsService,
    private $anchorScroll: angular.IAnchorScrollService,
    private $location: angular.ILocationService,
    private $timeout: angular.ITimeoutService,
    private _cacheSrv: CacheSrvMod.Cache
  ) {
    this.filterItem = 'All';
    this.$timeout(() => {
      if (!!this.msgSel) {
        console.info('Initial <mail-folders> class ...');
        this.selectMsgWithScroll(this.msgSel);
      }
    });

    this.$scope.$on('client_mustSelectMessage', (event, msgId: string) => {
      this.selectMsgWithScroll(null, msgId);
    });

    this.$scope.$on('client_msgMapChanged', (event, fromFolder) => {
      this.$timeout(() => {
        if (!this.$stateParams.msgId) {
          let tmpFolder: { [id: string]: client3N.MessageMapping } = {}
          for (let msgId of Object.keys(this._cacheSrv.messages.list)) {
            if (this._cacheSrv.messages.list[msgId].folderId === fromFolder) {
              tmpFolder[msgId] = this._cacheSrv.messages.list[msgId]
            }
          }
          this.msgList = angular.copy(tmpFolder)
        }
      })
    });

  }

  /**
   * открытие списка фильтров
   */
	openFilter($mdMenu, ev): void {
		$mdMenu.open(ev);
	}

  /**
   * выбор пункта фильтра
   * @param item {string}
   */
  selectFilterItem(item: string): void {
    this.$timeout(() => {
      this.filterItem = item.toLowerCase();
    });
  }

  /**
   * выбор сообщения
   * @param msg {client3N.MessageMapping}
   * @param msgId? {string}
   * @returns {void}
   */
  selectMsg(msg: client3N.MessageMapping, msgId?: string): void {
    const currentMsg = (!!msgId) ? this._cacheSrv.messages.list[msgId] : msg;
    console.log(currentMsg);    

    this._cacheSrv.messages.selectId = currentMsg.msgId;
    this.$state.go('root.mail.folder.msg', { id: currentMsg.msgId });
  }

  /**
   * выбор сообщения с скролом к сообщению
   * @param msg {client3N.MessageMapping}
   * @param msgId? {string}
   * @returns {void}
   */
  selectMsgWithScroll(msg: client3N.MessageMapping, msgId?: string): void {
    const currentMsg = (!!msgId) ? this._cacheSrv.messages.list[msgId] : msg;
    console.log(currentMsg);    

    this._cacheSrv.messages.selectId = currentMsg.msgId;
    this.scrollToSelectMsg(currentMsg.msgId);
    this.$state.go('root.mail.folder.msg', { id: currentMsg.msgId });
  }

  /**
   * прокрутка списка сообщений к выбранному
   * @param msgId {string}
   * @returns {void}
   */
  private scrollToSelectMsg(msgId: string): void {
    const htmlElemId = `m${msgId}`;
    if (this.$location.hash() !== htmlElemId) {
      this.$location.hash(htmlElemId);
    } else {
      this.$anchorScroll();
    }
  }

  /**
   * фильтр по дате
   */
  private periodFilter(mode: 'today' | 'week' | 'all') {
    return (item: client3N.MessageMapping) => {
      return LIB.isDateInPeriod(new Date(item.timeCr), mode);
    }
  }
  

}

let componentConfig: angular.IComponentOptions = {
  bindings: {
    msgList: '<',
    msgSel: '<'
  },
  templateUrl: './templates/mail/mail-folder/mail-folder.html',
  controller: Controller
}

export function addComponent(angular: angular.IAngularStatic): void {
  let mod = angular.module(ModuleName, []);
  mod.component('mailFolder', componentConfig);
}

Object.freeze(exports);
