import { MAIL_FOLDERS_DEFAULT } from '../../../common/const';
import { appState } from '../services/app-store';
import { appContactsState } from '../../app-contact/common/app-contact-store';
import { copy } from 'angular';

export function createNewMailFolderList(): {[id: string]: client3N.MailFolder} {
  return MAIL_FOLDERS_DEFAULT;
}

/**
 * получение alias почтового адреса
 * @param address
 */
export function getAlias(address: string): string {
  if (address === appState.values.user) {
    return 'Me';
  }

  let res: string = address;
  for (const id of Object.keys(appContactsState.values.list)) {
    if (
      appContactsState.values.list[id].mails[0].toLocaleLowerCase() === address.toLocaleLowerCase()
    ) {
      res = appContactsState.values.list[id].name || appContactsState.values.list[id].mails[0];
      break;
    }
  }
  return res;
}

/**
 * update содержимого списка папок на основании содержимого списка сообщений
 * @param mailFolderList
 * @param msgList
 */
export function checkMailFoldersForMessages(
  mailFolderList: {[id: string]: client3N.MailFolder},
  msgList: {[key: string]: client3N.MessageListItem},
  ): {[id: string]: client3N.MailFolder} {
  const mailFolderListUpdated = copy(mailFolderList);
  Object.keys(mailFolderListUpdated).forEach(id => {
    mailFolderListUpdated[id].messageKeys = [];
  });
  for (const key of Object.keys(msgList)) {
    const currentMsgFolderId = msgList[key].folderId;
    if (!mailFolderListUpdated[currentMsgFolderId].messageKeys.includes(key)) {
      mailFolderListUpdated[currentMsgFolderId].messageKeys.push(key);
    }
  }
  return copy(calcUnreadMsg(mailFolderListUpdated, msgList));
}

/**
 * функция расчета количества непрочитанных сообщений в mail folders
 */
function calcUnreadMsg(
  mailFolderList: {[id: string]: client3N.MailFolder},
  msgList: {[key: string]: client3N.MessageListItem},
  ): {[id: string]: client3N.MailFolder} {
  const res = copy(mailFolderList);
  for (const id of Object.keys(res)) {
    let qtUnread = 0;
    res[id].messageKeys.forEach(msgKey => {
      qtUnread = msgKey.indexOf('in') === 0 &&
        !msgList[msgKey].isRead ?
        qtUnread + 1 :
        qtUnread;
    });
    res[id].qtNoRead = qtUnread;
  }
  return res;
}

/**
 * sanitize bodyHTML
 * @params html {strig}
 * @return sanitized html {strig}
 */
export function sanitizeHTML(source: string): string {
  const allowedElems = [
    'DIV',
    'P',
    'SPAN',
    'A',
    'IMG',
    'BR',
    'B',
    'I',
    'U',
    'S',
    'OL',
    'UL',
    'LI',
    'H1',
    'H2',
    'H3',
    'H4',
    'H5',
    'H6',
    'STRONG',
    'EM',
    'SUB',
    'SUP',
    'CODE',
    'PRE',
    'BLOCKQUOTE',
  ];
  let allowedStyle;
  const wrapElem = document.createElement('section');
  wrapElem.innerHTML = source;
  const childElems = wrapElem.getElementsByTagName('*') as any as Element[];
  console.log(childElems);
  // удаление не разрешенных элементов
  for (const elem of childElems) {
    if (allowedElems.indexOf(elem.tagName) === -1) {
      elem.remove();
      continue;
    }

    allowedStyle = {
      'font-size': null,
      'font-family': null,
      'color': null,
      'background-color': null,
      'text-align': null,
    };
    // запоминаем значения разрешенных css свойств
    for (const key in allowedStyle) {
      if ((elem as HTMLElement).style[key] !== '') {
        allowedStyle[key] = (elem as HTMLElement).style[key];
      }
    }
    // очищаем аттрибут style
    if (elem.hasAttribute('style')) {
      elem.setAttribute('style', '');
    }
    // восстанавливаем только разрешенные свойства style
    for (const key in allowedStyle) {
      if (allowedStyle[key] !== null) {
        (elem as HTMLElement).style[key] = allowedStyle[key];
      }
    }
    // для <a> удаляем все аттрибуты кроме href
    // и добавляем аттрибут target="_blank"
    if (elem.tagName === 'A') {
      for (let i = 0; i < elem.attributes.length; i++) { //tslint:disable-line
        if (elem.attributes[i].name !== 'href') {
          elem.removeAttribute(elem.attributes[i].name);
        }
      }
      elem.setAttribute('target', '_blank');
    }
    // для <img> удаляем все аттрибуты кроме src
    if (elem.tagName === 'IMG') {
      for (let i = 0; i < elem.attributes.length; i++) { //tslint:disable-line
        if (elem.attributes[i].name !== 'src') {
          elem.removeAttribute(elem.attributes[i].name);
        }
      }
    }
  }

  return wrapElem.innerHTML;
}
