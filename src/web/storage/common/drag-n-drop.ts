/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. 
*/

export class DragAspect {

	isDragged = false;

	constructor(
		private $element: JQuery,
		$ctrl: Draggable
	) {
		this.$element.bind('dragstart', (e: DragEvent) => {
			this.isDragged = true;
			if ($ctrl.onDragStart) {
				$ctrl.onDragStart(e);
			}
		});
		this.$element.bind('dragend', (e: DragEvent) => {
			this.isDragged = false;
			if ($ctrl.onDragEnd) {
				$ctrl.onDragEnd(e);
			}
		});
	}

	onDestroy(): void {
		this.$element.unbind('dragstart');
		this.$element.unbind('dragend');
	}
	
}

export type DragEventHandler = (e: DragEvent) => void;

export interface Draggable {
	onDragStart?: DragEventHandler;
	onDragEnd?: DragEventHandler;
}

export class DropAspect {

	constructor(
		private $element: JQuery,
		private $ctrl: Droppable,
		shouldReactToEvent: (e: DragEvent) => boolean
	) {

		this.$element.bind('dragenter', (e: DragEvent) => {
			if (!shouldReactToEvent(e)) { return; }
			this.setUnderDrag(true);
			if (this.$ctrl.onDragEnter) {
				this.$ctrl.onDragEnter(e);
			}
		});

		this.$element.bind('dragover', (e: DragEvent) => {
			if (!shouldReactToEvent(e)) { return; }
			e.preventDefault(); // allows to drop
			this.setUnderDrag(true);
			if (this.$ctrl.onDragOver) {
				this.$ctrl.onDragOver(e);
			}
		});

		this.$element.bind('dragleave', (e: DragEvent) => {
			if (!shouldReactToEvent(e)) { return; }
			this.setUnderDrag(false);
			if (this.$ctrl.onDragLeave) {
				this.$ctrl.onDragLeave(e);
			}
		});

		this.$element.bind('drop', (e: DragEvent) => {
			if (!shouldReactToEvent(e)) { return; }
			this.setUnderDrag(false);
			e.preventDefault();
			if (this.$ctrl.onDrop) {
				this.$ctrl.onDrop(e);
			}
		});
	}

	isUnderDrag(): boolean {
		return this.underDrag;
	}

	private underDrag = false;

	private setUnderDrag(v: boolean) {
		if (this.underDrag === v) { return; }
		this.underDrag = v;
		if (this.$ctrl.onDragChange) {
			this.$ctrl.onDragChange(this.underDrag);
		}
	}
	
	onDestroy(): void {
		this.$element.unbind('dragenter');
		this.$element.unbind('dragover');
		this.$element.unbind('dragleave');
		this.$element.unbind('drop');
	}

}

export interface Droppable {
	/**
	 * This is a callback, invoked only when value of drag-over (under-drag)
	 * changes.
	 */
	onDragChange?: (underDrag: boolean) => void;
	onDragEnter?: DragEventHandler;
	onDragOver?: DragEventHandler;
	onDragLeave?: DragEventHandler;
	onDrop?: DragEventHandler;
}
