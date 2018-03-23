/*
 Copyright (C) 2017 - 2018 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. 
*/

import { Observable, Subscription, Subject } from 'rxjs';
import { saveFilesTo, SavingProgress, StatsEntry, statFiles }
	from './file-saving';
import { saveFoldersTo, statFolders } from './folder-saving';
import { concatWithDelayedStart, completionAsObservable } from '../../common/libs/utils-for-observables';
import { logError } from '../../common/libs/logging';

type WritableFS = web3n.files.WritableFS;
type ReadonlyFile = web3n.files.ReadonlyFile;
type ReadonlyFS = web3n.files.ReadonlyFS;

export interface CollectedStats {
	numOfFiles: number;
	numOfFolders: number;
	size: number;
}

export interface SavingTask {
	dst: {
		placeId: string;
		path: string;
		fs: WritableFS;
	};
	srcs: Src[];
}

export interface Src {
	placeId: string;
	path: string;
	isFile?: boolean;
	isFolder?: boolean;
	item: ReadonlyFile|ReadonlyFS;
}

export class SavingProcess {

	private constructor(
		public dst: SavingTask['dst'],
		public srcs: SavingTask['srcs']
	) {
		this.assembleStatAndSaving();
		this.proc = this.completion$
		.subscribe(
			undefined,
			e => {
				if ((e as web3n.files.FileException).type !== 'file') {
					logError(`Error in file saving process: `, e);
				}
			})
	}

	static start(task: SavingTask): SavingProcess {
		return new SavingProcess(task.dst, task.srcs);
	}

	private statBroadcast = new Subject<StatsEntry>();
	stat$ = this.statBroadcast.asObservable().share();

	private savingBroadcast = new Subject<SavingProgress>();
	saving$ = this.savingBroadcast.asObservable().share();
	
	completion$: Observable<void>;

	collectedStats = {
		expected: makeCollectedStats(),
		saved: makeCollectedStats()
	};

	private proc: Subscription|undefined;
	
	private assembleStatAndSaving(): void {
		const statProc$: Observable<StatsEntry>[] = [];
		const savingProc$: Observable<SavingProgress>[] = [];

		const srcFiles = this.srcs
		.map(src => (src.isFile ? src.item as ReadonlyFile : undefined))
		.filter(f => !!f);
		if (srcFiles.length > 0) {
			savingProc$.push(saveFilesTo(this.dst.fs, this.dst.path, srcFiles));
			statProc$.push(statFiles(srcFiles));
		}

		const srcFolders = this.srcs
		.map(src => (src.isFolder ? src.item as ReadonlyFS : undefined))
		.filter(f => !!f);
		if (srcFolders.length > 0) {
			savingProc$.push(saveFoldersTo(this.dst.fs, this.dst.path, srcFolders));
			statProc$.push(statFolders(srcFolders));
		}

		const stat$ = concatWithDelayedStart(...statProc$)
		.do(itemStat => {
			const expected = this.collectedStats.expected;
			if (itemStat.isFile) {
				expected.numOfFiles += 1;
				expected.size += itemStat.size;
			} else if (itemStat.isFolder) {
				expected.numOfFolders += 1;
			}
		})
		.do(this.statBroadcast);

		const fileSizes = new Map<string, number>();
		const saving$ = concatWithDelayedStart(...savingProc$)
		.do(itemProgress => {
			const expected = this.collectedStats.expected;
			const saved = this.collectedStats.saved;
			if (itemProgress.isFile) {
				if (itemProgress.done) {
					saved.numOfFiles += 1;
				}
				if (typeof itemProgress.bytesSaved === 'number') {
					const prevSize = fileSizes.get(itemProgress.name);
					const delta = ((prevSize === undefined) ?
						itemProgress.bytesSaved :
						(itemProgress.bytesSaved - prevSize));
					fileSizes.set(itemProgress.name, itemProgress.bytesSaved);
					saved.size += delta;
				}
			} else if (itemProgress.isFolder) {
				saved.numOfFolders += 1;
			}
		})
		.do(this.savingBroadcast);

		this.completion$ = completionAsObservable(
			concatWithDelayedStart(stat$, saving$)).shareReplay();
	}

	async cancel(): Promise<void> {
		if (!this.proc) { return; }
		this.proc.unsubscribe();

		// XXX remove objects that have already been written

		this.proc = undefined as any;
		this.statBroadcast.error('canceling');
		this.savingBroadcast.error('canceling');
	}

}

export function makeCollectedStats(): CollectedStats {
	return {
		numOfFiles: 0,
		numOfFolders: 0,
		size: 0
	};
}