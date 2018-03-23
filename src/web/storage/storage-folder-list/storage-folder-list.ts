/*
 Copyright (C) 2018 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. 
*/

import * as storageSrv from '../common/storage-srv';
import { storagePlace } from '../common/places';
import { logError } from '../../common/libs/logging';

export const ModuleName = '3nClient.components.storage-folder-list';

class Controller {

	static $inject = [ '$state', '$stateParams', '$timeout', storageSrv.StorageSrvName ];
	constructor(
		private $state: angular.ui.IStateService,
		$stateParams: storageSrv.FolderParams,
		private $timeout: angular.ITimeoutService,
		private store: storageSrv.StorageSrv
	) {
		this.setOpened($stateParams);
	}

	list = angular.copy(mainFolders);

	opened: Folder|undefined;

	private setOpened($stateParams: storageSrv.FolderParams): void {
		const placeId = $stateParams.placeId;
		const path = decodeURIComponent($stateParams.location);
		this.opened = this.list.find(
			f => ((f.placeId === placeId) && f.path === path));
	}

	open(f: Folder): void {
		this.$state.go('root.storage', {
			placeId: f.placeId,
			location: encodeURIComponent(f.path),
		});
	}

}

interface Folder {
	name: string;
	placeId: string;
	path: string;
}

const mainFolders: Folder[] = [
	{
		name: 'Home Synced',
		placeId: storagePlace.userSynced,
		path: '/',
	},
	{
		name: 'Home on Device',
		placeId: storagePlace.userDevice,
		path: '/',
	},
	{
		name: 'System',
		placeId: storagePlace.system,
		path: '/',
	},
];

export const defaultFolder = mainFolders[0];

const componentConfig: angular.IComponentOptions = {
	bindings: {},
	templateUrl: './templates/storage/storage-folder-list/storage-folder-list.html',
	controller: Controller,
 };
 
export function addComponent(angular: angular.IAngularStatic): void {
	const module = angular.module(ModuleName, [
		storageSrv.ModuleName
	]);
	module.component('storageFolderList', componentConfig);
}
