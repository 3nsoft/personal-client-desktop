import { copy } from 'angular';
import { MailMessageToolbarOptions } from './app-mail-message-toolbar/app-mail-message-toolbar';
import { appMailState } from '../common/app-mail-store';

export function setFlags(message: client3N.MessageListItem): MailMessageToolbarOptions {
  let res: MailMessageToolbarOptions;
  const folderId = message.folderId;
  switch (folderId) {
  case '0': // Inbox
    res = {
      sendBtn: false,
      replyBtn: true,
      replyAllBtn: true,
      forwardBtn: true,
      actions: {
        all: true,
        editBtn: false,
        saveMsgBtn: true,
        saveAttachBtn: true,
        moveMsgBtn: true,
        unreadBtn: true,
        delMsgBtn: true,
      },
    };
    break;
  case '1': // Draft
    res = {
      sendBtn: true,
      replyBtn: false,
      replyAllBtn: false,
      forwardBtn: false,
      actions: {
        all: true,
        editBtn: true,
        saveMsgBtn: true,
        saveAttachBtn: true,
        moveMsgBtn: true,
        unreadBtn: false,
        delMsgBtn: true,
      },
    };
    break;
  case '3': // Sent
    res = {
      sendBtn: false,
      replyBtn: false,
      replyAllBtn: false,
      forwardBtn: true,
      actions: {
        all: true,
        editBtn: false,
        saveMsgBtn: true,
        saveAttachBtn: true,
        moveMsgBtn: true,
        unreadBtn: false,
        delMsgBtn: true,
      },
    };
    break;
  case '4': // Trash
    res = {
      sendBtn: false,
      replyBtn: message && message.msgKey.indexOf('in=') === 0,
      replyAllBtn: message && message.msgKey.indexOf('in=') === 0,
      forwardBtn: true,
      actions: {
        all: true,
        editBtn: false,
        saveMsgBtn: true,
        saveAttachBtn: true,
        moveMsgBtn: true,
        unreadBtn: message && message.msgKey.indexOf('in=') === 0,
        delMsgBtn: true,
      },
    };
    break;
  default:
    res = {
      sendBtn: false,
      replyBtn: message && message.msgKey.indexOf('in=') === 0,
      replyAllBtn: message && message.msgKey.indexOf('in=') === 0,
      forwardBtn: true,
      actions: {
        all: true,
        editBtn: false,
        saveMsgBtn: true,
        saveAttachBtn: true,
        moveMsgBtn: true,
        unreadBtn: message && message.msgKey.indexOf('in=') === 0,
        delMsgBtn: true,
      },
    };
    break;
  }
  return res;
}

export function setReadFlag(msgKey: string, value: boolean): void {
  const tmpAppMailState = copy(appMailState.values.messageList);
  tmpAppMailState[msgKey].isRead = value;
  appMailState.values.messageList = copy(tmpAppMailState);
}
