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
export const ModuleName = '3nClient.component.contact-item';

export function addComponent(ng: IAngularStatic): void {
  const mod = ng.module(ModuleName, []);
  mod.component('contactItem', componentConfig);
}

class ContactItemComponent {
  public person: client3N.Person;
  public selected: boolean;

  static $inject = [];
  constructor() {}
}

const componentConfig: IComponentOptions = {
  bindings: {
    person: '<',
    selected: '<',
  },
  templateUrl: './apps/app-contact/contact-item/contact-item.component.html',
  controller: ContactItemComponent,
};
