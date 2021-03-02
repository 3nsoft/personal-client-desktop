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
import { IAngularStatic } from 'angular';
import { appContactsState } from '../common/app-contact-store';
import { ContactSyncedFS } from '../common/contactSyncedFS';
import { createNewPersonList } from '../../common/helpers/forAppContact';

export let ModuleName = '3nClient.services.app-contacts';
export let AppContactsServiceName = 'appContacstService';

export function addService(angular: IAngularStatic): void {
  const module = angular.module(ModuleName, []);
  module.service(AppContactsServiceName, AppContactsService);
}

export class AppContactsService {
  private contactsFs: ContactSyncedFS;

  constructor() {
    this.contactsFs = new ContactSyncedFS();
  }

  public getPersonList(): void {
    this.contactsFs.getContactList()
      .then(list => {
        if (list) {
          appContactsState.values.list = list;
        } else {
          const me = createNewPersonList();
          appContactsState.values.list = Object.assign({}, me);
          this.contactsFs.saveContactList(appContactsState.values.list);
        }
      });
  }

  public async savePersonList(list: {[id: string]: client3N.Person}): Promise<void> {
    return await this.contactsFs.saveContactList(list);
  }

}
