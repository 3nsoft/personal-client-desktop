/*
 Copyright (C) 2016 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. */

import * as RouterMod from "./router";

import * as ArrayFilterMod from "./common/services/to-array";
ArrayFilterMod.addFilter(angular);

import * as CacheSrvMod from "./common/services/cache-srv";
CacheSrvMod.addService(angular);

import * as NotificationsSrvMod from "./common/notifications/notifications-srv";
NotificationsSrvMod.addService(angular);

import * as NotificationsCompMod from "./common/notifications/notifications";
NotificationsCompMod.addComponent(angular);

import * as BasisCompMod from "./common/basis/basis";
BasisCompMod.addComponent(angular);

import * as MailAppSrvMod from "./mail/mail-app/mail-app-srv";
MailAppSrvMod.addService(angular);

import * as MailActionSrvMod from "./mail/mail-app/mail-action-srv";
MailActionSrvMod.addService(angular);

import * as MailSendSrvMod from "./mail/mail-app/mail-send-srv";
MailSendSrvMod.addService(angular);

import * as MailCompMod from "./mail/mail-app/mail-app";
MailCompMod.addComponent(angular);

import * as NavFolderListSrvMod from "./mail/nav-folder-list/nav-folder-list-srv";
NavFolderListSrvMod.addService(angular);

import * as NavFolderListCompMod from "./mail/nav-folder-list/nav-folder-list";
NavFolderListCompMod.addComponent(angular);

import * as FolderCompMod from "./mail/folder/folder";
FolderCompMod.addComponent(angular);

import * as MsgListItemCompMod from "./mail/msg-list-item/msg-list-item";
MsgListItemCompMod.addComponent(angular);

import * as MessageCompMod from "./mail/message/message";
MessageCompMod.addComponent(angular);

import * as AttachBlockSrvMod from "./mail/attach-block/attach-block-srv";
AttachBlockSrvMod.addService(angular);

import * as AttachBlockCompMod from "./mail/attach-block/attach-block";
AttachBlockCompMod.addComponent(angular);

import * as AttachItemCompMod from "./mail/attach-item/attach-item";
AttachItemCompMod.addComponent(angular);

import * as ContactsAppSrvMod from "./contacts/contacts-app/contacts-app-srv";
ContactsAppSrvMod.addService(angular);

import * as ContactAppCompMod from "./contacts/contacts-app/contacts-app";
ContactAppCompMod.addComponent(angular);

let appModuleDependencies = [
  "ui.router",
  "ngAnimate",
  "ngSanitize",
  "ngMaterial",
  "ngMdIcons",
  "hmTouchEvents",
  "ngQuill",
  ArrayFilterMod.ModulName,
  CacheSrvMod.ModulName,
  NotificationsSrvMod.ModulName,
  NotificationsCompMod.ModuleName,
  BasisCompMod.ModuleName,
  MailAppSrvMod.ModulName,
  MailActionSrvMod.ModulName,
  MailSendSrvMod.ModulName,
  MailCompMod.ModuleName,
  NavFolderListSrvMod.ModulName,
  NavFolderListCompMod.ModuleName,
  FolderCompMod.ModuleName,
  MsgListItemCompMod.ModuleName,
  MessageCompMod.ModuleName,
  AttachBlockSrvMod.ModulName,
  AttachBlockCompMod.ModuleName,
  AttachItemCompMod.ModuleName,
  ContactsAppSrvMod.ModulName,
  ContactAppCompMod.ModuleName
];

let app = angular.module("3nweb", appModuleDependencies);


let APP_DEFAULT_PALETTE = {
	"background": "grey",
	"primary": "indigo",
	"accent": "amber",
	"warn": "red"
};

configApp.$inject = [
  "$mdThemingProvider",
  "ngMdIconServiceProvider",
  "ngQuillConfigProvider"
];

function configApp($mdThemingProvider: angular.material.IThemingProvider, ngMdIconServiceProvider: any, ngQuillConfigProvider: any): void {

  /* add user theme */

  $mdThemingProvider.theme("myTheme")
    .primaryPalette(APP_DEFAULT_PALETTE.primary)
    .accentPalette(APP_DEFAULT_PALETTE.accent)
    .backgroundPalette(APP_DEFAULT_PALETTE.background)
    .warnPalette(APP_DEFAULT_PALETTE.warn);

  $mdThemingProvider.setDefaultTheme("myTheme");
	(<any>window).mdT = $mdThemingProvider;

  /* add user icons */
  ngMdIconServiceProvider
    .addShapes({
      'mail_outline': '<path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9' +
      ' 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z"/>',
      'watch_later': '<path clip-path="url(#b)" d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5' +
      ' 10-10S17.5 2 12 2zm4.2 14.2L11 13V7h1.5v5.2l4.5 2.7-.8 1.3z"/>',
      'subdirectory_arrow_right': '<path d="M19 15l-6 6-1.42-1.42L15.17 16H4V4h2v10h9.17l-3.59-3.58L13 9l6 6z"/>'
    });


  /* config Quill Editor */
  ngQuillConfigProvider.set(
    [
      {	alias: '12',
        size: '12px'	},
      {	alias: '14',
        size: '14px'	},
      {	alias: '16',
        size: '16px'	},
      { alias: '18',
        size: '18px'	},
      { alias: '20',
        size: '20px'	},
      { alias: '22',
        size: '22px'	},
      {	alias: '24',
        size: '24px'}
    ],
    [
      {	label: 'Sans Serif',
        alias: 'sans-serif'	},
      {	label: 'Serif',
        alias: 'serif'	},
      {	label: 'Monospace',
        alias: 'monospace'	},
      {	label: 'Verdana',
        alias: 'Verdana'}
    ]
  ); 

}

app.config(configApp);
app.config(["$stateProvider", "$urlRouterProvider", RouterMod.routerSrv]);
