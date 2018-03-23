/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. 
*/

import * as storageSrv from '../common/storage-srv';
import * as openedFolder from '../storage-opened-folder/storage-opened-folder';
import * as folderList from '../storage-folder-list/storage-folder-list';

export const ModuleName = '3nClient.components.storage-app';

export class Controller {

	static $inject = [ '$stateParams' ];
	constructor(
		$stateParams: storageSrv.FolderParams,
	) {
		const placeId = $stateParams.placeId;
		const location = decodeURIComponent($stateParams.location);
		this.currentFolder = { placeId, location };
	}

	currentFolder: storageSrv.FolderParams;

}

const componentConfig: angular.IComponentOptions = {
	bindings: {},
	templateUrl: './templates/storage/storage-app/storage-app.html',
	controller: Controller
 };
 
export function addComponent(angular: angular.IAngularStatic): void {
	const module = angular.module(ModuleName, [
		storageSrv.ModuleName,
		openedFolder.ModuleName,
		folderList.ModuleName,
	]);
	module.component('storageApp', componentConfig);
	storageSrv.addService(angular);
	openedFolder.addComponent(angular);
	folderList.addComponent(angular);
}
