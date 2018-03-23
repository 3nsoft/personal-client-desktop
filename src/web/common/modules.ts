/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. */

import * as ArrayFilterMod from './filters/to-array';
ArrayFilterMod.addFilter(angular);

import * as CustomFilterMod from './filters/custom';
CustomFilterMod.addFilter(angular);

import * as CacheSrvMod from './services/cache-srv';
CacheSrvMod.addService(angular);

import * as CommonSrvMod from './services/common-srv';
CommonSrvMod.addService(angular);

import * as MainCompMod from './components/main/main';
MainCompMod.addComponent(angular);

import * as NotificationSrvMod from './services/notifications/notifications-srv';
NotificationSrvMod.addService(angular);

import * as NotificationCompMod from './services/notifications/notifications';
NotificationCompMod.addComponent(angular);

import * as TagsSrvMod from './services/tags/tag-srv';
TagsSrvMod.addService(angular);

import * as TagsCompMod from './services/tags/tags';
TagsCompMod.addComponent(angular);

import * as EmojiSrvMod from './services/emoji/emoji-srv';
EmojiSrvMod.addService(angular);

import * as ContactsAppSrvMod from '../contacts/contacts-app/contacts-app-srv';
ContactsAppSrvMod.addService(angular);

import * as ContactsAppCompMod from '../contacts/contacts-app/contacts-app';
ContactsAppCompMod.addComponent(angular);

import * as PersonListCompMod from '../contacts/person-list/person-list';
PersonListCompMod.addComponent(angular);

import * as PersonEditSrvMod from '../contacts/person/person-edit-srv';
PersonEditSrvMod.addService(angular);

import * as PersonCompMod from '../contacts/person/person';
PersonCompMod.addComponent(angular);

import * as GroupsAppCompMod from '../contacts/groups-app/groups-app';
GroupsAppCompMod.addComponent(angular);

import * as GroupListCompMod from '../contacts/group-list/group-list';
GroupListCompMod.addComponent(angular);

import * as GroupEditSrvMod from '../contacts/group/group-edit-srv';
GroupEditSrvMod.addService(angular);

import * as GroupCompMod from '../contacts/group/group';
GroupCompMod.addComponent(angular);

import * as MailFsSrvMod from '../mail/mail-app/mail-fs-srv';
MailFsSrvMod.addService(angular);

import * as MailSrvMod from '../mail/mail-app/mail-srv';
MailSrvMod.addService(angular);

import * as MailAppCompMod from '../mail/mail-app/mail-app';
MailAppCompMod.addComponent(angular);

import * as MailFoldersFsSrvMod from '../mail/mail-folders/mail-folders-fs-srv';
MailFoldersFsSrvMod.addService(angular);

import * as MailFoldersSrvMod from '../mail/mail-folders/mail-folders-srv';
MailFoldersSrvMod.addService(angular);

import * as MailFoldersCompMod from '../mail/mail-folders/mail-folders';
MailFoldersCompMod.addComponent(angular);

import * as MailFolderCompMod from '../mail/mail-folder/mail-folder';
MailFolderCompMod.addComponent(angular);

import * as MailFolderItemCompMod from '../mail/mail-folder/mail-folder-item/mail-folder-item';
MailFolderItemCompMod.addComponent(angular);

import * as MsgAttachSrvMod from '../mail/message/msg-attach/msg-attach-srv';
MsgAttachSrvMod.addService(angular);

import * as MsgAttachCompMod from '../mail/message/msg-attach/msg-attach';
MsgAttachCompMod.addComponent(angular);

import * as MsgEditCompMod from '../mail/message/msg-edit/msg-edit';
MsgEditCompMod.addComponent(angular);

import * as MsgEditSrvMod from '../mail/message/msg-edit/msg-edit-srv';
MsgEditSrvMod.addService(angular);

import * as MsgTagsCompMod from '../mail/message/msg-tags/msg-tags';
MsgTagsCompMod.addComponent(angular);

import * as MsgShowingCompMod from '../mail/message/msg-showing/msg-showing';
MsgShowingCompMod.addComponent(angular);

import * as ChatNetSrvMod from '../chat/common/chat-net-srv'
ChatNetSrvMod.addService(angular)

import * as ChatCreateSrvMod from '../chat/chat-create-window/chat-create-window'
ChatCreateSrvMod.addService(angular)

import * as ChatAppCompMod from '../chat/chat-app/chat-app'
ChatAppCompMod.addComponent(angular)

import * as ChatListCompMod from '../chat/chat-list/chat-list'
ChatListCompMod.addComponent(angular)

import * as ChatContentCompMod from '../chat/chat-content/chat-content'
ChatContentCompMod.addComponent(angular)

import * as ChatMsgCreateCompMod from '../chat/chat-msg-create/chat-msg-create'
ChatMsgCreateCompMod.addComponent(angular)

import * as StorageAppCompMod from '../storage/storage-app/storage-app'
StorageAppCompMod.addComponent(angular)
import * as ChatContentMsgCompMod from '../chat/chat-content/chat-content-msg/chat-content-msg'
ChatContentMsgCompMod.addComponent(angular)


export const appModuleDependencies = [
  'ui.router',
  'ngAnimate',
  'ngSanitize',
  'ngMaterial',
  'ngMdIcons',
  'hmTouchEvents',
  'ngQuill',
  'ngEmbed',
	ArrayFilterMod.ModuleName,
	CustomFilterMod.ModuleName,
	CacheSrvMod.ModuleName,
  CommonSrvMod.ModulName,
  MainCompMod.ModuleName,
  NotificationSrvMod.ModuleName,
  NotificationCompMod.ModuleName,
	TagsSrvMod.ModuleName,
  EmojiSrvMod.ModuleName,
	TagsCompMod.ModuleName,
  ContactsAppSrvMod.ModuleName,
  ContactsAppCompMod.ModuleName,
  PersonListCompMod.ModuleName,
  PersonEditSrvMod.ModuleName,
  PersonCompMod.ModuleName,
  GroupsAppCompMod.ModuleName,
  GroupListCompMod.ModuleName,
  GroupEditSrvMod.ModuleName,
  GroupCompMod.ModuleName,
	MailFsSrvMod.ModuleName,
	MailSrvMod.ModuleName,
  MailAppCompMod.ModuleName,
	MailFoldersFsSrvMod.ModuleName,
  MailFoldersSrvMod.ModuleName,
  MailFoldersCompMod.ModuleName,
  MailFolderCompMod.ModuleName,
	MailFolderItemCompMod.ModuleName,
	MsgAttachSrvMod.ModuleName,
	MsgAttachCompMod.ModuleName,
	MsgEditCompMod.ModuleName,
	MsgEditSrvMod.ModuleName,
	MsgTagsCompMod.ModuleName,
  MsgShowingCompMod.ModuleName,
  ChatNetSrvMod.ModuleName,
  ChatCreateSrvMod.ModuleName,
  ChatAppCompMod.ModuleName,
  ChatListCompMod.ModuleName,
  ChatContentCompMod.ModuleName,
  ChatMsgCreateCompMod.ModuleName,
  StorageAppCompMod.ModuleName,
  ChatContentMsgCompMod.ModuleName
];
