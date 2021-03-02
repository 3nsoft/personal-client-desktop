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
import { IAngularStatic, IComponentOptions, IScope } from 'angular';
import { getElementColor } from '../../../apps/common/helpers/forUI';
export const ModuleName = '3nClient.app.pcd-contact-icon';

export function addComponent(ng: IAngularStatic): void {
  const mod = ng.module(ModuleName, []);
  mod.component('pcdContactIcon', componentConfig);
}

export interface PcdContactIcon {
  isGroup: boolean;
  size: string;
  label: string;
  isSelect: boolean;
}

class PcdContactIconComponent {
  public isGroup: boolean;
  public size: string;
  public label: string;
  public isSelect: boolean;

  public icon: string = 'hexa';
  public checkIconSize: string;
  public currentIconColor: string;

  static $inject = ['$scope'];
  constructor(
    private $scope: IScope,
  ) {}

  $onInit() {
    this.icon = this.isGroup ? 'dode' : 'hexa';

    const currentIconSize = this.size ? Number(this.size) : 24;
    this.checkIconSize = `${Math.floor(currentIconSize * 0.5)}`;

    this.currentIconColor = this.isSelect ? '#ffffff' : getElementColor(this.label || '?');

    this.$scope.$watch(
      () => this.isSelect,
      (oldValue: boolean, newValue: boolean) => {
        if (oldValue !== newValue) {
          this.currentIconColor = this.isSelect ? '#ffffff' : getElementColor(this.label || '?');
        }
      },
    );
  }

  public getMainStyles(): {[prop: string]: string} {
    return {
      width: `${this.size}px`,
      height: `${this.size}px`,
    };
  }

  public getLabelStyles(): {[prop: string]: string} {
    return {
      'font-size': `${Number(this.checkIconSize) - 2}px`,
    };
  }

  public getLetter(): string {
    if (this.label && typeof this.label === 'string') {
      return this.label.length === 1 ?
        this.label.toLocaleUpperCase() :
        `${this.label[0].toLocaleUpperCase()}${this.label[1].toLocaleLowerCase()}`;
    }
    return '';
  }
}

const componentConfig: IComponentOptions = {
  bindings: {
    isGroup: '<',
    size: '<',
    label: '@',
    isSelect: '<',
  },
  templateUrl: './common/components/pcd-contact-icon/pcd-contact-icon.html',
  controller: PcdContactIconComponent,
};
