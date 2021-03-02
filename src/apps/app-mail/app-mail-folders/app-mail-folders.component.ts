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
import { IAngularStatic, IComponentOptions, ITimeoutService } from 'angular';
import { Subject } from 'rxjs/Subject';
import { takeUntil } from 'rxjs/operators';
import { StateService } from '@uirouter/angularjs';
import { appMailState } from '../common/app-mail-store';
import * as FolderManager from '../services/mail-folder-manager/mail-folder-manager.service';

export const ModuleName = '3nClient.component.app-mail-folders';

export function addComponent(ng: IAngularStatic): void {
  const mod = ng.module(ModuleName, []);
  mod.component('appMailFolders', componentConfig);
}

class AppMailFoldersComponent {
  public list: {[id: string]: client3N.MailFolder};
  public selectFolderId: string;

  private ngUnsubscribe: Subject<void> = new Subject<void>();

  static $inject = ['$state', '$timeout', FolderManager.MailFolderManagerServiceName];
  constructor(
    private $state: StateService,
    private $timeout: ITimeoutService,
    private folderManager: FolderManager.MailFolderManagerService,
  ) {}

  $onInit(): void {
    this.list = appMailState.values.list;
    this.selectFolderId = appMailState.values.selectFolderId;
    console.log(this.list, this.selectFolderId);

    appMailState
      .change$
      .list
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(folderList => {
        this.$timeout(() => {
          this.list = folderList;
        });
      });
  }

  $onDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public manageMailFolder(): void {
    this.folderManager.openFolderManager();
  }

  public selectFolder(id: string): void {
    appMailState.values.selectFolderId = id;
    appMailState.values.selectedMessageKeys = [];
    this.selectFolderId = id;
    this.$state.go('root.app-mail.content', {folderId: this.selectFolderId, msgId: null});
  }

}

const componentConfig: IComponentOptions = {
  bindings: {},
  templateUrl: './apps/app-mail/app-mail-folders/app-mail-folders.component.html',
  controller: AppMailFoldersComponent,
};
