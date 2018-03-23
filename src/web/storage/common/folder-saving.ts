/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. 
*/

import { Observable, Observer, Subject, Subscription } from 'rxjs';
import { makePipe, SavingProgress, StatsEntry } from './file-saving';
import { toTriggerableObservable, TriggerableObservable, processLazily } from '../../common/libs/utils-for-observables';

type ReadonlyFS = web3n.files.ReadonlyFS;
type WritableFS = web3n.files.WritableFS;
type ListingEntry = web3n.files.ListingEntry;

/**
 * This function does a deep recursive controlled listing. It returns an
 * observable, which events contain both listing item, and an optional next
 * function.
 * Next function triggers continuation of a listing process, till following
 * event with another next function. If triggering is not done, process doesn't
 * flow any further. When next's are called in operators, unsubscription will
 * effectively stop calls and the whole deep listing, which can be heavy.
 * @param fs 
 * @param folderPath 
 * @param emitFolder is an optional flag, which true value indicates that a
 * listing entry for listed folder should also be emitted. Default value is
 * false.
 */
function deepListFolder(fs: ReadonlyFS, folderPath: string, emitFolder = false):
		Observable<{ fsItem: ListingEntry; next: () => void; }> {
	return Observable.from([ undefined ])
	.flatMap(() => fs.listFolder(folderPath))
	.map(items => ({
		tob: toTriggerableObservable(items.sort(orderFilesFirst)),
		numOfItems: items.length
	}))
	.flatMap(({ tob, numOfItems }) => Observable.create(obs => {
		const next = tob.next;
		const f$ = tob.item$
		.do(f => {
			f.name = `${folderPath}/${f.name}`;
		})
		.share();

		const file$ = f$
		.filter(f => f.isFile)
		.map(f => ({ fsItem: f, next }));

		const folder$ = f$
		.filter(f => f.isFolder)
		.flatMap(fsItem => deepListFolder(fs, fsItem.name, true)
			.do(undefined, undefined, next));

		const combined$ = file$.merge(folder$);

		let sub: Subscription;
		if (emitFolder) {
			const fsItem: ListingEntry = {
				name: folderPath,
				isFolder: true
			};
			sub = combined$.startWith({ fsItem, next })
			.subscribe(obs);
		} else {
			sub = combined$.subscribe(obs);
			next();
		}
		return () => sub.unsubscribe();
	}));
}

function orderFilesFirst(a: ListingEntry, b: ListingEntry): number {
	if (a.isFile && !b.isFile) { return -1; }
	if (!a.isFile && b.isFile) { return 1; }
	return 0;
}

/**
 * This function does a deep stat-ing of folder. It returns an observable with
 * stats entries for each encounted file and folder.
 * @param fs 
 * @param folderPath 
 */
function statFolder(fs: ReadonlyFS, folderPath: string):
		Observable<StatsEntry> {
	return deepListFolder(fs, folderPath)
	.flatMap(async ({ fsItem, next }) => {
		if (fsItem.isFile) {
			const fStat = await fs.statFile(fsItem.name);
			(fsItem as StatsEntry).size = fStat.size;
			next();
			return fsItem;
		} else if (fsItem.isFolder) {
			setTimeout(next);
			return fsItem;
		} else {
			return;
		}
	})
	.filter(ev => !!ev);
}

function saveFile(srcFS: ReadonlyFS, srcPath: string,
		dstFS: WritableFS, dstPath: string): Observable<number> {
	return Observable.from([ undefined ])
	.flatMap(async () => {
		const src = await srcFS.getByteSource(srcPath);
		const sink = await dstFS.getByteSink(dstPath, true, true);
		return makePipe(src, sink);
	})
	.flatMap(obs => obs);
}

function saveFolder(srcFS: ReadonlyFS, srcPath: string,
		dstFS: WritableFS, dstPath: string): Observable<SavingProgress> {
	return deepListFolder(srcFS, srcPath)
	.flatMap(({ fsItem, next }) => {
		if (fsItem.isFile) {
			const newFile = `${dstPath}/${fsItem.name}`;
			return saveFile(srcFS, fsItem.name, dstFS, newFile)
			.do(undefined, undefined, next)
			.map(bytesSaved => {
				const p: SavingProgress = fsItem;
				p.bytesSaved = bytesSaved;
				return p;
			});
		} else if (fsItem.isFolder) {
			const newFolder = `${dstPath}/${fsItem.name}`;
			return Observable.fromPromise(dstFS.makeFolder(newFolder))
			.map(() => {
				next();
				return fsItem as SavingProgress;
			});
		} else {
			return;
		}
	})
	.filter(ev => !!ev);
}

export function saveFoldersTo(dstFS: WritableFS, dstPath: string,
		srcFolders: ReadonlyFS[]): Observable<SavingProgress> {
	return processLazily(srcFolders, srcFolder => {
		const newFolder = `${dstPath}/${srcFolder.name}`;
		return saveFolder(srcFolder, '', dstFS, newFolder);
	});
}

export function statFolders(folders: ReadonlyFS[]): Observable<StatsEntry> {
	return processLazily(folders, folder => statFolder(folder, ''));
}
