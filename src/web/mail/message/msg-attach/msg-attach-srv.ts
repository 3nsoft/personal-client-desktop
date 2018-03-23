/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. */

import * as CONST from '../../../common/services/const';
import * as LIB from '../../../common/services/lib-internal';
import * as CacheSrvMod from '../../../common/services/cache-srv';
import * as CommonSrvMod from '../../../common/services/common-srv';
import { logError } from '../../../common/libs/logging';

export let ModuleName = "3nClinet.services.msg-attach-srv";
export let MsgAttachSrvName = "msgAttachService";

export function addService(angular: angular.IAngularStatic): void {
  let mod = angular.module(ModuleName, []);
  mod.service(MsgAttachSrvName, Srv);
}

export class Srv {
	private fs: web3n.files.WritableFS = null;
	private initializing: Promise<void> = null;

	static $inject = ['$rootScope', CacheSrvMod.CacheSrvName, CommonSrvMod.CommonSrvName];
	constructor(
		private $rootScope: angular.IRootScopeService,
		private _cacheSrv: CacheSrvMod.Cache,
		private _commonSrv: CommonSrvMod.Srv
	) {
		this.initializing = w3n.storage.getAppLocalFS(`${CONST.FS_USED.MAIL}`).then((fs) => { this.fs = fs; this.initializing = null; });
	}

	/**
	 * чтение приаттаченных к сообщению файлов
	 * @param msgId {string}
	 * @param attached {client3N.AttachFileInfo[]}
	 * @returns {Promise<web3n.files.File[]>}
	 */
	async readMsgAttachedFiles(msgId: string, attached: client3N.AttachFileInfo[]): Promise<web3n.files.File[]> {
		if (msgId === 'new') return [];
		if (this.initializing) { await this.initializing; }
		let result: web3n.files.File[] = [];

		const msgKey = this._cacheSrv.messages.list[msgId].msgKey;
		const msgFolder = this._cacheSrv.messages.list[msgId].folderId;
		if (msgFolder !== CONST.SYS_MAIL_FOLDERS.inbox) {
			for (let item of attached) {
				const fileName = item.name;
				const filePath = `${msgFolder}/${msgKey}/attachments`;
				let srcFile = await this.getFileFromFS(this.fs, filePath, fileName);
				result.push(srcFile);
			}
		} else {
			const incomingMsg = await w3n.mail.inbox.getMsg(msgId);
			if ('attachments' in incomingMsg) {
				const objList = await incomingMsg.attachments.listFolder('');
				for (let attachedItem of attached) {
					if (this.isThereSuchObject(attachedItem.name, objList)) {
						let srcFile = await this.getFileFromFS(incomingMsg.attachments, '', attachedItem.name);
						result.push(srcFile);
					}
				}
			}
		}

		return result;		
	}

	private isThereSuchObject(objName: string, objList: web3n.files.ListingEntry[]): boolean {
		for (let obj of objList) {
			if (obj.name === objName) {
				return true;
			}
		}
		return false;
	}

	private async getFileFromFS(fs: web3n.files.FS, filePath: string, fileName: string): Promise<web3n.files.File> {
		const essenceType = await LIB.whatIsIt(fs, filePath, fileName);
		let srcFile: web3n.files.File;
		switch (essenceType) {
			case 'file':
				srcFile = await fs.readonlyFile(`${filePath}/${fileName}`);
				break;
			case 'link':
				const srcLink = await fs.readLink(`${filePath}/${fileName}`);
				srcFile = (await srcLink.target()) as web3n.files.File;
				break;
		}
		return srcFile;
	}

	/**
	 * приаттачивание файлов к сообщению
	 * @param attached {client3N.AttachFileInfo[]}
	 * @return {Promise<{attachments: web3n.files.ReadonlyFile[], attached: client3N.AttachFileInfo[]}
	 */
	async loadFilesFromExternalFS(attached: client3N.AttachFileInfo[]): Promise<{ attachments: web3n.files.ReadonlyFile[], attached: client3N.AttachFileInfo[] }> {
		let result = {
			attachments: <web3n.files.ReadonlyFile[]>[],
			attached: attached || <client3N.AttachFileInfo[]>[]
		};
		const title = 'Select file(s):';
		result.attachments = await w3n.device.openFileDialog(title, null, true);
		console.log(result.attachments);
		
		if (!!result.attachments) {
			for (let file of result.attachments) {
				const fileSource = await file.getByteSource();
				const fileInfo: client3N.AttachFileInfo = {
					name: this.checkAttachFileName(file.name, attached),
					size: await fileSource.getSize(),
					mode: 'not_saved'
				};
				result.attached.push(fileInfo);
			}
		} else {
			result.attachments = [];
		}

		return result;
	}
	
