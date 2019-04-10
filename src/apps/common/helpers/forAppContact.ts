import {appState} from "../services/app-store";

export function createNewPersonList(): {[id: string]: client3N.Person} {
  const personList: {[id: string]: client3N.Person} = {};
  const now = Date.now();
  personList[`${now}`] = {
    id: `${now}`,
    name: '3NSoft',
    mails: ['support@3nweb.com'],
    phone: '',
    notice: 'The 3NSoft support department.',
    avatar: '',
    groupsIds: [],
    isConfirmed: true,
    isBlocked: false,
    labels: [],
  };
  personList[`${now + 1}`] = {
    id: `${now + 1}`,
    name: '',
    mails: [appState.values.user],
    phone: '',
    notice: '',
    avatar: '',
    groupsIds: [],
    isConfirmed: true,
    isBlocked: false,
    labels: [],
  };
  return personList;
}

export function createNewPerson(): client3N.Person {
  return {
    id: 'new',
    name: '',
    mails: [''],
    phone: '',
    notice: '',
    avatar: '',
    groupsIds: [],
    isConfirmed: true,
    isBlocked: false,
    labels: [],
  }
}
