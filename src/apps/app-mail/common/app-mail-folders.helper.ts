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

export function createNewMailFolder(): client3N.MailFolder {
  return {
    id: 'new',
    orderNum: null,
    name: '',
    isSystem: false,
    messageKeys: [],
    qtNoRead: 0,
  };
}

export function generateNewFolderIdAndOrdernum(list: {[id: string]: client3N.MailFolder}): {newId: string, newOrderNum: number} {
  const allAvailableIds = Object.keys(list).map(id => Number(id));
  const currentMaxId: number = Math.max.apply(null, allAvailableIds);
  return {
    newId: `${currentMaxId + 1}`,
    newOrderNum: allAvailableIds.length,
  };
}
