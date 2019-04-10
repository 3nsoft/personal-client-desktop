/* tslint:disable:max-line-length */
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
import '@uirouter/angularjs';
import 'angular-aria';
import 'angular-animate';
import 'angular-messages';
import 'angular-sanitize';
import 'angular-material';
import 'ng-embed';
import 'angular-ui-notification';

import * as ArrayFilterModule from '../common/filters/to-array';
import * as AsyncFilterModule from '../common/filters/async';
import * as ConfirmDialogServiceModule from '../apps/common/services/confirm-dialog.service';
import * as PcdIconDirectiveModule from '../common/directives/pcd-icon/pcd-icon';
import * as PcdIconContactComponentModule from '../common/components/pcd-contact-icon/pcd-contact-icon';
import * as NavItemComponentModule from '../apps/common/components/nav-item/nav-item';

import * as AppsComponentModule from '../apps/apps';
import * as AppContactComponentModule from '../apps/app-contact/app-contact';
import * as AppChatComponentModule from '../apps/app-chat/app-chat';
import * as AppMailComponentModule from '../apps/app-mail/app-mail';
import * as CommonServiceModule from '../apps/common/services/common.service';

import * as AppContactsServiceModule from '../apps/app-contact/services/app-contact.service';
import * as AppContactItemComponent from '../apps/app-contact/contact-item/contact-item.component';
import * as AppContactListComponentModule from '../apps/app-contact/contact-list/contact-list.component';
import * as AppContactItemComponentModule from '../apps/app-contact/contact-item/contact-item.component';
import * as PersonComponentModule from '../apps/app-contact/person/person.component';

import * as AppMailServiceModule from '../apps/app-mail/services/app-mail.service';
import * as MessageSendServiceModule from '../apps/app-mail/services/message-send.service';
import * as MessageReceivingServiceModule from '../apps/app-mail/services/message-receiving.service';
import * as AppMailFoldersComponentModule from '../apps/app-mail/app-mail-folders/app-mail-folders.component';
import * as AppMailMessagesComponentModule from '../apps/app-mail/app-mail-messages/app-mail-messages.component';
import * as AppMailMessageComponentModule from '../apps/app-mail/app-mail-message/app-mail-message.component';
import * as AppMailMessageToolbarComponentModule from '../apps/app-mail/app-mail-message/app-mail-message-toolbar/app-mail-message-toolbar';
import * as AppMailMessageFastReplyComponentModule from '../apps/app-mail/app-mail-message/app-mail-message-fast-reply/app-mail-message-fast-reply';
import * as MailFolderManagerServiceModule from '../apps/app-mail/services/mail-folder-manager/mail-folder-manager.service';
import * as MailFolderComponentModule from '../apps/app-mail/mail-folder/mail-folder.component';
import * as MailMessagesItemComponentModule from '../apps/app-mail/mail-messages-item/mail-messages-item.component';
import * as AttachServiceModule from '../apps/app-mail/services/attach.service';
import * as AttachmentsComponentModule from '../apps/app-mail/attachments/attachments.component';
import * as MessageManagerServiceModule from '../apps/app-mail/services/message-manager/message-manager.service';
import * as MessageMoveServiceModule from '../apps/app-mail/services/message-move/message-move.service';
import * as MessageManagerHelpersServiceModule from '../apps/app-mail/services/message-manager/message-manager.helpers.service';
import * as MsgSendProgressServiceModule from '../apps/app-mail/services/message-send-progress.service';

export const dependencies = [
  'ui.router',
  'ngAnimate',
  'ngSanitize',
  'ngMaterial',
  'angular-squire',
  'ngEmbed',
  'ui-notification',
  ArrayFilterModule.ModuleName,
  AsyncFilterModule.ModuleName,
  ConfirmDialogServiceModule.ModuleName,
  PcdIconDirectiveModule.ModuleName,
  PcdIconContactComponentModule.ModuleName,
  NavItemComponentModule.ModuleName,
  AppsComponentModule.ModuleName,
  AppContactComponentModule.ModuleName,
  AppChatComponentModule.ModuleName,
  AppMailComponentModule.ModuleName,
  AppMailMessageToolbarComponentModule.ModuleName,
  AppMailMessageFastReplyComponentModule.ModuleName,
  CommonServiceModule.ModuleName,
  AppContactsServiceModule.ModuleName,
  AppContactItemComponent.ModuleName,
  AppContactListComponentModule.ModuleName,
  AppContactItemComponentModule.ModuleName,
  PersonComponentModule.ModuleName,
  AppMailServiceModule.ModuleName,
  MessageSendServiceModule.ModuleName,
  MessageReceivingServiceModule.ModuleName,
  AppMailFoldersComponentModule.ModuleName,
  AppMailMessagesComponentModule.ModuleName,
  AppMailMessageComponentModule.ModuleName,
  MailFolderManagerServiceModule.ModuleName,
  MailFolderComponentModule.ModuleName,
  MailMessagesItemComponentModule.ModuleName,
  AttachServiceModule.ModuleName,
  AttachmentsComponentModule.ModuleName,
  MessageManagerServiceModule.ModuleName,
  MessageMoveServiceModule.ModuleName,
  MessageManagerHelpersServiceModule.ModuleName,
  MsgSendProgressServiceModule.ModuleName,
];

export interface AppsModule {
  module: any;
  type: 'filter'|'component'|'directive'|'service'|'provider';
}

export const appsModules: AppsModule[] = [
  { module: ArrayFilterModule, type: 'filter' },
  { module: AsyncFilterModule, type: 'filter' },
  { module: ConfirmDialogServiceModule, type: 'service' },
  { module: PcdIconDirectiveModule, type: 'directive' },
  { module: PcdIconContactComponentModule, type: 'component' },
  { module: NavItemComponentModule, type: 'component' },
  { module: AppsComponentModule, type: 'component' },
  { module: AppContactComponentModule, type: 'component' },
  { module: AppChatComponentModule, type: 'component' },
  { module: AppMailComponentModule, type: 'component' },
  { module: CommonServiceModule, type: 'service' },
  { module: AppContactsServiceModule, type: 'service' },
  { module: AppContactItemComponent, type: 'component' },
  { module: AppContactListComponentModule, type: 'component' },
  { module: AppContactItemComponentModule, type: 'component' },
  { module: PersonComponentModule, type: 'component' },
  { module: AppMailServiceModule, type: 'service' },
  { module: MessageSendServiceModule, type: 'service' },
  { module: MessageReceivingServiceModule, type: 'service' },
  { module: AppMailFoldersComponentModule, type: 'component' },
  { module: AppMailMessagesComponentModule, type: 'component' },
  { module: AppMailMessageComponentModule, type: 'component' },
  { module: AppMailMessageToolbarComponentModule, type: 'component' },
  { module: AppMailMessageFastReplyComponentModule, type: 'component' },
  { module: MailFolderManagerServiceModule, type: 'service' },
  { module: MailFolderComponentModule, type: 'component' },
  { module: MailMessagesItemComponentModule, type: 'component' },
  { module: AttachServiceModule, type: 'service' },
  { module: AttachmentsComponentModule, type: 'component' },
  { module: MessageManagerServiceModule, type: 'service' },
  { module: MessageMoveServiceModule, type: 'service' },
  { module: MessageManagerHelpersServiceModule, type: 'service' },
  { module: MsgSendProgressServiceModule, type: 'service' },
];
