/*
 Copyright (C) 2018 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General
 Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option
 any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the
 implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see
<http://www.gnu.org/licenses/>.
*/
import angular from 'angular';
import '@uirouter/angularjs';
import 'angular-aria';
import 'angular-animate';
import 'angular-messages';
import 'angular-sanitize';
import 'angular-material';
import 'ng-embed';
import 'angular-ui-notification';
import { configApp } from './common/config';

import { toArray } from './common/filters/to-array';
import { asyncFilter } from './common/filters/async';
import { firstUppercase } from './common/filters/custom';

import * as PcdIconDirectiveModule from './common/directives/pcd-icon/pcd-icon';
import * as EmojiServiceModule from './common/services/emoji/emoji-srv';
import * as PcdContactIconComponentModule from './common/components/pcd-contact-icon/pcd-contact-icon';
import * as PcdContactAvatarComponentModule from './common/components/pcd-contact-avatar/pcd-contact-avatar';
import * as NavItemComponentModule from './apps/common/components/nav-item/nav-item';
import * as CommonServiceModule from './apps/common/services/common.service';
import * as ConfirmDialogServiceModule from './apps/common/services/confirm-dialog.service';

import * as AppsComponentModule from './apps/apps';
import * as AppContactsServiceModule from './apps/app-contact/services/app-contact.service';
import * as AppContactComponentModule from './apps/app-contact/app-contact';
import * as AppContactItemComponentModule from './apps/app-contact/contact-item/contact-item.component';
import * as AppContactListComponentModule from './apps/app-contact/contact-list/contact-list.component';
import * as PersonComponentModule from './apps/app-contact/person/person.component';

import * as AppMailComponentModule from './apps/app-mail/app-mail';
import * as AppMailServiceModule from './apps/app-mail/services/app-mail.service';
import * as AttachServiceModule from './apps/app-mail/services/attach.service';
import * as MessageReceivingServiceModule from './apps/app-mail/services/message-receiving.service';
import * as MessageSendProgressServiceModule from './apps/app-mail/services/message-send-progress.service';
import * as MessageSendServiceModule from './apps/app-mail/services/message-send.service';
import * as MailFolderManagerServiceModule from './apps/app-mail/services/mail-folder-manager/mail-folder-manager.service';
import * as MessageManagerHelpersServiceModule from './apps/app-mail/services/message-manager/message-manager.helpers.service';
import * as MessageManagerServiceModule from './apps/app-mail/services/message-manager/message-manager.service';
import * as MessageMoveServiceModule from './apps/app-mail/services/message-move/message-move.service';
import * as AppMailFoldersComponentModule from './apps/app-mail/app-mail-folders/app-mail-folders.component';
import * as AppMailMessageFastReplyComponentModule from './apps/app-mail/app-mail-message/app-mail-message-fast-reply/app-mail-message-fast-reply';
import * as AppMailMessageToolbarComponentModule from './apps/app-mail/app-mail-message/app-mail-message-toolbar/app-mail-message-toolbar';
import * as AppMailMessageComponentModule from './apps/app-mail/app-mail-message/app-mail-message.component';
import * as AppMailMessagesComponentModule from './apps/app-mail/app-mail-messages/app-mail-messages.component';
import * as AttachmentsComponentModule from './apps/app-mail/attachments/attachments.component';
import * as MailFolderComponentModule from './apps/app-mail/mail-folder/mail-folder.component';
import * as MailMessagesItemComponentModule from './apps/app-mail/mail-messages-item/mail-messages-item.component';

import * as AppChatComponentModule from './apps/app-chat/app-chat';
import * as AppChatNetServiceModule from './apps/app-chat/common/chat-net.service';
import * as AppChatContentComponentModule from './apps/app-chat/app-chat-content/app-chat-content';
import * as AppChatContentMsgComponentModule from './apps/app-chat/app-chat-content/app-chat-content-msg/app-chat-content-msg';
import * as AppChatCreateWindowSrvModule from './apps/app-chat/app-chat-create-window/app-chat-create-window';
import * as AppChatListComponentModule from './apps/app-chat/app-chat-list/app-chat-list';
import * as AppChatMsgCreateComponentModule from './apps/app-chat/app-chat-msg-create/app-chat-msg-create';

import { router } from './common/router';

