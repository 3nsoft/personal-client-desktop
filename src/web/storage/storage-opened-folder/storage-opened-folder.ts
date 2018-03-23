/*
 Copyright (C) 2017 - 2018 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. 
*/

import { StorageSrvName, StorageSrv, ModuleName as ServiceModName,
	FolderParams } from '../common/storage-srv';
import * as createFolderComponent from '../storage-create-folder/storage-create-folder';
import * as folderComponent from '../storage-fs-folder/storage-fs-folder';
import * as fileComponent from '../storage-fs-file/storage-fs-file';
import { DropAspect, Droppable } from '../common/drag-n-drop';
import { concatWithDelayedStart } from '../../common/libs/utils-for-observables';
import { storagePlace } from '../common/places';
import { defaultFolder } from '../storage-folder-list/storage-folder-list';
import { Subscription, Observable } from 'rxjs';

export const ModuleName = '3nClient.components.storage-opened-folder';

export class Controller implements Droppable {

	static $inject = [ '$state', '$element', '$timeout', StorageSrvName ];
	constructor(
		private $state: angular.ui.IStateService,
		$element: JQuery,
		private $timeout: angular.ITimeoutService,
		private store: StorageSrv
	) {
		this.drop = new DropAspect($element, this, this.mustReactToDrag);
	}

	private drop: DropAspect;

	$onDestroy(): void {
		this.drop.onDestroy();
		this.changesWatchingProc.unsubscribe();
	}

	$onInit(): void {
		this.changesWatchingProc = Observable.fromPromise(
			this.store.watchFolder(this.folder.placeId, this.folder.location))
		.flatMap(o => o)
		.subscribe(
			() => this.listAndDisplayThisFolder(),
			err => console.error(err));
		this.listAndDisplayThisFolder();
	}

	private changesWatchingProc: Subscription;

	private async listAndDisplayThisFolder(): Promise<void> {
		try {
			const { containerType, lst } = await this.store.list(
				this.folder.placeId, this.folder.location)
			const items = lst
			.filter(item => !item.name.startsWith('.'))
			.map(listingEntryToContentItem);
			items.sort(composeOrdering(foldersFirst, byName));
			this.$timeout(() => {
				this.items = items;
				this.containerType = containerType;
			});
		} catch (e) {
			const err = e as web3n.files.FileException;
			if ((err.type === 'file') && err.notFound) {
				// XXX instead of opening a default place, we may iteratively try
				// to open parent, before going to default
				this.$state.go('root.storage', {
					placeId: defaultFolder.placeId,
					location: encodeURIComponent(defaultFolder.path)
				});
			} else {
				throw err;
			}
		} 
	}

	folder: FolderParams;

	containerType: 'fs' | 'collection';

	items: ContentItem[];

	dragOver: boolean;

	private mustReactToDrag = (e: DragEvent): boolean => {
		return ((this.containerType === 'fs') &&
			e.dataTransfer.types.includes(dataTransferTypes.files) &&
			!e.dataTransfer.types.includes(dataTransferTypes.w3nFS));
	}

	onDragChange(v: boolean): void {
		this.$timeout(() => {
			this.dragOver = v;
		});
	}

	onDragOver(e: DragEvent): void {
		e.dataTransfer.dropEffect = 'copy';
	}

	onDrop(e: DragEvent): void {
		this.saveFromDevice(e.dataTransfer.files);
	}

	async saveFromDevice(fLst: FileList, child?: ContentItem): Promise<void> {
		const srcs = await this.store.deviceFileListToSrcObjects(fLst);
		const dstFolder = (child ? this.childPath(child) : this.folder.location);
		this.store.startSave(storagePlace.device, srcs,
			this.folder.placeId, dstFolder);
	}
	
	openChildFolder(folder: ContentItem): void {
		if (!folder.isFolder) { return; }
		this.openFolder(this.childPath(folder));
	}

	openChildFile(file: ContentItem): void {
		if (!file.isFile) { return; }
		const filePath = `${this.folder.location}/${file.name}`;
		this.store.openFile(this.folder.placeId, filePath);
	}

