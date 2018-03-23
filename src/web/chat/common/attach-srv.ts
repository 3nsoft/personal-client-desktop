/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>.
*/

import { Chats } from './chats'
import { logError } from '../../common/libs/logging';

/**
   * функция изменения имени присоединяемого файла
   * (при условии наличия присоединенного файла с таким же именем)
   * @param fileName {string} - имя присоединяемого файла
   * @param attached {client3N.AttachFileInfo[]} - список присоединенных файлов
   * @returns newFileName {string}
   */
	export function checkAttachFileName(fileName: string, attached: client3N.AttachFileInfo[]): string {
		let newFileName = fileName
		let isEnd = false
		while (!isEnd) {
			let isPresent = false
			for (let item of attached) {
				isPresent = (item.name === newFileName) ? true : isPresent
			}
			if (!isPresent) {
				isEnd = true
			} else {
				const position = newFileName.lastIndexOf('.')
				let _fileName: string = null
				let _fileExt: string = null
				if (position !== -1) {
					_fileName = newFileName.substring(0, position)
					_fileExt = newFileName.substr(position + 1)
				} else {
					_fileName = newFileName
				}
				if (!/\(\d+\)/.test(newFileName)) {
					_fileName = _fileName + '(1)' + (!!_fileExt ? `.${_fileExt}` : '')
				} else {
					const pos = _fileName.lastIndexOf('(')
					let val = parseInt(_fileName.substring(pos + 1, _fileName.length - 1))
					val += 1
					let _fileNamePart = _fileName.substring(0, pos + 1)
					_fileName = _fileNamePart + val + ')' + (!!_fileExt ? `.${_fileExt}` : '')
				}
				newFileName = _fileName
			}
		}
		return newFileName
	}

export async function loadFilesFromExternalFS(): Promise<{attachments: web3n.files.ReadonlyFile[], attached: client3N.AttachFileInfo[]}> {
  const result = {
    attachments: <web3n.files.ReadonlyFile[]>[],
    attached: <client3N.AttachFileInfo[]>[]
  }
  const title = 'Select file(s):'
  result.attachments = await w3n.device.openFileDialog(title, null, true)
  if (!!result.attachments) {
		for (let file of result.attachments) {
			const fileSource = await file.getByteSource()
			const fileInfo: client3N.AttachFileInfo = {
        name: checkAttachFileName(file.name, result.attached),
        size: await fileSource.getSize(),
        mode: 'not_saved'
			}
			result.attached.push(fileInfo)
		}
  } else {
    result.attachments = []
  }
  return result
}

export async function saveFileToExternalFS(chatId: string, msgId: string, isOut: boolean, fileName: string): Promise<boolean> {
	let file: web3n.files.ReadonlyFile = null
	if (isOut) {
		const chats = new Chats()
		try {
			file = await chats.readLinkLocally(chatId, fileName)
		} catch (err) {
			logError(err)
			file = null
		}
	} else {
		const inMsg = await w3n.mail.inbox.getMsg(msgId)
		try {
			file = await inMsg.attachments.readonlyFile(fileName)
		} catch (err) {
			logError(err)
			file = null
		}
	}

	if (file) {
		const outFile = await w3n.device.saveFileDialog('Save file', null, fileName)
		if (outFile) {
			try {
				await outFile.copy(file)
				return true
			} catch (err) {
				logError(err)
				return false
			}
		}
	}
}
