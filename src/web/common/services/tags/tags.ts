/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. */

import * as CacheSrvMod from '../cache-srv';
import * as CommonSrvMod from '../common-srv';
import * as TagsSrvMod from './tag-srv';

export const ModuleName = '3nClient.components.tags';

let thee;
class Controller {
	wantedTag: string = '';
	editableTag: string = '';
	editableTagMode: 'show' | 'edit' = 'show';
	selectedTag: client3N.Tag = null;
	wrapElement: HTMLElement;
	isHandlerActive: boolean = false;

	static $inject = ['$timeout', '$q', CacheSrvMod.CacheSrvName, CommonSrvMod.CommonSrvName, TagsSrvMod.TagsSrvName];
	constructor(
		private $timeout: angular.ITimeoutService,
		private $q: angular.IQService,
		private _cacheSrv: CacheSrvMod.Cache,
		private _commonSrv: CommonSrvMod.Srv,
		private _tagsSrv: TagsSrvMod.Srv
	) {
		thee = this;
		this.$timeout(() => {
			this.wrapElement = (document.querySelector('.md-dialog-container') as HTMLElement);
		});
	}


	/**
	 * определени индекса тэга в массиве
	 * @param tag 
	 */
	private _getTagIndex(tag: client3N.Tag): number {
		let tagIndex: number = null;
		this._cacheSrv.tags.list.forEach((item, index) => {
			if (item.id === tag.id) {
				tagIndex = index;
			}
		});
		return tagIndex;
	}

	preSaveEditTag(event: JQueryKeyEventObject, mode: 'create' | 'edit'): void {
		if (!this.isHandlerActive) {
			this.wrapElement.addEventListener('click', this.onBlur);
			this.isHandlerActive = true;
			this.editableTagMode = 'show';
			console.info('Handler activated');
		}
		const keycode = event.keyCode || event.which;
		const usedField = (mode === 'create') ? 'wantedTag' : 'editableTag';

		switch (keycode) {
			case 13:		
				if (this[usedField].length > 0) {
					this.runSaveTag(mode);
				}
				break;
			case 27:
				this.cancelEditTag(mode);
				break;
		}
	}
	
	runEditTag(tag: client3N.Tag): void {
		this.editableTagMode = 'edit';
		this.selectedTag = angular.copy(tag);
		this.editableTag = angular.copy(this.selectedTag.name);
		// this.editableTagIndex = this._getTagIndex(tag);
		this.$timeout(() => {
			(document.querySelector('input#editingField') as HTMLInputElement).focus();
		});
	}

	runDeleteTag(event: MouseEvent, tag: client3N.Tag): angular.IPromise<void> {
		const tagIndex = this._getTagIndex(tag);
		return this._tagsSrv.deleteTag(event, tagIndex)
			.then((res) => {
				if (res) {
					this.cancelEditTag('edit');
				}
			});
	}

	runSaveTag(mode: 'create' | 'edit'): angular.IPromise<void> {
		const usedField = (mode === 'create') ? 'wantedTag' : 'editableTag';
		switch (mode) {
			case 'create':
				if (this._tagsSrv.checkTagName(this[usedField])) {
					return this._commonSrv.sysNotification('error', null, `Tag with the name ${this[usedField]} already exists! Please enter a different name.`)
		        .then(() => {
		          (document.querySelector('input#entryField') as HTMLInputElement).focus();
		        });
				} else {
					this.$timeout(() => {
						this._cacheSrv.tags.list.push({ id: `${new Date().getTime()}`, name: this[usedField].toLocaleLowerCase(), qt: 0 });
					}).then(() => {
						return this.$q.when(this._tagsSrv.writeTagList());
					}).then(() => {
						this.cancelEditTag('create');
					});
				}
				break;
			case 'edit':
				if (this._tagsSrv.checkTagName(this[usedField])) {
					return this._commonSrv.sysNotification('error', null, `Tag with the name ${this[usedField]} already exists! Please enter a different name.`)
		        .then(() => {
		          (document.querySelector('input#editingField') as HTMLInputElement).focus();
		        });
				} else {
					const tagIndex = this._getTagIndex(this.selectedTag);
					this.$timeout(() => {
						this._cacheSrv.tags.list[tagIndex] = {
							id: angular.copy(this.selectedTag.id),
							name: this[usedField].toLocaleLowerCase(),
							qt: angular.copy(this.selectedTag.qt)
						};
						this.editableTagMode = 'show';
					}).then(() => {
						return this.$q.when(this._tagsSrv.writeTagList());
					}).then(() => {
						this._tagsSrv.renameTagInMessages(this.selectedTag.name, this.editableTag);
						this.cancelEditTag('edit');
					})
				}
				break;
		}
	}

	cancelEditTag(mode: 'create' | 'edit'): void {
		const usedField = (mode === 'create') ? 'wantedTag' : 'editableTag';
		this.$timeout(() => {
			this[usedField] = '';
			if (mode === 'edit') {
				this.editableTagMode = 'show';
				this.selectedTag = null;
			}
		});
	}

	onBlur(event: MouseEvent): void {
		if ((event.target as Element).tagName !== 'NG-MD-ICON') {
			thee.wrapElement.removeEventListener('click', thee.onBlur);
			thee.isHandlerActive = false;
			if (!!thee.wantedTag) {
				thee.cancelEditTag('create');
			} else {
				thee.cancelEditTag('edit');
			}
			console.info('Handler desactivated');
		}
	}

}

const componentConfig: angular.IComponentOptions = {
	bindings: {},
	templateUrl: './templates/common/services/tags/tags.html',
	controller: Controller
};

export function addComponent(angular: angular.IAngularStatic): void {
	const mod = angular.module(ModuleName, []);
	mod.component('tags', componentConfig);
}

Object.freeze(exports);