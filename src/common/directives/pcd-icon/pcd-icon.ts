/* tslint:disable:max-line-length */
/* tslint:disable:no-string-literal */
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

import { getIcon } from './pcd-icon.helper';

export const ModuleName = '3nClient.directive.pcd-icon';

export function addDirective(angular: angular.IAngularStatic): void {
  const mod = angular.module(ModuleName, []);
  mod.directive('pcdIcon', PcdIconDirective.instance);
}

const allIcons = [
  'help',
  'hexa',
  'dode',
  'chat',
  'mail_outline',
  'group',
  'flag',
  'delete',
  'close',
  'add',
  'more_vert',
  'home',
  'folder',
  'folder_open',
  'attach_file',
  'reply',
  'reply_all',
  'forward',
  'keyboard_arrow_down',
  'keyboard_arrow_up',
  'send',
  'move_to_inbox',
  'check_box_outline',
  'check_box',
  'arrow_drop_down',
  'select_all',
  'panorama_fish_eye',
  'save_alt',
  'attachment',
  'lens',
  'done',
  'text_format',
  'perm_identity',
  'done_all',
  'group_add',
  'insert_emoticon',
  'volume_off',
  'exit_to_app',
  'search',
  'person_add',
  'warning',
  'people_outline',
  'edit',
  'call_received',
  'call_made',
  'expand_more',
  'expand_less',
  'format_color_text',
  'file_download',
  'file_upload',
  'stop',
];

class PcdIconDirective implements angular.IDirective {

  restrict = 'E';

  static instance(): angular.IDirective {
    return new PcdIconDirective();
  }

  link(scope: angular.IScope, element: angular.IAugmentedJQuery, attrs: any) {
    console.debug(scope); // tslint:disable-line
    let shape: string;
    let iconColor: string = attrs['color'] === undefined ? '#000000' : attrs['color'];

    // if (attrs['icon'] !== undefined && !allIcons.includes(attrs['icon'])) {
    //   console.error(`The icon with name "${attrs['icon']}" is absent!`);
    //   shape = getIcon('help');
    // } else {
    //   shape = getIcon(attrs['icon']);
    // }

    if (attrs['icon'] !== undefined) {
      attrs.$observe('icon', (newIcon: string) => {
        if (!allIcons.includes(newIcon)) {
          console.error(`The icon with name "${newIcon}" is absent!`);
          shape = getIcon('help');
        } else {
          shape = getIcon(newIcon);
        }
        this.createIcon(element, shape, iconColor, size);
      });
    } else {
      shape = getIcon('help');
    }

    const size: string = attrs['size'] === undefined ? '24' : attrs['size'];
    // const color: string = attrs['color'] === undefined ? '#000000' : attrs['color'];
    // const newShape = shape.replace('<svg ', `<svg width="${size}" height="${size}" fill="${color}" `);
    // const htmlElement = element.html(newShape);
    // htmlElement[0].style.width = `${size}px`;
    // htmlElement[0].style.height = `${size}px`;

    if (attrs['color'] !== undefined) {
      attrs.$observe('color', (newColor: string) => {
        iconColor = newColor === undefined ? '#000000' : newColor;
        this.createIcon(element, shape, iconColor, size);
        // const color: string = newColor === undefined ? '#000000' : newColor;
        // const newShape = shape.replace('<svg ', `<svg width="${size}" height="${size}" fill="${color}" `);
        // const htmlElement = element.html(newShape);
        // htmlElement[0].style.width = `${size}px`;
        // htmlElement[0].style.height = `${size}px`;
      });
    }
  }

  createIcon(
    element: angular.IAugmentedJQuery,
    shape: string,
    color: string,
    size: string,
  ): void {
    const newShape = shape.replace('<svg ', `<svg width="${size}" height="${size}" fill="${color}" `);
    const htmlElement = element.html(newShape);
    htmlElement[0].style.width = `${size}px`;
    htmlElement[0].style.height = `${size}px`;
  }

}
