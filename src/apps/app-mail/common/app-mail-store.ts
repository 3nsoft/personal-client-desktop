/* tslint:disable:interface-name */
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

import { SYS_MAIL_FOLDERS } from '../../../common/const';
import { Store } from '../../../common/lib/store';
import { MailSyncedFS } from './mailSyncedFS';
import { MessageSyncedFS } from './messageSyncedFS';

interface IAppMailState {
  list: {[id: string]: client3N.MailFolder};
  selectFolderId: string;
  messageList: {[key: string]: client3N.MessageListItem};
  selectedMessageKeys: string[];
  sendingStatus: client3N.SendingStatus;
  inboxRefreshTimestamp: number;
  unreadMessages: number;
}

export const mailSyncedFS = new MailSyncedFS();
export const messageSyncedFS = new MessageSyncedFS();
export const appMailState = new Store<IAppMailState>();

appMailState.values.list = {};
appMailState.values.selectFolderId = SYS_MAIL_FOLDERS.inbox;
appMailState.values.messageList = {};
appMailState.values.selectedMessageKeys = [];
appMailState.values.sendingStatus = null;
appMailState.values.inboxRefreshTimestamp = 0;
appMailState.values.unreadMessages = 0;
