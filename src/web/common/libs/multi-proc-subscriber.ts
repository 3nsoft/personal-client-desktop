/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. */

import { Observable, Subscription } from 'rxjs';

/**
 * This allows to subscribe to different observables, with an ability to
 * unsubscribe from all simultaneously.
 * Note that an internal subscriptions container is auto-cleaned, when
 * observable completes itself.
 */
export class MultiProcSubscriber {

	private procSubs = new Set<Subscription>();

	/**
	 * This method unsubscribes from all currently active subscriptions.
	 */
	unsubscribeAll(): void {
		for (const sub of this.procSubs) {
			sub.unsubscribe();
		}
		this.procSubs.clear();
	}

	/**
	 * This method subscribes to a given observable, returning usual
	 * subscription.
	 * @param obs 
	 */
	subscribeTo(obs: Observable<any>): Subscription {
		const sub = obs.subscribe();
		this.procSubs.add(sub);
		sub.add(() => this.procSubs.delete(sub));
		return sub;
	}
}