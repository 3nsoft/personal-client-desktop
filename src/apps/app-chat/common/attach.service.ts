/*
 Copyright (C) 2019 3NSoft Inc.

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

import { Chat } from './chat';
import { logError } from '../../../common/lib/logging';

/**
 * функция изменения имени присоединяемого файла
 * (при условии наличия присоединенного файла с таким же именем)
 * @param fileName {string} - имя присоединяемого файла
 * @param attached {client3N.AttachFileInfo[]} - список присоединенных файлов
 * @returns newFileName {string}
 */
export function checkAttachFileName(fileName: string, attached: client3N.AttachFileInfo[]): string {
  let newFileName = fileName;
  let isEnd = false;
  while (!isEnd) {
    const isPresent = !!attached.find(item => item.name === newFileName);
    if (!isPresent) {
      isEnd = true;
    } else {
      const position = newFileName.lastIndexOf('.');
      let fileNameTmp = position !== -1
        ? newFileName.substring(0, position)
        : newFileName;
      const fileExtTmp = position !== -1
        ? `.${newFileName.substr(position + 1)}`
        : '';
      if (!/\(\d+\)/.test(newFileName)) {
        fileNameTmp = `${fileNameTmp}(1)${fileExtTmp}`;
      } else {
        const pos = fileNameTmp.lastIndexOf('(');
        let numeral = parseInt(fileNameTmp.substring(pos + 1, fileNameTmp.length - 1), 10);
        numeral += 1;
        const fileNamePart = fileNameTmp.substring(0, pos + 1);
        fileNameTmp = `${fileNamePart}${numeral})${fileExtTmp}`;
      }
      newFileName = fileNameTmp;
    }
  }
  return newFileName;
}

export async function loadFilesFromExternalFS(): Promise<{attachments: web3n.files.ReadonlyFile[], attached: client3N.AttachFileInfo[]}> {
  const result = {
    attachments: [] as web3n.files.ReadonlyFile[],
    attached: [] as client3N.AttachFileInfo[],
  };
  const title = 'Select file(s):';
  result.attachments = await w3n.device.openFileDialog(title, null, true);
  if (result.attachments) {
    for (const file of result.attachments) {
      const fileSource = await file.getByteSource();
      const fileInfo: client3N.AttachFileInfo = {
        name: checkAttachFileName(file.name, result.attached),
        size: await fileSource.getSize(),
        mode: 'not_saved',
      };
      result.attached.push(fileInfo);
    }
  } else {
    result.attachments = [];
  }
  return result;
}

export async function saveFileToExternalFS(chatId: string, msgId: string, isOut: boolean, fileName: string): Promise<boolean> {
  let file = null as web3n.files.ReadonlyFile;
  if (isOut) {
    const chats = new Chat();
    try {
      file = await chats.readLinkLocally(chatId, fileName);
    } catch (err) {
      logError(err);
      file = null;
    }
  } else {
    const inMsg = await w3n.mail.inbox.getMsg(msgId);
    try {
      file = await inMsg.attachments.readonlyFile(fileName);
    } catch (err) {
      logError(err);
      file = null;
    }
  }

  if (file) {
    const outFile = await w3n.device.saveFileDialog('Save file', null, fileName);
    if (outFile) {
      try {
        await outFile.copy(file);
        return true;
      } catch (err) {
        logError(err);
        return false;
      }
    }
  }
}
