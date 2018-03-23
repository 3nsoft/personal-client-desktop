/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. 
*/

import { Subject, Observable } from 'rxjs';

export interface ChangeInSet<T> {
	type: 'added' | 'deleted' | 'cleared';
	item?: T;
}

export class ObservableSet<T> {

	private items = new Set<T>();
	private changesBroadcast = new Subject<ChangeInSet<T>>();

	change$: Observable<ChangeInSet<T>>;

	constructor() {
		this.change$ = this.changesBroadcast.asObservable().share();
		this[Symbol.iterator] = this.items[Symbol.iterator].bind(this.items);
	}

	add(item: T): ObservableSet<T> {
		this.items.add(item);
		this.changesBroadcast.next({ type: 'added', item });
		return this;
	}

	delete(item: T): boolean {
		const deleted = this.items.delete(item);
		if (deleted) {
			this.changesBroadcast.next({ type: 'deleted', item });
		}
		return deleted;
	}

	clear(): void {
		this.items.clear();
		this.changesBroadcast.next({ type: 'cleared' });
	}

	has(item: T): boolean {
		return this.items.has(item);
	}

	values(): IterableIterator<T> {
		return this.items.values();
	}

	get size(): number {
		return this.items.size;
	}

}