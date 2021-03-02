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
import { IAngularStatic, IRootScopeService, material } from 'angular';

export let ModuleName = '3nClient.services.confirm-dialog';
export let ConfirmDialogServiceName = 'confirmDialogService';

export function addService(ng: IAngularStatic): void {
  const module = ng.module(ModuleName, []);
  module.service(ConfirmDialogServiceName, ConfirmDialogService);
}

export class ConfirmDialogService {
  static $inject = ['$rootScope', '$mdDialog'];
  constructor(
    private $rootScope: IRootScopeService,
    private $mdDialog: material.IDialogService,
  ) {}

  public showConfirm<T>(
    title: string = 'Are you sure?',
    text: string = '',
    type: client3N.ConfirmDialogEvent,
    data: T,
    ): void {
    const confirm = this.$mdDialog.confirm()
      .multiple(true)
      .title(title)
      .textContent(text)
      .ariaLabel('delete dialog')
      .ok('OK')
      .cancel('Cancel');

    this.$mdDialog
      .show(confirm)
      .then(
        () => this.$rootScope.$broadcast('confirmEvent', {eventType: type, value: true, data}),
        () => this.$rootScope.$broadcast('confirmEvent', {eventType: type, value: false, data}),
      );
  }

}
