/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. 
*/

import { ContentItem, Controller as Parent, dataTransferTypes, TransferJSON } from '../storage-opened-folder/storage-opened-folder';
import { DragAspect, DropAspect, Draggable, Droppable } from '../common/drag-n-drop';

export const ModuleName = '3nClient.components.storage-fs-folder';

class Controller implements Draggable, Droppable {

	static $inject = [ '$element', '$timeout' ];
	constructor(
		$element: JQuery,
		private $timeout: angular.ITimeoutService,
	) {
		this.drag = new DragAspect($element, this);
		this.drop = new DropAspect($element, this, e => this.mustReactToDrag(e));
	}

	private drag: DragAspect;
	private drop: DropAspect;

	$onDestroy(): void {
		this.drag.onDestroy();
		this.drop.onDestroy();
	}
	
	onDragStart(e: DragEvent): void {
		e.dataTransfer.effectAllowed = 'copyMove';
		e.dataTransfer.setData(
			dataTransferTypes.w3nFS,
			this.parent.childTransferData(this.folder));
	}

	private mustReactToDrag(e: DragEvent): boolean {
		if (this.drag.isDragged) { return false; }
		return (e.dataTransfer.types.includes(dataTransferTypes.w3nFS) ||
			e.dataTransfer.types.includes(dataTransferTypes.files));
	}

	onDragChange(v: boolean): void {
		this.$timeout(() => {
			this.dragOver = v;
		});
	}

	onDragOver(e: DragEvent): void {
		e.stopPropagation();		
		if (e.dataTransfer.types.includes(dataTransferTypes.files)) {
			e.dataTransfer.dropEffect = 'copy';
		} else if (e.dataTransfer.types.includes(dataTransferTypes.w3nFS)) {
			e.dataTransfer.dropEffect = 'move';
		}
	}

	onDrop(e: DragEvent): void {
		e.stopPropagation();
		if (e.dataTransfer.types.includes(dataTransferTypes.files)) {
			this.parent.saveFromDevice(e.dataTransfer.files, this.folder);
		} else if (e.dataTransfer.types.includes(dataTransferTypes.w3nFS)) {
			const str = e.dataTransfer.getData(dataTransferTypes.w3nFS);
			const src: TransferJSON = JSON.parse(str);
			this.parent.moveOrCopy(src, this.folder);
		}
	}

	dragOver: boolean;

	folder: ContentItem;

	parent: Parent;

	open(): void {
		this.parent.openChildFolder(this.folder);
	}

	delete(): void {
		this.parent.delete(this.folder);
	}

}

const componentConfig: angular.IComponentOptions = {
	bindings: {
		folder: '<',
		parent: '<'
	},
	templateUrl: './templates/storage/storage-fs-folder/storage-fs-folder.html',
	controller: Controller,
 };
 
export function addComponent(angular: angular.IAngularStatic): void {
	const module = angular.module(ModuleName, []);
	module.component('storageFsFolder', componentConfig);
}
