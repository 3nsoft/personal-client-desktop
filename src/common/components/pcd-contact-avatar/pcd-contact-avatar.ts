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
export const ModuleName = '3nClient.app.pcd-contact-avatar';

export function addComponent(ng: IAngularStatic): void {
  const mod = ng.module(ModuleName, []);
  mod.component('pcdContactAvatar', componentConfig);
}

export interface PcdContactAvatar {
  size: string;
  avatar: string;
  isGroup: boolean;
  isSelect: boolean;
}

class PcdContactAvatarComponent {
  public size: string;
  public avatar: string;
  public isGroup: boolean;
  public isSelect: boolean;

  public checkIconSize: string;

  static $inject = [];
  constructor() {}

  $onInit() {
    const currentIconSize = this.size ? Number(this.size) : 24;
    this.checkIconSize = `${Math.floor(currentIconSize * 0.5)}`;
  }

  public getMainStyles(): {[prop: string]: string} {
    return {
      'width': `${this.size}px`,
      'height': `${this.size}px`,
      'background-image': `url(${this.avatar})`,
    };
  }

}

const componentConfig: IComponentOptions = {
  bindings: {
    size: '<',
    avatar: '<',
    isGroup: '<',
    isSelect: '<',
  },
  templateUrl: './common/components/pcd-contact-avatar/pcd-contact-avatar.html',
  controller: PcdContactAvatarComponent,
};
