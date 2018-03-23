/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. 
*/

import { SavingProcess, CollectedStats, makeCollectedStats } from '../../common/saving-process';
import { Observable, Subscription } from 'rxjs';
import { logError } from '../../../common/libs/logging';

declare const savingProc: Promise<SavingProcess>;

export const ModuleName = '3nClient.applet.storage.saving';

class Controller {

	static $inject = [ '$timeout' ];
	constructor(
		private $timeout: angular.ITimeoutService
	) {
		
		this.displayProc = Observable.fromPromise(savingProc)
		.flatMap(sp => this.addAndStartDisplay(sp))
		.subscribe(
			undefined,
			err => logError(`Error in displaying saving processes`, err),
			() => w3n.closeSelf());

	}

	private displayProc: Subscription;

	$onDestroy(): void {
		this.displayProc.unsubscribe();
	}

	addAndStartDisplay(sp: SavingProcess): Observable<void> {
		this.dstPath = sp.dst.path;
		this.expected = makeCollectedStats();
		this.saved = makeCollectedStats();
		this.percentageSaved = 0;

		let expectedSet = false;
		const stat$ = sp.stat$
		.map(itemStat => {
			this.$timeout(() => {
				this.expected = angular.copy(sp.collectedStats.expected);
				expectedSet = true;
			});
		});

		const saving$ = sp.saving$
		.map(itemProgress => {
			this.$timeout(() => {
				if (!expectedSet) {
					this.expected = angular.copy(sp.collectedStats.expected);
					expectedSet = true;
				}
				this.saved = angular.copy(sp.collectedStats.saved);
				this.percentageSaved = Math.floor(
					100*(this.saved.size / this.expected.size));
			});
		});

		const sp$ = stat$
		.merge(saving$)
		.catch(err => {
			if ((err as web3n.files.FileException).type === 'file') {
				console.error(`File related exception occured during saving a file`, err);
				return [];
			} else {
				throw err;
			}
		});

		return sp$;
	}

	dstPath: string;
	expected: CollectedStats;
	saved: CollectedStats;
	percentageSaved: number;

}

interface SavingProcessDisplay {
	dstPath: string;
	expected: CollectedStats;
	saved: CollectedStats;
	percentageSaved: number;
}

function deleteFromArray<T>(arr: T[], item: T): void {
	const ind = arr.indexOf(item);
	if (ind < 0) { return; }
	arr.splice(ind, 1);
}

const componentConfig: angular.IComponentOptions = {
	bindings: {},
	templateUrl: '/templates/storage/saving-applet/saving-display/saving-display.html',
	controller: Controller,
 };
 
export function addComponent(angular: angular.IAngularStatic): void {
	const module = angular.module(ModuleName, []);
	module.component('savingDisplay', componentConfig);
}
