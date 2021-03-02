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
export const ModuleName = '3nClient.app.nav-item';

export function addComponent(ng: IAngularStatic): void {
  const mod = ng.module(ModuleName, []);
  mod.component('navItem', componentConfig);
}

export interface NavItem {
  sref: string;
  name?: string;
  amt?: number;
  icon?: string;
  color?: string;
  disable?: boolean;
}

class NavItemComponent {
  public sref: string;
  public name: string;
  public amt: number;
  public icon: string;
  public color: string;
  public disable: boolean;
}

const componentConfig: IComponentOptions = {
  bindings: {
    sref: '<',
    name: '<',
    icon: '<',
    color: '<',
    disable: '<',
    amt: '<',
  },
  templateUrl: './apps/common/components/nav-item/nav-item.html',
  controller: NavItemComponent,
};
