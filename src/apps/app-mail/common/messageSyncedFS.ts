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

import { SingleProc } from '../../../common/services/processes';
import { addFileTo, addFolderTo } from '../../../common/lib/attachments-container';
import { logError } from '../../../common/services/libs/logging';
import { APPS, SYS_MAIL_FOLDERS } from '../../../common/const';
import { whatIsIt } from '../../common/helpers';
import { appMailState } from '../common/app-mail-store';

export class MessageSyncedFS {
  private initializing: Promise<void>|undefined;
  private changeProc: SingleProc|undefined = new SingleProc();
  private fs: web3n.files.WritableFS = null;
  private valueToSave: any|undefined;

  constructor() {
    const fsName = APPS.find(app => app.name === 'Mail').fsName;
    this.initializing = w3n.storage.getAppSyncedFS(fsName)
      .then(fs => {
        this.fs = fs;
        this.initializing = undefined;
      });
  }

  /**
   * функция записи файла в 3N storage
   * @param folderId {string}
   * @param msgKey {string}
   * @param fileName {string}
   * @param file {web3n.files.File}
   * @param asLink? {boolean}
   * @return {Promise<void>}
   */
  public async saveFileTo3NStorage(
    folderId: string,
    msgKey: string,
    fileName: string,
    file: web3n.files.File,
    asLink?: boolean,
  ): Promise<void> {
    if (this.initializing) { await this.initializing; }
    if (!this.changeProc) {
      throw new Error(`Save file ${fileName} is already finished.`);
    }

    this.valueToSave = file;
    return this.changeProc.startOrChain(async () => {
      if (this.valueToSave !== file) { return; }
      const path = `${folderId}/${msgKey}/attachments/${fileName}`;
      if (asLink) {
        await this.fs.link(path, file);
      } else {
        console.log(path);
        await this.fs.saveFile(file, path, true);
      }
    }).catch(err => logError(`Error occured when saving link to file ${fileName}`, err));
  }

  /**
   * удаление файла из 3N storage
   * @param folderId {string}
   * @param msgKey {string}
   * @param fileName {string}
   * @return {Promise<boolean>}
   */
  public async deleteFileFrom3NStorage(folderId: string, msgKey: string, fileName: string): Promise<void> {
    if (this.initializing) { await this.initializing; }
    const folderPath = `${folderId}/${msgKey}/attachments`;
    const essenceType = await whatIsIt(this.fs, folderPath, fileName);
    try {
      switch (essenceType) {
        case 'folder':
          await this.fs.deleteFolder(`${folderPath}/${fileName}`, true);
          break;
        case 'file':
          await this.fs.deleteFile(`${folderPath}/${fileName}`);
          break;
        case 'link':
          return await this.fs.deleteLink(`${folderPath}/${fileName}`);
      }
    } catch (err) {
      logError(`Error occured when deleting file ${fileName}`, err);
    }
  }

  /**
   * удаление папки собщения
   * @param parentFolderName {string}
   * @param deletedFolderName {string}
   * @return {Promise<void>}
   */
  public async deleteFolderFrom3NStorage(
    parentFolderName: string,
    deletedFolderName: string,
  ): Promise<void> {
    if (this.initializing) { await this.initializing; }
    const folderFullPath = `${parentFolderName}/${deletedFolderName}`;
    console.log(folderFullPath);
    const essenceType = await whatIsIt(this.fs, parentFolderName, deletedFolderName);
    if (essenceType === 'folder') {
      console.log('This is folder');
      await this.fs.deleteFolder(folderFullPath, true)
        .catch(async (err: client3N.FileException) => {
          if (err.notFound) {
            return;
          } else {
            logError(`Error occured when deleting folder ${parentFolderName}/${deletedFolderName}`, err);
          }
        });
    }
  }

  /**
   * "приведение" содержимого папки attachments в соответствие с
   * информацией в message.attached
   * @param folderId
   * @param msgKey
   * @param currentAttachmentState
   */
  public async attachmentStateAlignment(
    folderId: string,
    msgKey: string,
    currentAttachmentState: client3N.AttachFileInfo[],
  ): Promise<void|void[]> {
    if (this.initializing) { await this.initializing; }
    if (currentAttachmentState.length === 0) {
      return await this.deleteFolderFrom3NStorage(
        `${folderId}/${msgKey}`,
        'attachments',
      );
    } else {
      const fullPath = `${folderId}/${msgKey}/attachments`;
      const deleteProm: Promise<void>[] = [];
      const essenceList = await (this.fs as web3n.files.ReadonlyFS).listFolder(fullPath);
      for (const essence of essenceList) {
        const isEssencePresentInAttachment = currentAttachmentState
          .find((attachFileInfo: client3N.AttachFileInfo) => {
            return attachFileInfo.name === essence.name;
          });

        if (
          !isEssencePresentInAttachment &&
          (essence.isFile || essence.isLink) &&
          essence.name[0] !== '.'
        ) {
          if (essence.isFile) {
            deleteProm.push(
              this.fs.deleteFile(`${fullPath}/${essence.name}`),
            );
          } else {
            deleteProm.push(
              this.fs.deleteLink(`${fullPath}/${essence.name}`),
            );
          }
        }

      }
      return Promise.all(deleteProm);
    }
  }