	private childPath(child: ContentItem): string {
		return ((this.folder.location === '/') ?
			`/${child.name}` : `${this.folder.location}/${child.name}`);
	}

	private openFolder(path: string): void {
		this.$state.go('root.storage', {
			placeId: this.folder.placeId,
			location: encodeURIComponent(path)
		});
	}

	makeFolder = async (folderName: string): Promise<void> => {
		const path = `${this.folder.location}/${folderName}`;
		await this.store.makeFolder(this.folder.placeId, path);
		this.listAndDisplayThisFolder();
	}

	get hasParent(): boolean {
		const locArr = this.folder.location
		.split('/')
		.filter(str => (str.length > 0));
		return (locArr.length > 0);
	}

	openParentFolder(): void {
		const parentPath = extractFolderPath(this.folder.location);
		if (!parentPath) { return; }
		this.openFolder(parentPath);
	}

	childTransferData(child: ContentItem): string {
		const d: TransferJSON = {
			placeId: this.folder.placeId,
			path: this.childPath(child)
		};
		return JSON.stringify(d);
	}

	moveOrCopy(src: TransferJSON, child?: ContentItem): void {
		const name = extractFileName(src.path);
		const dst = (child ? this.childPath(child) : this.folder.location)
		.split('/')
		.concat(name)
		.join('/');
		this.store.moveOrStartCopy(src.placeId, src.path, this.folder.placeId, dst);
	}

	async delete(child: ContentItem): Promise<void> {
		const cPath = this.childPath(child);
		if (child.isFile) {
			await this.store.deleteFile(this.folder.placeId, cPath);
		} else if (child.isFolder) {
			await this.store.deleteFolder(this.folder.placeId, cPath);
		} else if (child.isLink) {
			await this.store.deleteLink(this.folder.placeId, cPath);
		}
		this.listAndDisplayThisFolder();
	}

}

function extractFileName(path: string): string {
	const pathArr = path.split('/');
	return pathArr[pathArr.length-1];
}

function extractFolderPath(path: string): string|undefined {
	const pathArr = path
	.split('/')
	.filter(str => (str.length > 0));
	if (pathArr.length === 0) { return; }
	let folderPath = pathArr
	.slice(0, pathArr.length-1)
	.join('/');
	if (!folderPath.startsWith('/')) {
		folderPath = `/${folderPath}`;
	}
	return folderPath;
}

export const dataTransferTypes = {
	w3nFS: 'w3n/fs',
	files: 'Files'
};
Object.freeze(dataTransferTypes);

export interface TransferJSON {
	placeId: string;
	path: string;
}

export interface ContentItem extends web3n.files.ListingEntry {}

function listingEntryToContentItem(entry: web3n.files.ListingEntry):
		ContentItem {
	const item = angular.copy(entry) as ContentItem;
	return item;
}

function composeOrdering<T>(...orderFns: ((a: T, b: T) => number)[]):
		((a: T, b: T) => number) {
	return (a: T, b: T): number => {
		for (let i=0; i<orderFns.length; i+=1) {
			const order = orderFns[i](a, b);
			if (order !== 0) { return order; }
		}
		return 0;
	};
}

function foldersFirst(a: ContentItem, b: ContentItem): number {
	if (a.isFolder && !b.isFolder) { return -1; }
	if (!a.isFolder && b.isFolder) { return 1; }
	return 0;
}

function byName(a: ContentItem, b: ContentItem): number {
	if (a.name < b.name) { return -1; }
	if (a.name > b.name) { return 1; }
	return 0;
}

const componentConfig: angular.IComponentOptions = {
	bindings: {
		folder: '<'
	},
	templateUrl: './templates/storage/storage-opened-folder/storage-opened-folder.html',
	controller: Controller
 };
 
export function addComponent(angular: angular.IAngularStatic): void {
	const module = angular.module(ModuleName, [
		ServiceModName,
		createFolderComponent.ModuleName,
		folderComponent.ModuleName,
		fileComponent.ModuleName
	]);
	module.component('storageOpenedFolder', componentConfig);
	createFolderComponent.addComponent(angular);
	folderComponent.addComponent(angular);
	fileComponent.addComponent(angular);
}