	/**
	 * функция сохранения приатаченного файла в файловую систему устройства
	 * @param msgId {string}
	 * @param fileName {string}
	 * @return {Promise<void>}
	 */
	async saveFileToExternalFS(msgId: string, fileName: string): Promise<void> {
		if (this.initializing) { await this.initializing; }

		const folderId = this._cacheSrv.messages.list[msgId].folderId;
		const msgKey = this._cacheSrv.messages.list[msgId].msgKey;
		let srcFile: web3n.files.File;
		
		if (folderId !== CONST.SYS_MAIL_FOLDERS.inbox) {
			const essenceType = await LIB.whatIsIt(this.fs, `${folderId}/${msgKey}/attachments`, fileName);
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
			const inboxMsg = await w3n.mail.inbox.getMsg(msgId);
			srcFile = await inboxMsg.attachments.readonlyFile(fileName)
				.catch(async (exc: web3n.files.FileException) => {
					logError(exc);
					throw exc;
				});
		}

		const title = 'Save file';
		const outFile = await w3n.device.saveFileDialog(title, null, fileName);
		if (!!outFile) {
			await outFile.copy(srcFile)
				.catch(err => {
					logError(err);
					this._commonSrv.sysNotification('error', null, 'Error writing file!');
				})
			this._commonSrv.sysNotification('success', null, 'The file is saved!');
		}
	}

	/**
	 * функция записи файла в 3NStorage
	 * @param folderId {string}
	 * @param msgKey {string}
	 * @param fileName {string}
	 * @param file {web3n.files.File}
	 * @returns {Promise<void>}
	 */
	async saveFileTo3NStorage(folderId: string, msgKey: string, fileName: string, file: web3n.files.File): Promise<void> {
		if (this.initializing) { await this.initializing; }

		const path = `${folderId}/${msgKey}/attachments/${fileName}`;
		const fileStat: web3n.files.FileStats = await file.stat();
		const fileSize = fileStat.size;

		if (fileSize <= CONST.SETTINGS.fileMaxSize) {
			await this.fs.saveFile(file, path);
		} else {
			await this.fs.link(path, file);
		}
	}

	/**
	 * функция удаления файла из 3NStorage
	 * @param folderId {string}
	 * @param mskKey {string}
	 * @param fileName {string}
	 * @returns {Promise<boolean>}
	 */
	async deleteFileFrom3NStorage(folderId: string, msgKey: string, fileName: string): Promise<boolean> {
		if (this.initializing) { await this.initializing; }

		const folderPath = `${folderId}/${msgKey}/attachments`;
		const essenceType = await LIB.whatIsIt(this.fs, folderPath, fileName);
		switch (essenceType) {
			case 'folder':
				await this.fs.deleteFolder(`${folderPath}/${fileName}`);
				return true;
			case 'file':
				await this.fs.deleteFile(`${folderPath}/${fileName}`);
				return true;
			case 'link':
				await this.fs.deleteLink(`${folderPath}/${fileName}`);
				return true;
			default:
				return false;
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
			let isPresent = false;
			for (let item of attached) {
				isPresent = (item.name === newFileName) ? true : isPresent;
			}
			if (!isPresent) {
				isEnd = true;
			} else {
				const position = newFileName.lastIndexOf('.');
				let _fileName: string = null;
				let _fileExt: string = null;
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
					let val = parseInt(_fileName.substring(pos + 1, _fileName.length - 1));
					val += 1;
					let _fileNamePart = _fileName.substring(0, pos + 1);
					_fileName = _fileNamePart + val + ')' + (!!_fileExt ? `.${_fileExt}` : '');;
				}
				newFileName = angular.copy(_fileName);
			}
		}
		return newFileName;
	}
	

}
