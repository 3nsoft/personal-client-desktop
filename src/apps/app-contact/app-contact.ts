/*
 Copyright (C) 2018 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under
 the terms of the GNU General Public License as published by the Free Software
 Foundation, either version 3 of the License, or (at your option) any later
 version.

 This program is distributed in the hope that it will be useful, but
 WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with
 this program. If not, see <http://www.gnu.org/licenses/>.
*/
import { IAngularStatic, IComponentOptions } from 'angular';
export const ModuleName = '3nClient.app.contact';

export function addComponent(ng: IAngularStatic): void {
  const mod = ng.module(ModuleName, []);
  mod.component('appContact', componentConfig);
}

class AppContactComponent {
  static $inject = [];
  constructor() {}

  $onInit(): void {}
}

const componentConfig: IComponentOptions = {
  bindings: {},
  templateUrl: './apps/app-contact/app-contact.html',
  controller: AppContactComponent,
};
