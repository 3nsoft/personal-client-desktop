/* tslint:disable:interface-name */
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

import { AppId } from '../../../common/const';
import { Store } from '../../../common/lib/store';

interface IAppState {
  user: string;
  userStatus: client3N.UserStatus;
  isProgressBarShow: boolean;
  currentAppId: number;
  isRightSidenavOpen: boolean;
  isLeftSidenavOpen: boolean;
}

export const appState = new Store<IAppState>();

appState.values.user = '';
appState.values.userStatus = {code: 200, description: 'Connected'};
appState.values.isProgressBarShow = false;
appState.values.currentAppId = AppId.Mail;
appState.values.isRightSidenavOpen = false;
appState.values.isLeftSidenavOpen = false;
