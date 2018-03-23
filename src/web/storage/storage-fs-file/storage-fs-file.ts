/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. 
*/

import { ContentItem, Controller as Parent, dataTransferTypes } from '../storage-opened-folder/storage-opened-folder';
import { DragAspect, Draggable } from '../common/drag-n-drop';

export const ModuleName = '3nClient.components.storage-fs-file';

class Controller implements Draggable{

	static $inject = [ '$element' ];
	constructor($element: JQuery) {
		this.drag = new DragAspect($element, this);
	}

	$onDestroy(): void {
		this.drag.onDestroy();
	}

	private drag: DragAspect;
	
	onDragStart(e: DragEvent): void {
		e.dataTransfer.effectAllowed = 'copyMove';
		e.dataTransfer.setData(
			dataTransferTypes.w3nFS,
			this.parent.childTransferData(this.file));
	};

	file: ContentItem;

	parent: Parent;

	open(): void {
		this.parent.openChildFile(this.file);
	}

	delete(): void {
		this.parent.delete(this.file);
	}

}

const componentConfig: angular.IComponentOptions = {
	bindings: {
		file: '<',
		parent: '<'
	},
	templateUrl: './templates/storage/storage-fs-file/storage-fs-file.html',
	controller: Controller,
 };
 
export function addComponent(angular: angular.IAngularStatic): void {
	const module = angular.module(ModuleName, []);
	module.component('storageFsFile', componentConfig);
}
