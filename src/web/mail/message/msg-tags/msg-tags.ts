/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. */

import * as CONST from '../../../common/services/const';
import * as LIB from '../../../common/services/lib-internal';
import * as CacheSrvMod from '../../../common/services/cache-srv';
import * as CommonSrvMod from '../../../common/services/common-srv';
import * as MailFsSrvMod from '../../mail-app/mail-fs-srv';
import * as TagSrvMod from '../../../common/services/tags/tag-srv';

export let ModuleName = '3nClient.components.msg-tags';

let modalParam = {
	modalWrapElem: null,
	modalElem: null,
	modalTriangleElem: null,
	inputTagElem: null,
	addNewTagBtnElem: null
};

let thee;

class Controller {
	msgId: string;
	tagName: string = '';
	modalIsOpen: boolean = false;

	static $inject = ['$q', '$timeout', CacheSrvMod.CacheSrvName, CommonSrvMod.CommonSrvName, TagSrvMod.TagsSrvName, MailFsSrvMod.MailFsSrvName];
	constructor(
		private $q: angular.IQService,
		private $timeout: angular.ITimeoutService,
		private _cacheSrv: CacheSrvMod.Cache,
		private _commonSrv: CommonSrvMod.Srv,
		private _tagSrv: TagSrvMod.Srv,
		private _mailSrv: MailFsSrvMod.Srv
	) {
		thee = this;
		this.init();
	}

	init() {
		this.$timeout(() => {
			modalParam = {
				modalWrapElem: document.getElementById('msgTagModalWrap'),
				modalElem: document.getElementById('msgTagModal'),
				modalTriangleElem: document.getElementById('modalTriangle'),
				inputTagElem: (document.querySelector('input[name="tag-name"]') as HTMLElement),
				addNewTagBtnElem: document.getElementById('addNewTagBtn')
			};
			modalParam.modalWrapElem.classList.add('close-modal');
		});	
	}

	private openTagModal(event: JQueryEventObject): void {
		const leftPosition = event.target.getBoundingClientRect().left - 32;
		this.modalIsOpen = true;
		modalParam.modalWrapElem.style.display = 'block';
		modalParam.modalElem.style.left = `${leftPosition}px`;
		this.$timeout(() => {
			modalParam.modalElem.classList.remove('close-modal');
			modalParam.modalElem.classList.add('open-modal');
		}, 10)
		this.$timeout(() => {
			modalParam.modalTriangleElem.style.opacity = '1';
			modalParam.inputTagElem.focus();
			modalParam.modalWrapElem.addEventListener('click', this.outClickHandler);
		}, 210);
	}


	private closeTagModal(): void {
		modalParam.modalWrapElem.removeEventListener('click', this.outClickHandler);
		this.modalIsOpen = false;
		modalParam.modalElem.classList.remove('open-modal');
		modalParam.modalElem.classList.add('close-modal');
		this.$timeout(() => {
			modalParam.modalTriangleElem.style.opacity = '0';
		}, 100);
		this.$timeout(() => {
			modalParam.modalWrapElem.style.display = 'none';
		}, 210).then(() => {
			this.$q.when(this._mailSrv.writeMsgList());
			this.$q.when(this._tagSrv.writeTagList());
		})
	}

	/**
	 * обработчик клика вне модального окна
	 * @param event {JQueryEventObject}
	 */
	private outClickHandler(event: JQueryEventObject): void {
		const targetElem = event.target;
		const isNecessaryElement = targetElem.hasAttribute('data-modal');

		if (!isNecessaryElement) {
			thee.closeTagModal();		
		} else {
			event.preventDefault();
		}
	}

	/**
	 * обработка нажатия клавиш на поле ввода
	 * @param event {KeyboardEvent}
	 */
	private keyupHandler(event: KeyboardEvent): void {
		const keycode = event.keyCode || event.which;
		switch (keycode) {
			case 13:
				this.addNewTag();
				break;
			case 27:
				this.closeTagModal();
				break;
		}
	}

	/**
	 * добавление тэга в списка добавленных в сообщение тэгов
	 * @param event {JQueryEventObject}
	 * @param tag {client3N.Tag}
	 */
	addTagToMsg(event: JQueryEventObject, tag: client3N.Tag): void {
		event.preventDefault();
		let tagIndexInMainList = null;
		this._cacheSrv.tags.list.forEach((item, index) => {
			if (item.name === tag.name) {
				tagIndexInMainList = index;
			}
		});
		this.changeTagQt(tagIndexInMainList, 'inc');
		this.$timeout(() => {
			this._cacheSrv.messages.list[this.msgId].labels.push(tag.name);
		});
	}

	/**
	 * очистка поля ввода тэга
	 */
	cancelCreateTag() {
		this.tagName = '';
	}

	/**
	 * удаление тэга из списка добавленных в сообщение тэгов
	 * @param event {JQueryEventObject}
	 * @param tag {string}
	 */
	removeTagFromMsg(event: JQueryEventObject, tag: string): void {
		event.preventDefault();
		const tagIndex = this._cacheSrv.messages.list[this.msgId].labels.indexOf(tag);
		let tagIndexInMainList = null;
		this._cacheSrv.tags.list.forEach((item, index) => {
			if (item.name === tag) {
				tagIndexInMainList = index;
			}
		});
		this.changeTagQt(tagIndexInMainList, 'dec');
		this.$timeout(() => {
			this._cacheSrv.messages.list[this.msgId].labels.splice(tagIndex, 1);
		});
	}

	/**
	 * добавление нового тэга в общий список тэгов
	 */
	addNewTag(): angular.IPromise<void> {
		if (this._tagSrv.checkTagName(this.tagName)) {
			return this._commonSrv.sysNotification('error', null, `Tag with the name ${this.tagName} already exists! Please enter a different name.`)
				.then(() => {
					modalParam.inputTagElem.focus();
				});
		} else {
			this.$timeout(() => {
				this._cacheSrv.tags.list.push({id: `${new Date().getTime()}`, name: this.tagName.toLocaleLowerCase(), qt: 1 });
				this._cacheSrv.messages.list[this.msgId].labels.push(this.tagName);
			}).then(() => {
				this.tagName = '';
				return this.$q.when(this._tagSrv.writeTagList());
			}).then(() => {
				return this.$q.when(this._mailSrv.writeMsgList());
			});
		}
	}

	/**
	 * фильтрация уже добавленных тэгов из общего списка тэгов
	 */
	private addedFilter(): client3N.Tag[] {
		return this._cacheSrv.tags.list.filter(tag => {
			return this._cacheSrv.messages.list[this.msgId].labels.indexOf(tag.name) === -1
		});
	}

	/**
	 * измененение количества сущностей с тэгом
	 * @param tagIndex {number} - индекс тэга в общем списке тэгов
	 * @param mode {'inc' | 'dec'}
	 */
	private changeTagQt(tagIndex: number, mode: 'inc'|'dec'): void {
		switch (mode) {
			case 'inc':
				this._cacheSrv.tags.list[tagIndex].qt += 1;
				break;
			case 'dec':
				this._cacheSrv.tags.list[tagIndex].qt -= 1;
				break;
		}
	}

}

const componentConfig: angular.IComponentOptions = {
	bindings: {
		msgId: '<'
	},
	templateUrl: './templates/mail/message/msg-tags/msg-tags.html',
	controller: Controller
};

export function addComponent(angular: angular.IAngularStatic): void {
  let mod = angular.module(ModuleName, []);
  mod.component('msgTags', componentConfig);
}

Object.freeze(exports);