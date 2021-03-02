/* tslint:disable */
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

import { material } from 'angular';

const APP_DEFAULT_PALETTE = {
  background: 'grey',
  primary: 'indigo',
  accent: 'amber',
  warn: 'red',
};

export function configApp(
  $mdThemingProvider: material.IThemingProvider,
  squireServiceProvider: any,
): void {

  /* add user theme */
  $mdThemingProvider.theme('myTheme')
    .primaryPalette(APP_DEFAULT_PALETTE.primary)
    .accentPalette(APP_DEFAULT_PALETTE.accent)
    .backgroundPalette(APP_DEFAULT_PALETTE.background)
    .warnPalette(APP_DEFAULT_PALETTE.warn);

  $mdThemingProvider.setDefaultTheme('myTheme');
  (window as any).mdT = $mdThemingProvider;

  squireServiceProvider.buttonDefaults = {
    header: true,
    bold: true,
    italic: true,
    underline: true,
    ol: true,
    ul: true,
    quote: true,
    code: true,
    alignRight: true,
    alignLeft: true,
    alignCenter: true,
  };
}