PcdIconDirectiveModule.addDirective(angular);
EmojiServiceModule.addService(angular);
PcdContactIconComponentModule.addComponent(angular);
PcdContactAvatarComponentModule.addComponent(angular);
NavItemComponentModule.addComponent(angular);
CommonServiceModule.addService(angular);
ConfirmDialogServiceModule.addService(angular);
AppsComponentModule.addComponent(angular);
AppContactsServiceModule.addService(angular);
AppContactComponentModule.addComponent(angular);
AppContactItemComponentModule.addComponent(angular);
AppContactListComponentModule.addComponent(angular);
PersonComponentModule.addComponent(angular);
AppMailComponentModule.addComponent(angular);
AppMailServiceModule.addService(angular);
AttachServiceModule.addService(angular);
MessageReceivingServiceModule.addService(angular);
MessageSendProgressServiceModule.addService(angular);
MessageSendServiceModule.addService(angular);
MailFolderManagerServiceModule.addService(angular);
MessageManagerHelpersServiceModule.addService(angular);
MessageManagerServiceModule.addService(angular);
MessageMoveServiceModule.addService(angular);
AppMailFoldersComponentModule.addComponent(angular);
AppMailMessageFastReplyComponentModule.addComponent(angular);
AppMailMessageToolbarComponentModule.addComponent(angular);
AppMailMessageComponentModule.addComponent(angular);
AppMailMessagesComponentModule.addComponent(angular);
AttachmentsComponentModule.addComponent(angular);
MailFolderComponentModule.addComponent(angular);
MailMessagesItemComponentModule.addComponent(angular);
AppChatComponentModule.addComponent(angular);
AppChatNetServiceModule.addService(angular);
AppChatContentComponentModule.addComponent(angular);
AppChatContentMsgComponentModule.addComponent(angular);
AppChatCreateWindowSrvModule.addService(angular);
AppChatListComponentModule.addComponent(angular);
AppChatMsgCreateComponentModule.addComponent(angular);

const dependencies = [
  'ui.router',
  'ngAnimate',
  'ngSanitize',
  'ngMaterial',
  'angular-squire',
  'ngEmbed',
  'ui-notification',
  PcdIconDirectiveModule.ModuleName,
  EmojiServiceModule.ModuleName,
  PcdContactIconComponentModule.ModuleName,
  PcdContactAvatarComponentModule.ModuleName,
  NavItemComponentModule.ModuleName,
  CommonServiceModule.ModuleName,
  ConfirmDialogServiceModule.ModuleName,
  AppsComponentModule.ModuleName,
  AppContactsServiceModule.ModuleName,
  AppContactComponentModule.ModuleName,
  AppContactItemComponentModule.ModuleName,
  AppContactListComponentModule.ModuleName,
  PersonComponentModule.ModuleName,
  AppMailComponentModule.ModuleName,
  AppMailServiceModule.ModuleName,
  AttachServiceModule.ModuleName,
  MessageReceivingServiceModule.ModuleName,
  MessageSendProgressServiceModule.ModuleName,
  MessageSendServiceModule.ModuleName,
  MailFolderManagerServiceModule.ModuleName,
  MessageManagerHelpersServiceModule.ModuleName,
  MessageManagerServiceModule.ModuleName,
  MessageMoveServiceModule.ModuleName,
  AppMailFoldersComponentModule.ModuleName,
  AppMailMessageFastReplyComponentModule.ModuleName,
  AppMailMessageToolbarComponentModule.ModuleName,
  AppMailMessageComponentModule.ModuleName,
  AppMailMessagesComponentModule.ModuleName,
  AttachmentsComponentModule.ModuleName,
  MailFolderComponentModule.ModuleName,
  MailMessagesItemComponentModule.ModuleName,
  AppChatComponentModule.ModuleName,
  AppChatNetServiceModule.ModuleName,
  AppChatContentComponentModule.ModuleName,
  AppChatContentMsgComponentModule.ModuleName,
  AppChatCreateWindowSrvModule.ModuleName,
  AppChatListComponentModule.ModuleName,
  AppChatMsgCreateComponentModule.ModuleName,
];

const app = angular.module('3nClient', dependencies)
  .config(['$mdThemingProvider', 'squireServiceProvider', configApp])
  .filter('toArray', toArray)
  .filter('async', asyncFilter)
  .filter('firstUppercase', firstUppercase);

app.config(
  [
    '$stateProvider',
    '$urlServiceProvider',
    router,
  ],
);
