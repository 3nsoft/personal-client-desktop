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

import { copy, IAngularEvent, IAngularStatic, IComponentOptions, IScope, ITimeoutService } from 'angular';
import { Subject } from 'rxjs/Subject';
import { takeUntil } from 'rxjs/operators';
import { appState } from '../../common/services/app-store';
import { appContactsState } from '../common/app-contact-store';
import * as AppContactService from '../services/app-contact.service';
import { personsFilter } from '../common/app-contact-list.helper';

export const ModuleName = '3nClient.component.contact-list';

export function addComponent(ng: IAngularStatic): void {
  const mod = ng.module(ModuleName, []);
  mod.component('contactList', componentConfig);
}

class ContactListComponent {
  public vars: {
    search: string;
  };
  public personList: {[id: string]: client3N.Person};
  public allLetters: string[];
  public selectedPersonIds: string[] = [];

  private ngUnsubscribe: Subject<void> = new Subject<void>();

  static $inject = ['$scope', '$timeout', AppContactService.AppContactsServiceName];
  constructor(
    private $scope: IScope,
    private $timeout: ITimeoutService,
    private contactSrv: AppContactService.AppContactsService,
  ) {}

  $onInit(): void {
    this.vars = {
      search: '',
    };

    this.prepareDataForDisplaying(appContactsState.values.list, this.vars.search);

    const allIds = Object.keys(appContactsState.values.list);
    this.selectedPersonIds = appContactsState.values.selectedContactsIds.length > 0 ?
      appContactsState.values.selectedContactsIds :
      [allIds[0]];

    appState
      .change$
      .isRightSidenavOpen
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(status => {
        if (!status) {
          appContactsState.values.selectedContactsIds = [Object.keys(appContactsState.values.list)[0]];
          this.vars.search = '';
          this.prepareDataForDisplaying(appContactsState.values.list, this.vars.search);
        }
      });

    appContactsState
      .change$
      .list
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(contacts => {
        this.prepareDataForDisplaying(contacts, this.vars.search);
      });

    appContactsState
      .change$
      .selectedContactsIds
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(ids => {
        const allPersonIds = Object.keys(appContactsState.values.list);
        if (
          ids.length === 0 &&
          allPersonIds.length > 0
        ) {
          this.selectedPersonIds = [allPersonIds[0]];
        } else {
          this.selectedPersonIds = ids;
        }
      });

    this.$scope
      .$on(
        'confirmEvent',
        (event: IAngularEvent, arg: client3N.ConfirmEventArguments<string>) => {
          switch (arg.eventType) {
            case 'person_delete':
              if (arg.value === true) {
                const tmpPersonList = copy(appContactsState.values.list);
                delete tmpPersonList[arg.data];
                appContactsState.values.list = copy(tmpPersonList);
                appContactsState.values.selectedContactsIds = [Object.keys(appContactsState.values.list)[0]];
                this.contactSrv.savePersonList(appContactsState.values.list);
              }
              break;
          }
        });
  }

  $onDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public isSelected(mode: 'style'|'select', id: string): boolean {
    if (mode === 'style') {
      return id ? this.selectedPersonIds.includes(id) : false;
    }
    if (mode === 'select') {
      return this.selectedPersonIds.length === 1 ?
        false :
        this.selectedPersonIds.includes(id);
    }
  }

  public newContact(): void {
    appContactsState.values.selectedContactsIds = ['new'];
  }

  public select(event: MouseEvent, id: string): void {
    const targetHtmlElement = (event.target as HTMLElement).tagName;
    switch (targetHtmlElement) {
      case 'path':
        const currentSelectedIds =   appContactsState.values.selectedContactsIds.slice();
        const selectedIdIndex = currentSelectedIds.indexOf(id);
        if (selectedIdIndex === -1) {
          currentSelectedIds.push(id);
        } else if (currentSelectedIds.length > 1) {
          currentSelectedIds.splice(selectedIdIndex, 1);
        }
        appContactsState.values.selectedContactsIds = currentSelectedIds.slice();
        break;
      default:
        appContactsState.values.selectedContactsIds = [id];
        break;
    }
  }

  public searchChange(): void {
    this.prepareDataForDisplaying(appContactsState.values.list, this.vars.search);
    appContactsState.values.selectedContactsIds = Object.keys(this.personList).length > 0 ?
      [Object.keys(this.personList)[0]] :
      [];
  }

  public searchClear(): void {
    this.vars.search = '';
    this.prepareDataForDisplaying(appContactsState.values.list, this.vars.search);
  }

  public letterPersonFilter(letter: string): Function {
    return (person: client3N.Person) => {
      const str = person.name || person.mails[0];
      return str.toLocaleUpperCase()[0] === letter;
    };
  }

  private prepareDataForDisplaying(data: {[id: string]: client3N.Person}, search: string): void {
    const { list, letters } = personsFilter(data, search);
    this.personList = list;
    this.allLetters = letters;
  }

}

const componentConfig: IComponentOptions = {
  bindings: {},
  templateUrl: './apps/app-contact/contact-list/contact-list.component.html',
  controller: ContactListComponent,
};
