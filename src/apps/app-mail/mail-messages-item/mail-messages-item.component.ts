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
import { convertTimestamp } from '../../common/helpers';

export let ModuleName = '3nClient.mail-messages-item';
export function addComponent(ng: IAngularStatic): void {
  const mod = ng.module(ModuleName, []);
  mod.component('mailMessagesItem', componentConfig);
}

class MailMessagesItemComponent {
  public content: client3N.MessageListItem;
  public selected: boolean = false;
  public multi: boolean = false;

  $onInit(): void {
    console.log(this.content, this.selected);
  }

  public getTimeString(): string {
    return convertTimestamp(this.content.timestamp, true);
  }

  public isMessageIn(): boolean {
    return this.content.msgKey.indexOf('in=') === 0;
  }
}

const componentConfig: IComponentOptions = {
  bindings: {
    content: '<',
    selected: '<',
    multi: '<',
  },
  templateUrl: './apps/app-mail/mail-messages-item/mail-messages-item.component.html',
  controller: MailMessagesItemComponent,
};
