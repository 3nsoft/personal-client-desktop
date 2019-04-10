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

import { copy, IAngularStatic, IComponentOptions, IFormController, IScope, ITimeoutService } from 'angular';
import { Subject } from 'rxjs/Subject';
import { takeUntil } from 'rxjs/operators';
import { appState } from '../../common/services/app-store';
import { appContactsState } from '../common/app-contact-store';
import { getElementColor, invertColor } from '../../common/helpers/forUI';
import { openFileAndConvertToBase64 } from '../common/app-contact-avatar';
import * as ConfirmDialogService from '../../common/services/confirm-dialog.service';
import * as AppContactService from '../services/app-contact.service';
import { createNewPerson, getAlias } from '../../common/helpers';
import * as MsgManagerModule from '../../app-mail/services/message-manager/message-manager.service';

export const ModuleName = '3nClient.component.person';

export function addComponent(ng: IAngularStatic): void {
  const mod = ng.module(ModuleName, []);
  mod.component('person', componentConfig);
}

class PersonComponent {
  public person: client3N.Person;
  public disabled: boolean;
  public personForm: IFormController;
  public me: string = appState.values.user;

  private ngUnsubscribe: Subject<void> = new Subject<void>();

  static $inject = [
    '$scope',
    '$timeout',
    ConfirmDialogService.ConfirmDialogServiceName,
    AppContactService.AppContactsServiceName,
    MsgManagerModule.MessageManagerServiceName,
  ];
  constructor(
    private $scope: IScope,
    private $timeout: ITimeoutService,
    private confirmSrv: ConfirmDialogService.ConfirmDialogService,
    private contactSrv: AppContactService.AppContactsService,
    private msgManager: MsgManagerModule.MessageManagerService,
  ) {}

  $onInit(): void {
    const allIds = Object.keys(appContactsState.values.list);
    this.person = allIds.length > 0 ?
      copy(appContactsState.values.list[allIds[0]]) :
      {} as client3N.Person;
    this.disabled = this.person.mails[0] === 'support@3nweb.com';

    appContactsState
      .change$
      .selectedContactsIds
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(selectedIds => {
        if (selectedIds.length === 1 && selectedIds[0] === 'new') {
          this.person = createNewPerson();
          this.disabled = false;
        } else {
          this.person = copy(appContactsState.values.list[selectedIds[0]]);
          this.disabled = selectedIds.length !== 1 || this.person.mails[0] === 'support@3nweb.com';
        }
      });

    this.$scope.$watch(
      () => this.person.id,
      (oldValue: string, newValue: string) => {
        if (oldValue !== newValue) {
          this.personForm.$setPristine();
        }
      },
    );
  }

  $onDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public getAvatarStyle(): {[name: string]: string} {
    if (this.person.avatar) {
      return {'background-image': `url(${this.person.avatar})`};
    }
    const str = this.person.name ||
      (this.person.mails && this.person.mails.length > 0 ?
        this.person.mails[0] :
        '?');
    const bgColor = getElementColor(str);
    const color = invertColor(bgColor);
    return {
      'background-color': bgColor,
      'color': color,
    };
  }

  public getInitials(): string {
    const str = this.person.name ||
      (this.person.mails && this.person.mails.length > 0 ?
        this.person.mails[0] :
        '?');
    if (str) {
      return str.length > 1 ?
        `${str[0].toLocaleUpperCase()}${str[1].toLocaleLowerCase()}` :
        str[0].toLocaleUpperCase();
    }
    return '';
  }

  public async setAvatar(mode: 'add'|'remove'): Promise<void> {
    switch (mode) {
      case 'add':
        const base64Image = await openFileAndConvertToBase64();
        this.$timeout(() => {
          this.person.avatar = base64Image;
          this.personForm.$setDirty();
          console.log(this.personForm);
        });
        break;
      case 'remove':
        this.person.avatar = '';
        this.$timeout(() => {
          this.person.avatar = '';
          this.personForm.$setDirty();
        });
        break;
    }
  }

  public personAction(mode: 'chat'|'mail'|'delete'): void {
    switch (mode) {
      case 'delete':
        this.confirmSrv.showConfirm<string>(
          'Are you sure?',
          '',
          'person_delete',
          this.person.id,
        );
        break;
      case 'mail':
        const msgData: client3N.MessageEdited = {
          msgId: undefined,
          msgKey: undefined,
          sender: appState.values.user,
          senderAlias: getAlias(appState.values.user),
          mailAddresses: [this.person.mails[0]],
          alias: [this.person.mails[0]].map(mail => getAlias(mail)),
          subject: '',
          timestamp: undefined,
          bodyHTML: '',
          attached: undefined,
          errorsWhenSend: undefined,
        };
        this.msgManager.openMessageManager(
          'new',
          'create',
          msgData,
        );
        break;
    }
  }

  public disabledAction(): boolean {
    return this.person.mails[0] === 'support@3nweb.com' ||
      this.person.mails[0] === this.me ||
      this.person.id === 'new';
  }

  public async saveContact(): Promise<void> {
    this.personForm.$setPristine();
    const tmpPersonList = copy(appContactsState.values.list);
    if (this.person.id === 'new') {
      this.person.id = `${Date.now()}`;
    }
    tmpPersonList[this.person.id] = copy(this.person);
    appContactsState.values.list = copy(tmpPersonList);
    await this.contactSrv.savePersonList(appContactsState.values.list);
  }
}

const componentConfig: IComponentOptions = {
  bindings: {},
  templateUrl: './apps/app-contact/person/person.component.html',
  controller: PersonComponent,
};
