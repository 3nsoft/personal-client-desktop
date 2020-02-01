import { copy } from 'angular';
import { appContactsState } from '../../../app-contact/common/app-contact-store';
import { appMailState, messageSyncedFS } from '../../common/app-mail-store';
import { Message } from './message.model';
import { getAlias } from '../../../common/helpers';
import { SYS_MAIL_FOLDERS } from '../../../../common/const';

export async function prepareMsgForMessageManager(id: string, preparedData?: client3N.MessageEdited): Promise<Message> {
  if (id === 'new' && !preparedData) {
    return new Message();
  }

  if (id === 'new' && preparedData) {
    return new Message(preparedData);
  }

  const msgKey = Object.keys(appMailState.values.messageList)
    .find(key => appMailState.values.messageList[key].msgId === id);
  const folderId = appMailState.values.messageList[msgKey].folderId;
  const res = await messageSyncedFS.readJsonDataFromFS<client3N.Message>(
    folderId,
    msgKey,
    'data.json',
  );

  if (res) {
    const alias: string[] = res.mailAddresses.map(address => getAlias(address));
    const senderAlias: string = getAlias(res.sender);
    const data: client3N.MessageEdited = {...res, alias, senderAlias};
    return new Message(data);
    // setChipsStyle(alias);
  }
  return new Message();
}

const MODAL_TITLE: {[key: string]: string} = {
  create: 'New Mail',
  edit: 'Edit Mail',
  reply: 'Reply',
  replyAll: 'Reply to all',
};

export function getTitleText(id: string, action: string): string {
  switch (action) {
    case 'create':
      return (!id || id === 'new') ? MODAL_TITLE.create : null;
    case 'reply':
      return (!id || id === 'new') ? MODAL_TITLE.reply : null;
    case 'replyAll':
      return (!id || id === 'new') ? MODAL_TITLE.replyAll : null;
    default:
      return MODAL_TITLE.create;
  }
}

export function contactsSearch(search: string): client3N.Person[] {
  const transformSearch = search.toLocaleLowerCase();
  const arrayPerson = Object.keys(appContactsState.values.list).map(key => appContactsState.values.list[key]);
  return arrayPerson
    .filter(
      (item: client3N.Person) => item.name.toLocaleLowerCase().indexOf(transformSearch) > -1 ||
        item.mails[0].toLocaleLowerCase().indexOf(transformSearch) > -1);
}

export async function saveDataAfterRemoval(message: Message): Promise<void> {
  const dataForSave = message.toMessage();
  console.log(dataForSave);
  if (message.attached && message.attached.length > 0) {
    console.log('Rename first ...');
    await messageSyncedFS.renameFolder(
      `${SYS_MAIL_FOLDERS.draft}/out=new`,
      `${SYS_MAIL_FOLDERS.draft}/${dataForSave.msgKey}`,
    );
  }
  await messageSyncedFS.saveJsonDataToFS<client3N.Message>(
    SYS_MAIL_FOLDERS.draft,
    dataForSave.msgKey,
    'data.json',
    dataForSave,
  );
  const messageListItemData = message.toPreMessageListItem();
  messageListItemData.folderId = SYS_MAIL_FOLDERS.draft;
  messageListItemData.isRead = true;
  const tmpMessageList = copy(appMailState.values.messageList);
  tmpMessageList[messageListItemData.msgKey] = messageListItemData;
  appMailState.values.messageList = copy(tmpMessageList);
}

export function prepareReplyBodyHTML(addrFrom: string, timestamp: number, bodyHTML: string): string {
  const date = new Date(timestamp);
  const wrapElement = document.createElement('div');
  const quote = document.createElement('blockquote');
  quote.innerHTML = bodyHTML;
  wrapElement.appendChild(quote);
  return `<br><br><p>-- Sent from ${addrFrom} at ${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}</p><br>${wrapElement.innerHTML}`; // tslint:disable-line
}

export function prepareForwardBodyHTML(addrFrom: string, timestamp: number, bodyHTML: string): string {
  const date = new Date(timestamp);
  return `<br><br><p>-- Forwarded message from ${addrFrom} at ${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()} --</p><br>${bodyHTML}`; // tslint:disable-line
}
