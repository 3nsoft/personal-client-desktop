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

export function sortList(list: {[id: string]: client3N.Person}): {[id: string]: client3N.Person} {
  const personArr = Object.keys(list).map(id => list[id]);
  const personArrSorted = personArr.sort((a: client3N.Person, b: client3N.Person) => {
    const aName = a.name || a.mails[0];
    const bName = b.name || b.mails[0];
    return aName.toLocaleLowerCase() > bName.toLocaleLowerCase() ? 1 : -1;
  });
  const res = {} as {[id: string]: client3N.Person};
  personArrSorted.forEach(item => {
    res[item.id] = item;
  });
  return res;
}

export function getAllLetters(list: {[id: string]: client3N.Person}): string[] {
  const personArr = Object.keys(list).map(id => list[id]);
  const res: string[] = [];
  personArr.forEach(item => {
    const str = item.name || item.mails[0];
    if (res.indexOf(str[0].toLocaleUpperCase()) === -1) {
      res.push(str[0].toLocaleUpperCase());
    }
  });
  return res.sort();
}

export function personsFilter(
  list: {[id: string]: client3N.Person},
  search: string,
): { list: {[id: string]: client3N.Person}, letters: string[] } {
  const letters: string[] = [];
  const listArr = Object.keys(list).map(id => list[id]);
  const listArrFiltered = listArr.filter(item => {
    const str = item.name || item.mails[0];
    if (!search) {
      letters.indexOf(str[0].toLocaleUpperCase()) === -1 ?
        letters.push(str[0].toLocaleUpperCase()) :
        () => {};
      return true;
    }

    if (str.toLocaleLowerCase().indexOf(search.toLocaleLowerCase()) === 0) {
      letters.indexOf(str[0].toLocaleUpperCase()) === -1 ?
        letters.push(str[0].toLocaleUpperCase()) :
        () => {};
      return true;
    }

    return false;
  });

  const lettersSorted = letters.sort();
  const listArrFilteredSorted = listArrFiltered.sort((a: client3N.Person, b: client3N.Person) => {
    const aName = a.name || a.mails[0];
    const bName = b.name || b.mails[0];
    return aName.toLocaleLowerCase() > bName.toLocaleLowerCase() ? 1 : -1;
  });
  const resList = {} as {[id: string]: client3N.Person};
  listArrFilteredSorted.forEach(item => {
    resList[item.id] = item;
  });

  return { list: resList, letters: lettersSorted };
}
