/*
 Copyright (C) 2018 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under
 the terms of the GNU General Public License as published by the Free Software
 Foundation, either version 3 of the License, or (at your option) any later
 version.

 This program is distributed in the hope that it will be useful, but
 WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with
 this program. If not, see <http://www.gnu.org/licenses/>.
*/

export const AppId: {[name: string]: number} = {
  Chat: 0,
  Mail: 1,
  Storage: 2,
  Contacts: 3,
};

export const APPS: client3N.Apps[] = [
  {
    id: AppId.Chat,
    name: 'Chat',
    icon: 'chat',
    stateName: 'root.app-chat',
    fsName: 'computer.3nweb.chat',
    isDisabled: false,
    unreadAmount: 0,
  },
  {
    id: AppId.Mail,
    name: 'Mail',
    icon: 'mail_outline',
    stateName: 'root.app-mail',
    fsName: 'computer.3nweb.mail',
    isDisabled: false,
    unreadAmount: 0,
  },
  {
    id: AppId.Storage,
    name: 'Storage',
    icon: 'storage',
    stateName: 'root.app-storage',
    fsName: 'computer.3nweb.storage',
    isDisabled: true,
  },
  {
    id: AppId.Contacts,
    name: 'Contacts',
    icon: 'people_outline',
    fsName: 'computer.3nweb.contacts',
    isDisabled: false,
  },
];

export const SERVICE_FS: {[name: string]: string} = {
  config: 'computer.3nweb.config',
  tags: 'computer.3nweb.tags',
  notices: 'computer.3nweb.notices',
};

export const APP_FILE_NAMES: {[name: string]: string} = {
  contacts: 'contacts.json',
  mailFolders: 'mail-folders.json',
  messages: 'message-list.json',
  chatList: 'chat-list.json',
  chatLog: 'chat-log.json',
};

/**
 * id системных почтовых папок
 */
export enum SYS_MAIL_FOLDERS {
  inbox = '0',
  draft = '1',
  outbox = '2',
  sent = '3',
  trash = '4',
}

/**
 * системные почтовые папки (по умолчанию)
 */
export const MAIL_FOLDERS_DEFAULT: {[id: string]: client3N.MailFolder} = {
  '0': {
    id: SYS_MAIL_FOLDERS.inbox,
    orderNum: 0,
    name: 'Inbox',
    isSystem: true,
    icon: 'home',
    messageKeys: [],
    qtNoRead: 0,
  },
  '1': {
    id: SYS_MAIL_FOLDERS.draft,
    orderNum: 1,
    name: 'Draft',
    isSystem: true,
    icon: 'folder',
    messageKeys: [],
    qtNoRead: 0,
  },
  '2': {
    id: SYS_MAIL_FOLDERS.outbox,
    orderNum: 2,
    name: 'Outbox',
    isSystem: true,
    icon: 'folder',
    messageKeys: [],
    qtNoRead: 0,
  },
  '3': {
    id: SYS_MAIL_FOLDERS.sent,
    orderNum: 3,
    name: 'Sent',
    isSystem: true,
    icon: 'folder',
    messageKeys: [],
    qtNoRead: 0,
  },
  '4': {
    id: SYS_MAIL_FOLDERS.trash,
    orderNum: 4,
    name: 'Trash',
    isSystem: true,
    icon: 'delete',
    messageKeys: [],
    qtNoRead: 0,
  },
};
