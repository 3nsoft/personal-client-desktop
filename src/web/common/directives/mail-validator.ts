import { link } from 'fs';
/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. */

export let ModuleName = "3nweb.directives.mail-validator";

export function addDirective(angular: angular.IAngularStatic): void {
  let mod = angular.module(ModuleName, []);
  mod.directive("mailValid", MailValidProc.instance);
}

class MailValidProc implements angular.IDirective {

	static instance(): angular.IDirective {
		return new MailValidProc();
	}

	restrict = "A";

	require = "?ngModel";

	link(scope, element: angular.IAugmentedJQuery, attrs, ngModel) {
		if (!ngModel) return;

		ngModel.$validators.mail = (modelValue, viewValue) => {
			let mail = modelValue;
			if (!!mail) {
				if (!!mail.match(/@/g)) {
					if (mail.match(/@/g).length === 1) {
						let part2 = mail.split("@")[1];
						if ((part2.length > 0) && (part2.indexOf(" ") === -1)) {
							return true;
						}
					}
				}
			}
			return false;
		};

	}

}