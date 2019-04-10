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

import { ITimeoutService } from 'angular';
import { StateProvider, UrlRouterProvider } from '@uirouter/angularjs';
import { logError } from './services/libs/logging';
import { appState } from '../apps/common/services/app-store';
import * as AppContactService from '../apps/app-contact/services/app-contact.service';
import * as AppMailService from '../apps/app-mail/services/app-mail.service';
import * as MessageSendService from '../apps/app-mail/services/message-send.service';

export function router($stateProvider: StateProvider, $urlRouterProvider: UrlRouterProvider): void {
  $urlRouterProvider.otherwise('/');

  $stateProvider
    .state('root', {
      url: '/',
      template: `<apps></apps>`,
      resolve: {
        data: [
          '$timeout',
          AppContactService.AppContactsServiceName,
          AppMailService.AppMailServiceName,
          MessageSendService.MessageSendServiceName,
          async (
            $timeout: ITimeoutService,
            contactSrv: AppContactService.AppContactsService,
            mailSrv: AppMailService.AppMailService,
            msgSrv: MessageSendService.MessageSendService,
          ) => {
            try {
              const user = await w3n.mail.getUserId();
              appState.values.user = user;
              await contactSrv.getPersonList();
              await mailSrv.getMailFolderList();
              await msgSrv.checkSendingList();
              await mailSrv.getMessageList();
              return true;
            } catch (err) {
              logError(err);
            }
          },
        ],
      },
    })
    .state('root.app-chat', {
      url: 'app-chat',
      component: `appChat`,
    })
    .state('root.app-mail', {
      url: 'app-mail',
      component: `appMail`,
    })
    .state('root.app-mail.content', {
      url: '/{folderId}/{msgId}',
      views: {
        'folders': 'appMailFolders',
        'messages': 'appMailMessages',
        'message': 'appMailMessage',
      },
    });

}
