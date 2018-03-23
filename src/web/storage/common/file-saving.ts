/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. 
*/

import { Observable, Subject } from 'rxjs';
import { toTriggerableObservable, processLazily } from '../../common/libs/utils-for-observables';

type ReadonlyFile = web3n.files.ReadonlyFile;
type WritableFS = web3n.files.WritableFS;
type ListingEntry = web3n.files.ListingEntry;

export interface StatsEntry extends ListingEntry {
	size?: number;
}

export interface SavingProgress extends StatsEntry {
	bytesSaved?: number;
	done?: boolean;
}

type ByteSource = web3n.ByteSource;
type ByteSink = web3n.ByteSink;

const READ_SIZE = 512*1024;

export function makePipe(src: ByteSource, sink: ByteSink): Observable<number> {
	const trigger = new Subject<void>();
	let bytesPiped = 0;
	return trigger.asObservable()
	.startWith(undefined)
	.flatMap(() => src.read(READ_SIZE), 1)
	.flatMap(async chunk => {
		if (chunk) {
			await sink.write(chunk);
			if (chunk.length < READ_SIZE) {
				trigger.complete();
			} else {
				trigger.next();
			}
			return chunk.length;
		} else {
			trigger.complete();
			return 0;
		}
	}, 1)
	.do(undefined,
		err => {
			sink.write(null, err);
			sink = undefined as any;
		},
		() => {
			sink.write(null);
			sink = undefined as any;
		})
	.finally(() => {
		if (sink) {	// occurs on unsubscription
			sink.write(null, new Error(`Canceling byte's piping`));
		}
	})
	.map(delta => {
		bytesPiped += delta;
		return bytesPiped;
	});
}

export function saveFilesTo(dstFS: WritableFS, dstPath: string,
		srcFiles: ReadonlyFile[]): Observable<SavingProgress> {
	return processLazily(srcFiles, srcFile => {

		const p: SavingProgress = {
			name: srcFile.name,
			isFile: true,
		};
	
		const progress$ = Observable.from([ undefined ])
		.flatMap(async () => {
			const src = await srcFile.getByteSource();
			const sink = await dstFS.getByteSink(
				`${dstPath}/${srcFile.name}`, true, true);
			return makePipe(src, sink);
		})
		.flatMap(obs => obs)
		.map(bytesSaved => {
			p.bytesSaved = bytesSaved;
			return p;
		})
		.share();
	
		const completion$ = progress$
		.takeLast(1)
		.do(p => {
			p.done = true;
		});
	
		return progress$.merge(completion$);
	});
}

export function statFiles(files: ReadonlyFile[]): Observable<StatsEntry> {
	return processLazily(files, file =>
		Observable.fromPromise(file.stat())
		.map(fileStats => ({
			name: file.name,
			isFile: true,
			size: fileStats.size
		})));
}
