/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. */

import * as LIB from '../../common/services/lib-internal';
import * as CacheSrv from "../../common/services/cache-srv";

export let ModuleName = "3nClient.components.person-list";

class Controller {

  static $inject = ["$scope", "$state", "$anchorScroll", "$location", "$timeout", CacheSrv.CacheSrvName];
  constructor(
    private $scope: angular.IScope,
    private $state: angular.ui.IStateService,
    private $anchorScroll: angular.IAnchorScrollService,
    private $location: angular.ILocationService,
		private $timeout: angular.ITimeoutService,
    private cacheSrv: CacheSrv.Cache
  ) {
		this.$timeout(() => {
      console.log(this.cacheSrv.contacts.list);
      if (!!this.cacheSrv.contacts.select) {
        this.selectPersonWithScroll(this.cacheSrv.contacts.select);
      }
		});
  }

  selectPerson(event: JQueryEventObject, person: client3N.PersonMapping): void {
    let elemClass = event.target.className;
    if (elemClass.indexOf("avatar-field") === -1) {
      this.cacheSrv.contacts.select = person.personId;
      this.cacheSrv.contacts.cMode = "show";
      this.$state.go("root.contacts.person", { personId: person.personId });
    }
  }

  selectPersonWithScroll(personId: string): void {
    this.cacheSrv.contacts.select = personId;
    this.cacheSrv.contacts.cMode = "show";
    this.scrollToSelectPerson(this.cacheSrv.contacts.select);
    this.$state.go("root.contacts.person", { personId: personId });
  }

  /**
   * прокрутка списка сообщений к выбранному
   * @param personId {string}
   * @returns {void}
   */
  private scrollToSelectPerson(personId: string): void {
    const htmlElemId = `p${personId}`;
    if (this.$location.hash() !== htmlElemId) {
      this.$location.hash(htmlElemId);
    } else {
      this.$anchorScroll();
    }
  }

  markPersons(event: JQueryEventObject, personId: string): void {
    let elemClass = event.target.className;
    if (elemClass.indexOf("avatar-field") > -1) {
      let personIndex = this.cacheSrv.contacts.marked.indexOf(personId);
      if (personIndex > -1) {
        this.cacheSrv.contacts.marked.splice(personIndex, 1);
      } else {
        this.cacheSrv.contacts.marked.push(personId);
      }
    }
    // console.log(this.cacheSrv.contacts.marked);    
  }

  invertColor(color: string): string {
    return LIB.invertColor(color);
  }

}

let componentConfig: angular.IComponentOptions = {
  bindings: {},
  templateUrl: "./templates/contacts/person-list/person-list.html",
  controller: Controller
}

export function addComponent(angular: angular.IAngularStatic): void {
  let mod = angular.module(ModuleName, []);
  mod.component("personList", componentConfig);
}

Object.freeze(exports);
