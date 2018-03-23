/*
 Copyright (C) 2018 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. 
*/

import { makeFSCollection, readonlyWrapFSCollection }
	from '../../common/libs/fs-collection';
import { logError } from '../../common/libs/logging';
import { Observable } from 'rxjs';

type FS = web3n.files.FS;
type WritableFS = web3n.files.WritableFS;
type FSCollection = web3n.files.FSCollection;
type FSItem = web3n.files.FSItem;
type ListingEntry = web3n.files.ListingEntry;
type FolderEvent = web3n.files.FolderEvent;

export const storagePlace = {
	device: 'system-device',
	system: 'system',
	userLocal: 'user-local',
	userDevice: 'user-device',
	userSynced: 'user-synced',
};
Object.freeze(storagePlace);

const idToGetterMap = new Map<string, () => Promise<FSItem>>([
	[ storagePlace.userSynced, () => w3n.storage.getUserFS('synced') ],
	[ storagePlace.userLocal, () => w3n.storage.getUserFS('local') ],
	[ storagePlace.userDevice, () => w3n.storage.getUserFS('device') ],
	[ storagePlace.system, makeSystemPlace ],
	[ storagePlace.device, () => w3n.storage.getSysFS('device') ],
]);

async function makeSystemPlace(): Promise<FSItem> {
	const sys = await makeFSCollection();
	sys.set('Local', await w3n.storage.getSysFS('local'));
	sys.set('Synced', await w3n.storage.getSysFS('synced'));
	return {
		isCollection: true,
		item: readonlyWrapFSCollection(sys),
	};
}

export class Places {

	private places = makeFSCollection();
	private initialization: Promise<any>|undefined;

	constructor() {
		this.init();
	}

	private async init(): Promise<void> {
		const setupPlaces: Promise<void>[] = [];
		for (const idAndGetter of idToGetterMap.entries()) {
			const setup = idAndGetter[1]().then(
				f => this.places.set(idAndGetter[0], f),
				logError);
			setupPlaces.push(setup);
		}
		this.initialization = Promise.all(setupPlaces);
		await this.initialization;
		this.initialization = undefined;
	}

	async get(placeId: string): Promise<FSItem> {
		if (this.initialization) { await this.initialization; }
		let place = await this.places.get(placeId);
		if (place) { return place; }
		throw makeNotFoundException('', `Unknown storage place id: ${placeId}`);
	}

	async listItemsIn(placeId: string, path: string):
			Promise<{ containerType: 'fs' | 'collection'; lst: ListingEntry[]; }> {
		const place = await this.get(placeId);
		if (place.isFolder) {
			ensureIsFolder(place.item);
			return {
				containerType: 'fs',
				lst: await (place.item as WritableFS).listFolder(path),
			};
		} else if (place.isCollection) {
			ensureIsCollection(place.item);
			return listCollection(place.item as FSCollection, path);
		} else {
			throw makeNotFoundException(path,
				`Place ${placeId} is neither folder, nor collection`);
		}
	}

	async watchFolder(placeId: string, path: string):
			Promise<Observable<FolderEvent>> {
		const place = await this.get(placeId);
		if (place.isFolder) {
			const f = place.item as WritableFS;
			ensureIsFolder(f);
			return new Observable(obs => f.watchFolder(path, obs));
		} else if (place.isCollection) {
			const c = place.item as FSCollection;
			ensureIsCollection(c);
			// XXX implement watching in collection object
			console.error(`Missing implementation to watch changes in collection`);
			return Observable.from([]);
		} else {
			throw makeNotFoundException(path,
				`Place ${placeId} is neither folder, nor collection`);
		}
	}