  /**
   * переименование/перемещение папки сообщения
   * @param folderFullPathFrom {string}
   * @param folderFullPathTo {string}
   * @return {Promise<void>}
   */
  public async renameFolder(folderFullPathFrom: string, folderFullPathTo: string): Promise<void> {
    if (this.initializing) { await this.initializing; }
    const pathFrom = folderFullPathFrom.split('/');
    const essenceType = await whatIsIt(
      this.fs,
      pathFrom.slice(0, -1).join('/'),
      pathFrom.slice(-1)[0],
    );
    if (essenceType === 'folder') {
      await this.fs.move(folderFullPathFrom, folderFullPathTo)
        .catch(err => logError(`Error occured when rename folder ${folderFullPathFrom} to ${folderFullPathTo}`, err));
    }
  }

  /**
   * копирование папки сообщения
   * @param folderFullPathFrom {string}
   * @param folderFullPathTo {string}
   * @return {Promise<void>}
   */
  public async copyFolder(folderFullPathFrom: string, folderFullPathTo: string): Promise<void> {
    if (this.initializing) { await this.initializing; }
    const pathFrom = folderFullPathFrom.split('/');
    const essenceType = await whatIsIt(
      this.fs,
      pathFrom.slice(0, -1).join('/'),
      pathFrom.slice(-1)[0],
    );
    if (essenceType === 'folder') {
      await this.fs.copyFolder(folderFullPathFrom, folderFullPathTo)
        .catch(err => logError(`Error occured when copy folder ${folderFullPathFrom} to ${folderFullPathTo}`, err));
    }
  }

  /**
   *
   * @param sourceAttachFs
   * @param folderFullPathTo
   */
  public async saveAttachmentsFolderToFS(
    sourceAttachFs: web3n.files.ReadonlyFS,
    folderFullPathTo: string,
  ): Promise<void> {
    if (this.initializing) { await this.initializing; }
    await this.fs.saveFolder(sourceAttachFs, folderFullPathTo);
  }

  /**
   * функция сохранения приатаченного файла в файловую систему устройства
   * @param msgKey {string}
   * @param fileName {string}
   * @return {Promise<void>}
   */
  async downloadFileFromAttach(msgKey: string, fileName: string): Promise<boolean> {
    if (this.initializing) { await this.initializing; }

    const folderId = appMailState.values.messageList[msgKey].folderId;
    let srcFile: web3n.files.File;

    if (folderId !== SYS_MAIL_FOLDERS.inbox) {
      const essenceType = await whatIsIt(this.fs, `${folderId}/${msgKey}/attachments`, fileName);
      switch (essenceType) {
        case 'file':
          srcFile = await this.fs.readonlyFile(`${folderId}/${msgKey}/attachments/${fileName}`)
            .catch(async (exc: web3n.files.FileException) => {
              if (exc.notFound) {
                logError(`File ${folderId}/${msgKey}/attachments/${fileName} not found`);
              } else {
                logError(exc);
              }
              throw exc;
            });
          break;
        case 'link':
          const symLink = await this.fs.readLink(`${folderId}/${msgKey}/attachments/${fileName}`);
          srcFile = (await symLink.target()) as web3n.files.File;
          break;
      }
    } else {
      const msgId = appMailState.values.messageList[msgKey].msgId;
      const inboxMsg = await w3n.mail.inbox.getMsg(msgId);
      srcFile = await inboxMsg.attachments.readonlyFile(fileName)
        .catch(async (exc: web3n.files.FileException) => {
          logError(exc);
          throw exc;
        });
    }

    const title = 'Save file';
    const outFile = await w3n.device.saveFileDialog(title, null, fileName);
    if (outFile) {
      await outFile.copy(srcFile)
        .catch(err => {
          logError(err);
        });
      return true;
    }
    return false;
  }

