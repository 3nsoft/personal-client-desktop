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
import angular from 'angular';

export function asyncFilter() {
  const values = {};
  const subscriptions = {};

  // Need a way to tell the input objects apart from each other (so we only subscribe to them once)
  let nextObjectId = 0;
  const objectId = obj => {
    if (!obj.hasOwnProperty('__asyncFilterObjectID__')) {
      obj.__asyncFilterObjectID__ = ++nextObjectId;
    }
    return obj.__asyncFilterObjectID__;
  };

  const async = (input: any, scope: angular.IScope) => {
    // Make sure we have an Observable or a Promise
    if (
      !input ||
      !(input.subscribe || input.then)
    ) {
      return input;
  }

    const inputId = objectId(input);
    if (!(inputId in subscriptions)) {
      const subscriptionStrategy = input.subscribe && input.subscribe.bind(input)
        || input.success && input.success.bind(input)
        || input.then.bind(input);

      subscriptions[inputId] = subscriptionStrategy(value => {
          values[inputId] = value;

          if (scope && scope.$applyAsync) {
            // Automatic safe apply, if scope provided
            scope.$applyAsync();
          }
      });

      if (scope && scope.$on) {
          scope.$on('$destroy', () => {
              const sub = subscriptions[inputId];
              if (sub) {
                sub.unsubscribe();
              }
              delete subscriptions[inputId];
              delete values[inputId];
          });
      }
    }

    return values[inputId];
  };

  // So that Angular does not cache the return value
  (async as any).$stateful = true;

  return async;
}
