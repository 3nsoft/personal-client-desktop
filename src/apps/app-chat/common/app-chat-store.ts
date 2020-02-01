/* tslint:disable:interface-name */
/*
 Copyright (C) 2019 3NSoft Inc.

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

import { Store } from '../../../common/lib/store';
import { Chat } from './chat';

interface IAppChatState {
  messageWatcher: string[];
  list: client3N.ChatRoom[];
  lastTS: number;
  selected: string;
  selectedChat: client3N.ChatRoom;
  logContent: client3N.ChatLog[];
  unreadChatsQt: number;
}

export const appChatState = new Store<IAppChatState>();
export const chat = new Chat();

appChatState.values.messageWatcher = [];
appChatState.values.list = [];
appChatState.values.lastTS = 0;
appChatState.values.selected = null;
appChatState.values.selectedChat = null;
appChatState.values.logContent = [];
appChatState.values.unreadChatsQt = 0;