	async getRootFSFor(placeId: string, path: string):
			Promise<{ root: WritableFS; pathInRoot: string; }> {
		const place = await this.get(placeId);
		if (place.isFolder) {
			ensureIsFolder(place.item);
			return {
				root: place.item as WritableFS,
				pathInRoot: path,
			};
		} else if (place.isCollection) {
			ensureIsCollection(place.item);
			const { fs, subPath } = await getTopFolderFrom(
				place.item as FSCollection, path);
			return {
				root: fs as WritableFS,
				pathInRoot: subPath,
			};
		} else {
			throw makeNotFoundException(path,
				`Place ${placeId} is neither folder, nor collection`);
		}
	}

}

function ensureIsFolder(x: any): void {
	if (!(x as FS).listFolder) { throw new Error(
		`Given object is not a folder`); }
}

function ensureIsCollection(x: any): void {
	if (!(x as FSCollection).entries) { throw new Error(
		`Given object is not an fs collection`); }
}

async function getTopFolderFrom(root: FSCollection, path: string):
		Promise<{ fs: FS; subPath: string; }> {
	path = stripPrefixSeparator(path);
	const nameAndItem = (await root.getAll())
	.sort(shorterNamesToTail)
	.find(nameAndItem => path.startsWith(nameAndItem[0]));
	if (!nameAndItem) { throw makeNotFoundException(path); }

	const [ name, item ] = nameAndItem;
	let subPath: string;
	if (name.length > 0) {
		subPath = path.substring(name.length);
		if ((subPath.length > 0) && !startsWithSeparator(subPath)) {
			console.error(`Throwing error here`);
			throw makeNotFoundException(path);
		}
		subPath = stripPrefixSeparator(subPath);
	} else {
		subPath = path;
	}

	if (item.isFolder) {
		ensureIsFolder(item.item);
		return { fs: (item.item as FS), subPath };
	} else if (item.isCollection) {
		ensureIsCollection(item.item);
		return getTopFolderFrom(item.item as FSCollection, subPath);
	} else {
		throw makeNotFoundException(path);
	}
}

function startsWithSeparator(path: string): boolean {
	return (path.startsWith('/') || path.startsWith('\\'));
}

function stripPrefixSeparator(path: string): string {
	while (startsWithSeparator(path)) {
		path = path.substring(1);
	}
	return path;
}

function shorterNamesToTail(p1: [ string, FSItem ], p2: [ string, FSItem ]):
		number {
	const a = p1[0].length;
	const b = p2[0].length;
	if (a < b) {
		return -1;
	} else if (a > b) {
		return 1;
	} else {
		return 0;
	}
}

async function listCollection(
		c: FSCollection, path: string, pathArr?: string[]):
		Promise<{ containerType: 'fs' | 'collection'; lst: ListingEntry[]; }> {
	if (!pathArr) {
		pathArr = path.split('/').filter(s => (s.length > 0));
	}

	const name = pathArr.shift();

	if (name === undefined) {
		const lst = (await c.getAll())
		.map(([ name, item ]) => {
			const lstEntry: ListingEntry = {
				name,
				isFile: item.isFile,
				isFolder: (item.isFolder || item.isCollection),
			};
			return lstEntry;
		});
		return { containerType: 'collection', lst };
	}

	const nameAndItem = (await c.getAll())
	.find(([ itemName ]) => (itemName === name));

	if (!nameAndItem) { throw makeNotFoundException(path); }

	const item = nameAndItem[1];
	if (item.isFolder) {
		ensureIsFolder(item.item);
		return {
			containerType: 'fs',
			lst: await (item.item as WritableFS).listFolder(pathArr.join('/')),
		};
	} else if (item.isCollection) {
		ensureIsCollection(item.item);
		return listCollection(item.item as FSCollection, path, pathArr);
	} else {
		throw makeNotFoundException(path,
			`Item ${name} is neither folder, nor collection`);
	}
}

type FileException = web3n.files.FileException;

export function makeNotFoundException(path: string, cause?: any):
		FileException {
	const exc: FileException = {
		runtimeException: true,
		type: 'file',
		code: 'ENOENT',
		path,
		cause,
		notFound: true,
	};
	return exc;
}
