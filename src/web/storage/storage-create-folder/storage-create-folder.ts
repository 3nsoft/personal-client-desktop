/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. 
*/

export const ModuleName = '3nClient.components.storage-create-folder';

class Controller {

	isSectionOpen = false;
	newFolderName: string|undefined = undefined;

	toggle(): void {
		this.isSectionOpen = !this.isSectionOpen;
	}

	private makeFn: (folderName: string) => Promise<void>;

	makeFolder(): void {
		if (this.newFolderName === undefined) { return; }
		this.makeFn(this.newFolderName);
		this.newFolderName = undefined;
		this.toggle();
	}

}

const componentConfig: angular.IComponentOptions = {
	bindings: { makeFn: '<' },
	templateUrl: './templates/storage/storage-create-folder/storage-create-folder.html',
	controller: Controller
 };
 
export function addComponent(angular: angular.IAngularStatic): void {
	const module = angular.module(ModuleName, []);
	module.component('storageCreateFolder', componentConfig);
}
	