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
import { copy, equals, IAngularStatic } from 'angular';
import { appMailState } from '../../app-mail/common/app-mail-store';
import * as AppMailServiceModule from '../../app-mail/services/app-mail.service';
import { checkMailFoldersForMessages } from '../helpers';

export let ModuleName = '3nClient.services.common';
export let CommonServiceName = 'commonService';

export function addService(ng: IAngularStatic): void {
  const module = ng.module(ModuleName, []);
  module.service(CommonServiceName, CommonService);
}

export class CommonService {
  static $inject = [AppMailServiceModule.AppMailServiceName];
  constructor(
    private appMailSrv: AppMailServiceModule.AppMailService,
  ) {
    console.log('Common service are initializing ...');
    /* при изменении содержимого списка mail folders */
    appMailState
      .change$
      .list
      .subscribe(async (folderList: {[id: string]: client3N.MailFolder}) => {
        console.log('MailFolders changes ...');
        await this.appMailSrv.saveMailFolderList(folderList);
      });

    /* при изменении содержимого списка сообщений */
    appMailState
      .change$
      .messageList
      .subscribe(async (msgList: {[key: string]: client3N.MessageListItem}) => {
        console.log('Messages changes ...');
        const mailFolderListUpdated = checkMailFoldersForMessages(
          appMailState.values.list,
          msgList,
        );
        if (!equals(appMailState.values.list, mailFolderListUpdated)) {
          appMailState.values.list = copy(mailFolderListUpdated);
          appMailState.values.unreadMessages = Object.keys(mailFolderListUpdated)
            .reduce((count: number, key: string) => {
              count = count + mailFolderListUpdated[key].qtNoRead;
              return count;
            }, 0);
        }
        console.log('COUNT: ', appMailState.values.unreadMessages);
        await this.appMailSrv.saveMessageList(msgList);
      });
  }

}
