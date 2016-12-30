/*
 Copyright (C) 2016 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. */
 
export let ModuleName = "3nweb.components.msg-list-item";

class Controller {
  msgMap: client3N.MessageMapping;
  
  static $inject = ["$scope", "$timeout"];
  constructor(
    private $scope: angular.IScope, 
    private $timeout: angular.ITimeoutService
  ) {}

  isToday(): boolean {
    let now = new Date();
    let nowBegin = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0);
		let dateMsg = new Date(this.msgMap.timeCr);
		let reply =  (dateMsg < nowBegin) ? false : true;
		return reply;
  };  
      
}


let componentConfig: angular.IComponentOptions = {
  bindings: {
    msgMap: "<msgMap"
  },
  templateUrl: "./templates/mail/msg-list-item/msg-list-item.html",
  controller: Controller
}

export function addComponent(angular: angular.IAngularStatic): void {
  let mod = angular.module(ModuleName, []);
  mod.component("msgListItem", componentConfig);
}

Object.freeze(exports);