/*
 Copyright (C) 2016 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. */
 
import * as Transform from "../../common/services/transform";
import * as Constants from "../../common/services/const-srv";

export let ModulName = "3nweb.services.attach-block-srv";
export let AttachBlockSrvName = "attachBlockService";

export function addService(angular: angular.IAngularStatic): void {
  let mod = angular.module(ModulName, []);
  mod.service(AttachBlockSrvName, Srv);
}

export class Srv {
  fs: web3n.storage.FS = null;
  private initializing: Promise<void> = null;
  
  static $inject = [];
  constructor(
    ) {
    this.initializing = w3n.storage.getAppLocalFS("computer.3nweb.mail").then((fs) => { this.fs = fs; this.initializing = null; });
  }
  
  /**
   * функция изменения имени присоединяемого файла
   * (при условии наличия присоединенного файла с таким же именем)
   * @params fileName {string} - имя присоединяемого файла
   * @params attachedFile {{name: string, size: number, mode: string}[]} -
   * список присоединенных файлов
   * @returt newFileName {string}
   */
  checkAttachFileName(fileName: string, attachedFile: {name: string, size: number, mode: string}[]): string {
    let newFileName = fileName;
    let isEnd = false;
    while (!isEnd) {
      let isPresent = false;
      for (let item of attachedFile) {
        isPresent = (item.name === newFileName) ? true : isPresent;
      }
      if(!isPresent) {
        isEnd = true;
      } else {
        let position = newFileName.lastIndexOf(".");
        let _fileName = newFileName.substring(0, position);
        let _fileExt = newFileName.substr(position + 1);
        if (!/\(\d+\)/.test(newFileName)) {
          _fileName = _fileName + "(1)." + _fileExt;
        } else {
          let pos = _fileName.lastIndexOf("(");
          let val = parseInt(_fileName.substring(pos + 1, _fileName.length -1));
          val += 1;
          let _fileNamePart = _fileName.substring(0, pos + 1);
          _fileName = _fileNamePart + val + ")." + _fileExt;
        }
        newFileName = angular.copy(_fileName);
      }
    }
    return newFileName;
  };

  /**
   * функция записи файлы в 3N Storage
   * @params file {Web3N.Files.File}
   * @params params {{folderId: string, msgKey: string, fileName: string}}
   * @return fileSize {Promise<number>} - размер записанного файла байтах
   */
    async saveFileToStorage(file: web3n.files.File, params: {folderId: string, msgKey: string, fileName: string}): Promise<void> {
      // let folderPath = params.folderId + "/" + params.msgKey + "/attachments";
      let path = params.folderId + "/" + params.msgKey + "/attachments/" + params.fileName;
      // let source = await file.getByteSource();

      // if (!(await this.fs.checkFolderPresence(folderPath))) {
      //   this.fs.makeFolder(folderPath);
      // }

      // let sink = await this.fs.getByteSink(path);
      // await Transform.pipe(source, sink);
      await this.fs.saveFile(file, path);
    };

  /**
   * функция удаления приаттаченного файла из storage
   * @params params {{folderId: number, msgKey: string, fileName: string, fileSize: number}}
   * @return {Promise<boolean>}
   */
  async deleteFileFromStorage(params: {folderId: string, msgKey: string, fileName: string}): Promise<boolean> {
    if (this.initializing) { await this.initializing; }
    let folderPath = params.folderId + "/" + params.msgKey + "/attachments";
    let path = folderPath + "/" + params.fileName;
    let listFiles = await this.fs.listFolder(folderPath);
    let isPresent = false;
    for (let item of listFiles) {
      isPresent = ((params.fileName === item.name) && (item.isFile)) ? true : isPresent;
    }
    if (isPresent) {
      await this.fs.deleteFile(path);
      return true;
    } else {
      return false;
    }
  };

  /**
   * функция записи приаттаченного файла в файловую систему устройства
   * @params fileName {string}
   * @params inFilePath {string}
   * @return {Promise<string>}
   */
  async saveFileToFS(fileName: string, inFilePath: string): Promise<string> {
    if (this.initializing) { await this.initializing; }
    // определяем в какой mail folder находится сообщение и его msgId
    let inFilePathParts: string[] = inFilePath.split("/");
    let folderId = inFilePathParts[0];
    let msgId = (inFilePathParts[1].substr(0, 3) === "in=") ? inFilePathParts[1].substr(3) : inFilePathParts[1].substr(4);

    // let source: web3n.ByteSource = null;
    let srcFile: web3n.files.File;

    if (folderId !== Constants.SYS_MAIL_FOLDERS.inbox) {
      // source = await this.fs.getByteSource(inFilePath)
      srcFile = await this.fs.readonlyFile(inFilePath)
        .catch(async function(exc: web3n.files.FileException) {
          if (exc.notFound) { console.error("File " + inFilePath + " not found!");}
          throw exc;
        });
    } else {
      let inboxMsg = await w3n.mail.inbox.getMsg(msgId);
      // source = await inboxMsg.attachments.getByteSource(fileName)
      srcFile = await inboxMsg.attachments.readonlyFile(fileName)
        .catch(async function(exc: web3n.files.FileException) {
          console.error(exc);
          throw exc;
        });
    }

    let title = "Save file:";
    let outFileName = fileName;
    let outFile = await w3n.device.saveFileDialog(title, null, outFileName)
    if (outFile === undefined) {
      return "cancel";
    }
    // let sink = await outFile.getByteSink();
    // await Transform.pipe(source, sink)
    //   .catch((err) => {
    //     console.error(err);
    //     return "error";
    //   })
    await outFile.copy(srcFile);
    return "success";
  };


}