/*
 Copyright (C) 2017 3NSoft Inc.

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

export function toArray() {
  return (obj, addKey) => {
    if (!angular.isObject(obj)) { return obj; }
    if ( addKey === false ) {
      return Object.keys(obj).map(key => obj[key]);
    } else {
      return Object.keys(obj).map(key => {
        const value = obj[key];
        return angular.isObject(value) ?
          Object.defineProperty(value, '$key', { enumerable: false, value: key}) :
          { $key: key, $value: value };
        });
    }
  };
}