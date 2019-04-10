/*
 Copyright (C) 2018 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General
 Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option
 any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the
 implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see
<http://www.gnu.org/licenses/>.
*/
import * as angular from 'angular';
import { appsModules, dependencies } from './common/modules';
import * as Router from './common/router';
import * as Config from './common/config';

const app = angular.module('3nClient', dependencies);
appsModules.forEach(item => {
  switch (item.type) {
    case 'filter':
      item.module.addFilter(angular);
      break;
    case 'component':
      item.module.addComponent(angular);
      break;
    case 'directive':
      item.module.addDirective(angular);
      break;
    case 'service':
      item.module.addService(angular);
      break;
    case 'provider':
      item.module.addProvider(angular);
      break;
  }
});

app.config(
  [
    '$mdThemingProvider',
    'squireServiceProvider',
    'NotificationProvider',
    Config.configApp,
  ],
);
app.config(
  [
    '$stateProvider',
    '$urlRouterProvider',
    Router.router,
  ],
);
