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

import { IAngularStatic, uiNotification } from 'angular';
import { appMailState, messageSyncedFS } from '../common/app-mail-store';
import { SYS_MAIL_FOLDERS } from '../../../common/const';

export const ModuleName = '3nClient.services.attach';
export const AttachServiceName = 'attachService';

export function addService(ng: IAngularStatic): void {
  const module = ng.module(ModuleName, []);
  module.service(AttachServiceName, AttachService);
}

export class AttachService {
  static $inject = ['Notification'];

  constructor(
    private Notification: uiNotification.INotificationService,
  ) {}

  public async loadFilesFromExternalFS(
    msgKey: string = 'out=new',
    fileList: client3N.AttachFileInfo[] = [],
  ): Promise<client3N.AttachFileInfo[]> {
    const result: client3N.AttachFileInfo[] = [];
    const toSavePromise: Promise<void>[] = [];
    const title = 'Select file(s):';
    const files = await w3n.device.openFileDialog(title, null, true);
    for (const file of files) {
      const fileSource = await file.getByteSource();
      const fileInfo: client3N.AttachFileInfo = {
        name: this.checkAttachFileName(file.name, fileList),
        size: await fileSource.getSize(),
        mode: 'toSave',
      };
      toSavePromise.push(messageSyncedFS.saveFileTo3NStorage(
        SYS_MAIL_FOLDERS.draft,
        msgKey,
        fileInfo.name,
        file,
      ));
      result.push(fileInfo);
    }
    await Promise.all(toSavePromise);
    result.forEach(item => item.mode = 'saved');
    return result;
  }

  public async deleteFile(msgKey: string = 'out=new', fileName: string): Promise<void> {
    await messageSyncedFS.deleteFileFrom3NStorage(
      SYS_MAIL_FOLDERS.draft,
      msgKey,
      fileName,
    );
  }

  public async deleteFolder(msgKey: string = 'out=new', folderPath: string = 'attachments'): Promise<void> {
    await messageSyncedFS.deleteFolderFrom3NStorage(
      `${SYS_MAIL_FOLDERS.draft}/${msgKey}`,
      folderPath,
    );
  }

  async saveFileToExternalFS(msgKey: string, fileName: string): Promise<void> {
    messageSyncedFS.downloadFileFromAttach(msgKey, fileName)
      .then(res => {
        if (res) {
          this.Notification.success({message: 'The file is saved!'});
        }
      })
      .catch(() => {
        this.Notification.error({message: 'Error writing file!'});
      });
  }

  async saveAttachments(msgKey: string): Promise<void> {
    messageSyncedFS.downloadAllAttachments(msgKey)
      .then(res => {
        if (res) {
          this.Notification.success({message: 'Attachments is saved!'});
        }
      })
      .catch(() => {
        this.Notification.error({message: 'Error writing attachments!'});
      });
  }

  async copyAttachments(
    sourceMsgKey: string,
    targetMsgKey: string,
    targetFolderId: string,
  ): Promise<void> {
    const sourceFolderId = appMailState.values.messageList[sourceMsgKey].folderId;
    if (sourceFolderId === SYS_MAIL_FOLDERS.inbox) {
      const msgId = appMailState.values.messageList[sourceMsgKey].msgId;
      const inboxMsg = await w3n.mail.inbox.getMsg(msgId);
      const inboxAttachFolder = await inboxMsg.attachments.readonlySubRoot('');
      await messageSyncedFS.saveAttachmentsFolderToFS(
        inboxAttachFolder,
        `${targetFolderId}/out=new/attachments`,
      );
    } else {
      await messageSyncedFS.copyFolder(
        `${sourceFolderId}/${sourceMsgKey}/attachments`,
        `${targetFolderId}/out=new/attachments`,
      );
    }
  }

  /**
   * функция изменения имени присоединяемого файла
   * (при условии наличия присоединенного файла с таким же именем)
   * @param fileName {string} - имя присоединяемого файла
   * @param attached {client3N.AttachFileInfo[]} - список присоединенных файлов
   * @returns newFileName {string}
   */
  private checkAttachFileName(fileName: string, attached: client3N.AttachFileInfo[]): string {
    let newFileName = fileName;
    let isEnd = false;
    while (!isEnd) {
      const isPresent = attached.some(item => item.name === newFileName);
      if (!isPresent) {
        isEnd = true;
      } else {
        const position = newFileName.lastIndexOf('.');
        let _fileName: string = null; //tslint:disable-line
        let _fileExt: string = null; //tslint:disable-line
        if (position !== -1) {
          _fileName = newFileName.substring(0, position);
          _fileExt = newFileName.substr(position + 1);
        } else {
          _fileName = newFileName;
        }
        if (!/\(\d+\)/.test(newFileName)) {
          _fileName = _fileName + '(1)' + (!!_fileExt ? `.${_fileExt}` : '');
        } else {
          const pos = _fileName.lastIndexOf('(');
          let val = parseInt(_fileName.substring(pos + 1, _fileName.length - 1), 10);
          val += 1;
          const _fileNamePart = _fileName.substring(0, pos + 1); //tslint:disable-line
          _fileName = _fileNamePart + val + ')' + (!!_fileExt ? `.${_fileExt}` : '');
        }
        newFileName = _fileName;
      }
    }
    return newFileName;
  }

}
