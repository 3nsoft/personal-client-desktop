/*
 Copyright (C) 2017 - 2018 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. 
*/

import * as CONST from '../../common/services/const';
import { Observable, Subscription, Subject } from 'rxjs';
import { saveFilesTo, SavingProgress, StatsEntry, statFiles }
	from './file-saving';
import { saveFoldersTo, statFolders } from './folder-saving';
import { concatWithDelayedStart, completionAsObservable } from '../../common/libs/utils-for-observables';
import { ObservableSet } from '../../common/libs/observable-set';
import { logError } from '../../common/libs/logging';
import { Places, makeNotFoundException, storagePlace } from './places';
import { SavingProcess, SavingTask, Src } from './saving-process';

export let ModuleName = "3nClient.services.storage"
export let StorageSrvName = "storageService"

export function addService(angular: angular.IAngularStatic): void {
	const module = angular.module(ModuleName, []);
	module.service(StorageSrvName, StorageSrv);
}

type WritableFS = web3n.files.WritableFS;
type ReadonlyFile = web3n.files.ReadonlyFile;
type ReadonlyFS = web3n.files.ReadonlyFS;
type ListingEntry = web3n.files.ListingEntry;
type FolderEvent = web3n.files.FolderEvent;
type SelectCriteria = web3n.files.SelectCriteria;

export interface FolderParams {
	placeId: string;
	location: string;
}

export class StorageSrv {

	private initialization: Promise<void>|undefined = undefined;
	private storageAppFS: WritableFS;

	private places = new Places();
	
	static $inject = [];
	constructor() {
		this.initialization = w3n.storage.getAppLocalFS(CONST.FS_USED.STORAGE)
		.then(localFS => { this.storageAppFS = localFS; })
		.then(() => { this.initialization = undefined; });
	}

	list(placeId: string, path: string):
			Promise<{ containerType: 'fs' | 'collection'; lst: ListingEntry[]; }> {
		return this.places.listItemsIn(placeId, path);
	}

	watchFolder(placeId: string, path: string):
			Promise<Observable<FolderEvent>> {
		return this.places.watchFolder(placeId, path);
	}

	async makeFolder(placeId: string, path: string): Promise<void> {
		const { root, pathInRoot } =
			await this.places.getRootFSFor(placeId, path);
		return root.makeFolder(pathInRoot);
	}

	async select(placeId: string, path: string, criteria: SelectCriteria) {
		const { root, pathInRoot } =
			await this.places.getRootFSFor(placeId, path);
		return root.select(pathInRoot, criteria);
	}

	async deleteFile(placeId: string, path: string): Promise<void> {
		const { root, pathInRoot } =
			await this.places.getRootFSFor(placeId, path);
		return root.deleteFile(pathInRoot);
	}

	async deleteFolder(placeId: string, path: string): Promise<void> {
		const { root, pathInRoot } =
			await this.places.getRootFSFor(placeId, path);
		return root.deleteFolder(pathInRoot, true);
	}

	async deleteLink(placeId: string, path: string): Promise<void> {
		const { root, pathInRoot } = await this.places.getRootFSFor(placeId, path);
		return root.deleteLink(pathInRoot);
	}

	// XXX moveOrCopy should take few src paths, like copy does.

	async moveOrStartCopy(srcPlaceId: string, srcPath: string,
			dstPlaceId: string, dstPath:string): Promise<void>  {
		const { root: srcFS, pathInRoot: pathInSrc } =
			await this.places.getRootFSFor(srcPlaceId, srcPath);
		const { root: fs, pathInRoot: pathInDst } =
			await this.places.getRootFSFor(dstPlaceId, dstPath);

		if (srcFS === fs) {
			return srcFS.move(pathInSrc, pathInDst);
		}
	
		const srcs = await this.pathsToSrcObjects(srcPlaceId, [ srcPath ]);

		this.openSaveWindow({
			dst: {
				placeId: dstPlaceId,
				path: dstPath,
				fs
			},
			srcs
		});
	}

	private async openSaveWindow(task: SavingTask): Promise<void> {
		let childWindow: web3n.ui.ChildWindow|undefined = undefined;
		childWindow = await w3n.openChildWindow(
			'/', './saving-applet/index.html', {
				width: 500,
				height: 100,
			}, true);
		childWindow.rpc.registerLocal(task, {
			name: 'savingTask',
			fields: 'all-jnc',
		});
	}

	async startSave(srcPlaceId: string, srcs: Src[],
			dstPlaceId: string, dstPath: string): Promise<void> {
		if (srcs.length === 0) { throw new Error(`Given no source objects`); }
		const { root: fs, pathInRoot: pathInDst } =
			await this.places.getRootFSFor(dstPlaceId, dstPath);
		await fs.checkFolderPresence(pathInDst, true);

		this.openSaveWindow({
			dst: {
				placeId: dstPlaceId,
				path: dstPath,
				fs
			},
			srcs
		});
	}

	// XXX viewer cap should be replaced with open in 3n app and/or os'.
	async openFileViewer(placeId: string, path: string): Promise<void> {
		const { root, pathInRoot } =
			await this.places.getRootFSFor(placeId, path);
		return w3n.openViewer(root, pathInRoot, 'file');
	}

	async openFile(placeId: string, path: string): Promise<void> {
		const { root, pathInRoot } =
			await this.places.getRootFSFor(placeId, path);
		await w3n.openWithOSApp(root, pathInRoot);
	}

	private async pathsToSrcObjects(placeId: string, paths: string[]):
			Promise<Src[]> {
		const getSrcs = paths.map(async path => {
			const { root: srcFS, pathInRoot: pathInSrc } =
				await this.places.getRootFSFor(placeId, path);
			let src: Src;
			if (await srcFS.checkFilePresence(pathInSrc, false)) {
				src = {
					placeId, path,
					isFile: true,
					item: await srcFS.readonlyFile(pathInSrc),
				};
			} else if (await srcFS.checkFolderPresence(pathInSrc, false)) {
				src =  {
					placeId, path,
					isFolder: true,
					item: await srcFS.readonlySubRoot(pathInSrc),
				};
			} else if (await srcFS.checkLinkPresence(pathInSrc)) {
				// XXX implement link copying
				throw new Error(`Copying link is not implemented`);
			} else {
				console.error(`Cannot find path "${path}" in storage ${JSON.stringify(placeId)}`);
				return;
			}
			return src;
		});
		return (await Promise.all(getSrcs)).filter(o => !!o);
	}

	deviceFileListToSrcObjects(fLst: FileList): Promise<Src[]> {
		const paths: string[] = [];
		for (let i=0; i<fLst.length; i+=1) {
			const f = fLst[i];
			const path = (f as any).path;
			if ((typeof path === 'string') && (path.length > 0)) {
				paths.push(path);
			} else {
				console.error(`File object for ${f.name} doesn't have a path field, expected in electron`);
			}
		}
		return this.pathsToSrcObjects(storagePlace.device, paths);
	}

}
