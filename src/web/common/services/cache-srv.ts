/*
 Copyright (C) 2016 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. */

export let ModuleName = "3nClient.services.cache";
export let CacheSrvName = "cacheService";


export function addService(angular: angular.IAngularStatic): void {
  let mod = angular.module(ModuleName, []);
  mod.service(CacheSrvName, Cache);
}

export class Cache {
  public username: string;
  public general: {
    appSelected: number;
    progressBar: boolean;
    blockUI: boolean;
    observeSendings: string[];
  };
  public folders: {
    list?: { [id: string]: client3N.MailFolderMapping },
    selectId?: string
  };
  public messages: {
    list?: { [id: string]: client3N.MessageMapping };
    selectId?: string;
    selectMode?: string;
    contactsForCreateFrom: string[];
    refreshTS?: number;
    progeessCbId: number;
    sendStatus?: number;
    unreadMsgQuantity?: number;
  };
  public notifications: {
    list: client3N.Notification[]
  };
  public contacts: {
    list: { [id: string]: client3N.PersonMapping },
    letters: string[],
    total: number,
    select: string,
    marked: string[],
    cMode: string
  };
  public groups: {
    list: { [id: string]: client3N.GroupMapping },
    letters: string[],
    total: number,
    select: string,
    grMode: string,
  };
  public tags: {
    list: client3N.Tag[]
  };
  public chats: {
    list: client3N.ChatRoom[];
    selected: string;
    selectedMembers?: string[];
    logContent: client3N.ChatLog[];
    refreshTS?: number;
    unreadChatsQuantity?: number;
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
      contactsForCreateFrom: [],
      refreshTS: 0,
      progeessCbId: null,
      sendStatus: 0,
      unreadMsgQuantity: 0
    };
    this.general = {
      progressBar: false,
      blockUI: false,
      appSelected: 1,
      observeSendings: []
    };
    this.notifications = {
      list: []
    };
    this.contacts = {
      list: {},
      letters: [],
      total: 0,
      select: null,
      marked: [],
      cMode: "hide"
    };
    this.groups = {
      list: {},
      letters: [],
      total: 0,
      select: null,
      grMode: "hide"
    };
    this.tags = {
      list: []
    };
    this.chats = {
      list: [],
      selected: null,
      selectedMembers: [],
      logContent: [],
      refreshTS: 0,
      unreadChatsQuantity: 0
    };

  }

}
