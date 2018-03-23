/*
 Copyright (C) 2016 - 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. */

import * as Image from "./images";

/**
 * системные настройки
 */
export const SETTINGS = {
  fileMaxSize: 1048576
}

/**
 * системные настройки UI
 */
export const SYS_APP_UI = {
  sidenavAnimationTime: 400 // время анимации бокового меню (мс)
};

/**
 * приложения (states)
 */
export const APPS: {[key: string]: {app: number, stateName: string}} = {
  chat: { app: 0, stateName: 'root.chat' },
  mail: { app: 1, stateName: 'root.mail' },
  contacts: { app: 2, stateName: 'root.contacts' },
  groups: { app: 2, stateName: 'root.groups' },
  storage: { app: 3, stateName: 'root.storage' }
};

/**
 * id системных почтовых папок
 */
export const SYS_MAIL_FOLDERS = {
  inbox: "0",
  draft: "1",
  outbox: "2",
  sent: "3",
  trash: "4"
};

/**
 * системные почтовые папки (по умолчанию)
 */
export const FOLDERS_DEFAULT: {[id: string]: client3N.MailFolderJSON} = {
  "0": {
    folderId: "0",
    orderNum: 0,
    folderName: "Inbox",
    isSystem: true,
    icon: 'home',
    messageIds: []
  },
  "1": {
    folderId: "1",
    orderNum: 1,
    folderName: "Draft",
    isSystem: true,
    icon: 'folder',
    messageIds: []
  },
  "2": {
    folderId: "2",
    orderNum: 2,
    folderName: "Outbox",
    isSystem: true,
    icon: 'folder',
    messageIds: []
  },
  "3": {
    folderId: "3",
    orderNum: 3,
    folderName: "Sent",
    isSystem: true,
    icon: 'folder',
    messageIds: []
  },
  "4": {
    folderId: "4",
    orderNum: 4,
    folderName: "Trash",
    isSystem: true,
    icon: 'delete',
    messageIds: []
  }
};

/**
 * JSON групп контактов по умолчанию
 */
export const GROUPS_JSON_DEFAULT: { [id: string]: client3N.GroupJSON } = {
  "0": {
    groupId: "0",
    name: "UNKNOWNS",
    notice: "Not confirmed contacts",
    avatar: Image.IMAGE_UNKNOWNS
  },
  "1": {
    groupId: "1",
    name: "BLACK LIST",
    notice: "Black list of contacts",
    avatar: Image.IMAGE_BLACK_LIST
  }
};

/**
 * Mapping групп контактов по умолчанию
 */
export const GROUPS_MAP_DEFAULT: { [id: string]: client3N.GroupMapping } = {
  "0": {
    groupId: "0",
    name: "UNKNOWNS",
    members: [],
    minAvatar: Image.IMAGE_UNKNOWNS,
    isSystem: true,
    letter: " ",
    initials: "UN",
    color: "#333333",
    labels: [],
    mode: "saved"
  },
  "1": {
    groupId: "1",
    name: "Black List",
    members: [],
    minAvatar: Image.IMAGE_BLACK_LIST,
    isSystem: true,
    letter: " ",
    initials: "BL",
    color: "#000000",
    labels: [],
    mode: "saved"
  }
};

/**
 * наименование и версия файловых систем приложения
 */
export const FS_USED = {
  VERSION: "0-0-1",
  MAIL: "computer.3nweb.mail",
  CONTACTS: "computer.3nweb.contacts",
  TAGS: "computer.3nweb.tags",
  CHAT: "computer.3nweb.chat",
  STORAGE: "computer.3nweb.storage"
};

/**
 * наименования файлов в storage, хранящих различные данные,
 * используемые в приложении
 */
export const USED_FILES_NAMES = {
  "notifications": "notifications.json",
  "mailFolders": "mail-folders.json",
  "messagesMap": "messages-map.json",
  "message": "main.json",
  "personsMap": "contacts-map.json",
  "groupsMap": "groups-map.json",
  "tags": "tags-list.json",
  "chatList": "chat-list.json",
  "chatLog": "chat-log.json"
};
