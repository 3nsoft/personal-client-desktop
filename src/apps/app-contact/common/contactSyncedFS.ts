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

import { APP_FILE_NAMES, AppId, APPS } from '../../../common/const';
import { JsonFromFile } from '../../../common/services/fs/commonSyncedFS';

export class ContactSyncedFS {
  private contacts: JsonFromFile<{[id: string]: client3N.Person}>;

  constructor() {
    const fsName = APPS.find(app => app.name === 'Contacts').fsName;

    this.contacts = new JsonFromFile(
      w3n.storage.getAppSyncedFS(fsName),
      `${APP_FILE_NAMES.contacts}`,
      null,
    );
  }

  public async getContactList(): Promise<{[id: string]: client3N.Person}> {
    return await this.contacts.get();
  }

  public async saveContactList(contacts: {[id: string]: client3N.Person}): Promise<void> {
    await this.contacts.save(contacts);
  }

}
