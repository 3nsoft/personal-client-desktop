/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. */

export let ModulName = "3nClient.services.common";
export let CommonSrvName = "commonService";


export function addService(angular: angular.IAngularStatic): void {
  let mod = angular.module(ModulName, []);
  mod.service(CommonSrvName, Srv);
}

export class Srv {

	static $inject = ["$rootScope", "$timeout", "$q", "$filter", "$mdToast"]
	constructor(
		private $rootScope: angular.IRootScopeService,
		private $timeout: angular.ITimeoutService,
		private $q: angular.IQService,
    private $filter: angular.IFilterService,
		private $mdToast: angular.material.IToastService
	) {}

	/**
	 * system notification
	 * @param type {'success' | 'error' | 'info'}
	 * @param action {string} - если необходимо сообщение с action button, то указывается название кнопки, при нажатии на которую promise будет возвращать (resolve) значение 'ok'; если action button не нужен, то указывается null и при этом promise будет возвращать true при "закрытии сообщения"
	 * @param text {string}
	 * @returns {angular.IPromise<any>}
	 */
	sysNotification(type: 'success' | 'error' | 'info', action: string, text: string): angular.IPromise<any> {
		const tClass = `${type}-toast`;
		const buttonClass = (type === 'success') ? 'md-primary' : ((type === 'error') ? 'md-warn' : 'md-accent');
		let toast: angular.material.ISimpleToastPreset;

		if (!!action) {
			toast = this.$mdToast.simple()
				.textContent(text)
				.action(action)
				.highlightAction(true)
				.highlightClass(buttonClass)
				.hideDelay(2000)
				.toastClass(tClass)
				.position('bottom right');
		} else {
			toast = this.$mdToast.simple()
				.textContent(text)
				.toastClass(tClass)
				.position('bottom right');
		}

		return this.$mdToast.show(toast);
	}

  /**
   * преобразование даты/времени в мс в дату/время в виде строки
   * формата "HH:mm" или "dd MMM"
   * @param timeCr {number} - дата/время создания сообщения в мс
   * @returns {string} - если дата/время === сегодняшней дате, то дата/время
   * в виде строки формата "HH:mm", иначе - в виде строки формата "dd MMM"
   */
   getMsgDate(timeCr: number): string {
     const now = new Date();
     const nowBegin = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0);
     const dateMsg = new Date(timeCr);
     const isToday = (dateMsg < nowBegin) ? false : true;
     return isToday ? this.$filter('date')(dateMsg, 'HH:mm') : this.$filter('date')(dateMsg, 'dd MMM');
   }

}