  async downloadAllAttachments(msgKey: string): Promise<boolean> {
    if (this.initializing) { await this.initializing; }
    const folderId = appMailState.values.messageList[msgKey].folderId;
    let srcFolder: web3n.files.ReadonlyFS;
    if (folderId !== SYS_MAIL_FOLDERS.inbox) {
      const attachmentPath = `${folderId}/${msgKey}/attachments/`;
      srcFolder = await this.fs.readonlySubRoot(attachmentPath);
    } else {
      const msgId = appMailState.values.messageList[msgKey].msgId;
      const inboxMsg = await w3n.mail.inbox.getMsg(msgId);
      srcFolder = inboxMsg.attachments;
    }

    const title = 'Save attachments';
    const outFolder = await w3n.device.saveFolderDialog(title, null, msgKey);
    if (outFolder) {
      await outFolder.saveFolder(srcFolder, 'attachments')
        .catch(err => {
          logError(err);
        });
      return true;
    }
    return false;
  }

  /**
   * запись данных сообщения в syncedFS
   */
  public async saveJsonDataToFS<T>(folderId: string, msgKey: string, fileName: string, data: T): Promise<void> {
    if (this.initializing) { await this.initializing; }
    const fullPath = `${folderId}/${msgKey}/${fileName}`;
    if (!this.changeProc) {
      throw new Error(`Save file ${fullPath} is already finished.`);
    }
    this.valueToSave = data;
    return this.changeProc.startOrChain(async () => {
      if (this.valueToSave !== data) { return; }
      await this.fs.writeJSONFile(fullPath, data);
    })
      .catch(err => logError(`Error occured when saving link to file ${fullPath}`, err));
  }

  /**
   * чтение данных сообщения из syncedFS
   */
  public async readJsonDataFromFS<T>(folderId: string, msgKey: string, fileName: string = 'data.json'): Promise<T> {
    if (this.initializing) { await this.initializing; }
    const fullPath = `${folderId}/${msgKey}/${fileName}`;
    return await this.fs.readJSONFile<T>(fullPath)
      .catch((exc: client3N.FileException) => {
        logError(`Error occured when reading file ${fullPath} from localFS`, exc);
        return null;
      });
  }

  /*
  public async prepareAttachmentsContainer(
    msgKey: string,
    attached: client3N.AttachFileInfo[],
  ): Promise<web3n.asmail.AttachmentsContainer> {
    if (this.initializing) { await this.initializing; }
    const container = {} as web3n.asmail.AttachmentsContainer;
    const path = `${SYS_MAIL_FOLDERS.outbox}/${msgKey}/attachments`;
    for (let attach of attached) {
      const essenceType = await whatIsIt(this.fs, path, attach.name);
      let srcFile: web3n.files.File;
      switch (essenceType) {
        case 'file':
          srcFile = await this.fs.readonlyFile(`${path}/${attach.name}`);
          break;
        case 'link':
          const srcLink = await this.fs.readLink(`${path}/${attach.name}`);
          srcFile = (await srcLink.target()) as web3n.files.File;
          break;
      }
      addFileTo(container, srcFile, attach.name);
    }
    return container;
  }
  */

  public async prepareAttachmentsContainer(
    msgKey: string,
    attached: client3N.AttachFileInfo[],
  ): Promise<web3n.asmail.AttachmentsContainer> {
    if (this.initializing) { await this.initializing; }
    const container = {} as web3n.asmail.AttachmentsContainer;
    const path = `${SYS_MAIL_FOLDERS.outbox}/${msgKey}/attachments`;
    for (const attach of attached) {
      const attachmentPath = `${path}/${attach.name}`;
      const stats = await this.fs.stat(attachmentPath)
        .catch(exc => {
          console.error(`Attachment ${attach.name} can't be looked at `, exc);
        });
      if (!stats) { continue; }
      if (stats.isFile) {
        const srcFile = await this.fs.readonlyFile(attachmentPath);
        addFileTo(container, srcFile, attach.name);
      } else if (stats.isFolder) {
        const srcFolder = await this.fs.readonlySubRoot(attachmentPath);
        addFolderTo(container, srcFolder, attach.name);
      } else if (stats.isLink) {
        const srcLink = await this.fs.readLink(attachmentPath);
        const src = await srcLink.target();
        if ((src as web3n.files.FS).listFolder) {
          addFolderTo(container, src as web3n.files.FS, attach.name);
        } else {
          addFileTo(container, src as web3n.files.File, attach.name);
        }
      } else {
        console.error(`Unknown fs type of entity at ${attachmentPath} `, stats);
      }
    }
    return container;

  }

}
