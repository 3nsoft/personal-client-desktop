/*
 Copyright (C) 2016 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. */


export let ModulName = "3nweb.services.cache";
export let CacheSrvName = "cacheService";


export function addService(angular: angular.IAngularStatic): void {
  let mod = angular.module(ModulName, []);
  mod.service(CacheSrvName, Cache);
}

export class Cache {
  public username: string;
  public folders: {
    list?: { [id: string]: client3N.MailFolderMapping };
    selectId?: string;
  };
  public messages: {
    list?: { [id: string]: client3N.MessageMapping };
    selectId?: string;
    selectMode?: string;
    refreshTS?: number;
    progeessCbId: number;
    sendStatus?: number;
  };
  public general: {
    progressBar: boolean;
    blockUI: boolean;
  };
  public notifications: {
    list: client3N.Notification[]
  };
  public contacts: {
    list: {
      contact: { [id: string]: any },
      group: {[id: string]: any}
    },
    section: string;
    cMode: string;
    select: {
      contactId: string;
      groupId: string;
    }

  };

  static $inject = ["$rootScope"];
  constructor(
    private $rootScope: angular.IRootScopeService
  ) {
    this.username = "";
    this.folders = {
      list: null,
      selectId: "0"
    };
    this.messages = {
      list: null,
      selectId: null,
      selectMode: "hide",
      refreshTS: 0,
      progeessCbId: null,
      sendStatus: 0
    };
    this.general = {
      progressBar: false,
      blockUI: false
    };
    this.notifications = {
      list: []
    };

  }



}
