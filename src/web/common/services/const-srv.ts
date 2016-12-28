/*
 Copyright (C) 2016 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. */

/* системные настройки UI программы */
export let SYS_APP_UI = {
  sidenavAnimationTime: 400 // время анимации бокового меню (мс)
};

/* id системных почтовых папок */
export let SYS_MAIL_FOLDERS = {
  inbox: "0",
  draft: "1",
  outbox: "2",
  sent: "3",
  trash: "4"
};

/* системные почтовые папки (по умолчанию) */
export const FOLDERS_DEFAULT: {[id: string]: client3N.MailFolderJSON} = {
  "0": {
    folderId: "0",
    orderNum: 0,
    folderName: "INBOX",
    isSystem: true,
    messageIds: []
  },
  "1": {
    folderId: "1",
    orderNum: 1,
    folderName: "DRAFT",
    isSystem: true,
    messageIds: []
  },
  "2": {
    folderId: "2",
    orderNum: 2,
    folderName: "OUTBOX",
    isSystem: true,
    messageIds: []
  },
  "3": {
    folderId: "3",
    orderNum: 3,
    folderName: "SENT",
    isSystem: true,
    messageIds: []
  },
  "4": {
    folderId: "4",
    orderNum: 4,
    folderName: "TRASH",
    isSystem: true,
    messageIds: []
  }
};

/* наименования файлов в storage, хранящих различные данные, используемые в приложении */
export const USED_FILES_NAMES = {
  "mailFolders": "mail-folders.json",
  "messagesMap": "messages-map.json",
  "message": "main.json"
};
