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

export let ModuleName = '3nClient.mail-folder';
export function addComponent(ng: IAngularStatic): void {
  const mod = ng.module(ModuleName, []);
  mod.component('mailFolder', componentConfig);
}

class MailFolderComponent {
  public folder: client3N.MailFolder;
  public select: boolean = false;

  public iconName: string;
  public iconColor: string;

  $onInit(): void {
    this.iconName = this.folder.isSystem ? this.folder.icon : 'folder';
    this.iconColor = this.folder.isSystem && this.folder.icon === 'folder' ?
      '#0090ec' :
      'rgba(0, 0, 0, 0.54)';
  }
}

const componentConfig: IComponentOptions = {
  bindings: {
    folder: '<',
    select: '<',
  },
  templateUrl: './apps/app-mail/mail-folder/mail-folder.component.html',
  controller: MailFolderComponent,
};
