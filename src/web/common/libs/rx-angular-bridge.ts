/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. */

import { Subject, Observable } from 'rxjs';

export interface FunctionWithStream<T> {
	(...args: any[]): void;
	event$: Observable<T>;
}

export function funcCallToEventSource<T>(eventGenerator: (...args: any[]) => T):
		FunctionWithStream<T> {
	const subj = new Subject<T>();
	const wrap = ((...args: any[]): void => {
		const event = eventGenerator(args);
		subj.next(event);
	}) as FunctionWithStream<T>;
	wrap.event$ = subj.asObservable().share();
	return wrap;
}

export function funcCallToProcessedEventSource<X, T>(
		eventGenerator: (...args: any[]) => X,
		eventProcessing: (x$: Observable<X>) => Observable<T>):
		FunctionWithStream<T> {
	const subj = new Subject<X>();
	const wrap = ((...args: any[]): void => {
		const event = eventGenerator(args);
		subj.next(event);
	}) as FunctionWithStream<T>;
	wrap.event$ = eventProcessing(subj.asObservable()).share();
	return wrap;
}

export function watchToEventSource<T>($scope: angular.IScope,
		watchExpression: string): Observable<T> {
	const subj = new Subject<T>();
	$scope.$watch(watchExpression, (newVal: T) => subj.next(newVal));
	return subj.asObservable().share();
}
