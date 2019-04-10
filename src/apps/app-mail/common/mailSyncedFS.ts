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

import { APP_FILE_NAMES, APPS } from '../../../common/const';
import { JsonFromFile } from '../../../common/services/fs/commonSyncedFS';

export class MailSyncedFS {
  private mailFolders: JsonFromFile<{[id: string]: client3N.MailFolder}>;
  private messages: JsonFromFile<{[id: string]: client3N.MessageListItem}>;

  constructor() {
    const fsName = APPS.find(app => app.name === 'Mail').fsName;

    this.mailFolders = new JsonFromFile<{[id: string]: client3N.MailFolder}>(
      w3n.storage.getAppSyncedFS(fsName),
      `${APP_FILE_NAMES.mailFolders}`,
      null,
    );

    this.messages = new JsonFromFile<{[id: string]: client3N.MessageListItem}>(
      w3n.storage.getAppSyncedFS(fsName),
      `${APP_FILE_NAMES.messages}`,
      null,
    );
  }

  public async getMailFolders(): Promise<{[id: string]: client3N.MailFolder}> {
    return await this.mailFolders.get();
  }

  public async saveMailFolders(folders: {[id: string]: client3N.MailFolder}): Promise<void> {
    await this.mailFolders.save(folders);
  }

  public async getMessageList(): Promise<{[id: string]: client3N.MessageListItem}> {
    return await this.messages.get();
  }

  public async saveMessageList(messages: {[id: string]: client3N.MessageListItem}): Promise<void> {
    return await this.messages.save(messages);
  }

}
