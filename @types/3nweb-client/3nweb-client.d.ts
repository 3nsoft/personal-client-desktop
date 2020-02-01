/* tslint:disable:no-namespace */
/*
 Copyright (C) 2016 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under
 the terms of the GNU General Public License as published by the Free Software
 Foundation, either version 3 of the License, or (at your option) any later
 version.

 This program is distributed in the hope that it will be useful, but
 WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with
 this program. If not, see <http://www.gnu.org/licenses/>. */

declare namespace client3N {

  type IncomingMessage = web3n.asmail.IncomingMessage;
  type OutgoingMessage = web3n.asmail.OutgoingMessage;
  type AttachmentsContainer = web3n.asmail.AttachmentsContainer;
  type MsgInfo = web3n.asmail.MsgInfo;
  type FileException = web3n.files.FileException;

  type FS = web3n.files.FS;
  type WritableVersionedFS = web3n.files.WritableFS;
  type ReadonlyFS = web3n.files.ReadonlyFS;
  type ReadonlyFile = web3n.files.ReadonlyFile;
  type WritableFS = web3n.files.WritableFS;
  type FSCollection = web3n.files.FSCollection;
  type FSItem = web3n.files.FSItem;
  type ListingEntry = web3n.files.ListingEntry;

  type ByteSource = web3n.ByteSource;
  type ByteSink = web3n.ByteSink;
  type FolderEvent = web3n.files.FolderEvent;
  type SelectCriteria = web3n.files.SelectCriteria;

  /* common  */
  interface Apps {
    id: number;
    name: string;
    icon: string;
    stateName?: string;
    fsName: string;
	isDisabled: boolean;
	unreadAmount?: number;
  }

  interface UserStatus {
    code: number;
    description: string;
  }

  type ConfirmDialogEvent = 'person_delete'|'mail_folder_delete'|'message_delete'|'messages_delete'|'clear_trash';

  interface ConfirmEventArguments<T> {
    eventType: ConfirmDialogEvent;
    value: boolean;
    data: T;
  }

  /* contacts app */
  interface Person {
    id: string;
    name: string;
    mails: string[];
    phone: string;
    notice: string;
    avatar: string;
    groupsIds: string[];
    isConfirmed: boolean;
    isBlocked: boolean;
    labels: string[];
  }

  /* mail app */

  interface MailFolder {
    id: string;
    orderNum: number;
    name: string;
    isSystem: boolean;
    icon?: string;
    messageKeys: string[];
    qtNoRead: number;
  }

  interface InboxMessageInfo extends web3n.asmail.MsgInfo {
    msgKey: string;
  }

  interface MessageBase {
    msgId: string;
    msgKey: string;
    sender: string;
    mailAddresses: string[];
    subject: string;
    timestamp: number;
  }

  interface MessageListItem extends MessageBase {
    folderId: string;
    // alias: string;
    senderAlias: string;
    body: string;
    attachedFilesNames?: string[];
    isDraft?: boolean;
    isRead: boolean;
    isSendError?: boolean;
  }

  interface Message extends MessageBase {
    bodyTxt?: string;
    bodyHTML?: string;
    attached?: AttachFileInfo[];
    errorsWhenSend?: ErrorWhenSend[];
  }

  interface MessageEdited extends Message {
    senderAlias: string;
    alias: string[];
  }

  interface AttachFileInfo {
    name: string;
    size: number;
    mode: 'toSave' | 'saved' | 'not_saved' | 'toDelete';
  }

  interface ErrorWhenSend {
    mailAddress: string;
    errorText: string;
  }

  interface SendingStatus {
    msgId: string;
    totalDataSize: number;
    sentDataSize: number;
    isComplete: boolean;
  }

  interface ChatRoom {
    chatId: string;
    name: string;
    timestamp: number;
    members: string[];
    isGroup: boolean;
    initials: string;
    color: string;
    lastMsg: string;
    isRead?: boolean;
    numberUnreadMsg?: number;
  }

  interface ChatLog {
    msgId: string;
    direction: 'in' | 'out';
    timestamp: number;
    outMsg?: 'sending'|'sended'|'read'|undefined;
    isAttached?: boolean;
  }

  interface ChatDisplayedMessage {
    creator: string;
    timestamp: number;
    text?: string;
    attached?: AttachFileInfo[];
    msgId?: string;
    outMsg?: 'sending'|'sended'|'read'|undefined;
  }

  interface AppMsg {
    type: string;
    data: AppMsgData;
  }

  interface AppMsgData {
    chatId: string;
    timestamp?: number;
    isGroup?: boolean;
    name?: string;
  }

  type Emoji = {
		groupId: string;
		symbol: string;
		note: string;
	}

  /*
	interface MessageJSON {
		msgId: string;
		msgKey?: string;
		mailAddress?: string;
		mailAddressTO?: string[];
		mailAddressCC?: string[];
		mailAddressBC?: string[];
		subject: string;
		bodyTxt?: string;
		bodyHTML?: string;
		timeCr: number;
		attached: AttachFileInfo[];
		mailAddressErrors?: string[];
		mailAddressErrorsInfo?: {[mail: string]: string};
		sourceMsgId?: string;
	}

	interface MessageAddressesAliases {
		mailAddress?: string;
		mailAddressTO?: string[];
		mailAddressCC?: string[];
		mailAddressBC?: string[];
	}

	interface MessageEditContent extends MessageJSON {
		alias: MessageAddressesAliases
	}

	interface MessageMapping {
		msgId: string;
		msgKey: string;
		mailAddress: string;
		subject: string;
		body: string;
		timeCr: number;
		isAttached: boolean;
		folderId: string;
		labels: string[];
		isOut: boolean;
		isDraft: boolean;
		isRead: boolean;
		isReply: boolean;
		isGroup: boolean;
		isSendError?: boolean;
		contactId?: number;
		initials: string;
		color: string;
	}

	interface InboxMessageInfo extends web3n.asmail.MsgInfo {
		msgKey: string;
	}

	interface Notification {
		app: string;
		type: string;
		text: string;
		actionData?: {
			folderId?: string;
			msgId?: string;
		};
	}

	interface SendMailResult {
		recipientsQt: number;
		wrongRecipientsQt?: number;
		status: 'success' | 'error';
		errors: {
			address: string;
			error: string;
		}[];
	}

	interface PersonJSON {
		personId: string;
		nickName: string;
		fullName: string;
		phone: string;
		notice: string;
		avatar: string;
	}

	interface PersonMapping {
		personId: string;
		nickName: string;
		mails: string[];
		groups: string[];
		minAvatar: string;
		letter: string;
		isConfirm: boolean;
		inBlackList: boolean;
		initials: string;
		color: string;
		labels: string[];
		mode: string;
	}

	interface PersonDataToEdit extends PersonJSON {
		mails: string[];
		groups: string[];
	}

	interface GroupJSON {
		groupId: string;
		name: string;
		notice: string;
		avatar: string;
	}

	interface GroupMapping {
		groupId: string;
		name: string;
		members: string[];
		minAvatar: string;
		isSystem: boolean;
		letter: string;
		initials: string;
		color: string;
		labels: string[];
		mode: string;
	}

	type Emoji = {
		groupId: string;
		symbol: string;
		note: string;
	}

	type Tag = {
		id: string;
		name: string;
		qt: number;
	}

	type ChatRoom = {
		chatId: string;
		name: string;
		timestamp: number;
		members: string[];
		isGroup: boolean;
		initials: string;
		color: string;
		lastMsg: string;
		isRead?: boolean;
		numberUnreadMsg?: number
	}

	type ChatLog = {
		msgId: string;
		direction: 'in' | 'out';
		timestamp: number;
		outMsg?: 'sending'|'sended'|'read'|undefined;
		isAttached?: boolean;
	}

	type ChatDisplayedMessage = {
		creator: string;
		timestamp: number;
		text?: string;
		attached?: AttachFileInfo[];
		msgId?: string;
		outMsg?: 'sending'|'sended'|'read'|undefined;
	}

	type AppMsg = {
		type: string;
		data: AppMsgData;
	}

	type AppMsgData = {
		chatId: string;
		timestamp?: number;
		isGroup?: boolean;
		name?: string;
	}

	interface FolderParams {
		placeId: string;
		location: string;
	}

	type StorageFolder = {
		id: string;
		name: string;
		icon: string;
		virtual: boolean;
		rootPath: string;
		rootPathName: string;
		placeId: string;
	}

	type FavoriteStorageFolder = {
		name: string;
		placeId: string;
		rootFolderId: string;
		path: string;
	}

	interface FolderEntity {
		type: 'file'|'link'|'folder';
		name: string;
		isNew?: boolean;
		placeId?: string;
		path: string;
		owner: any;
		date: number;
		size?: number|null;
		tags?: string[];
		isSelected?: boolean; // исп. только для storage-content
	}

	interface StorageEntity extends FolderEntity {
		isNew: boolean;
	}

	interface StatsEntry extends ListingEntry {
		size?: number;
	}

	interface SavingProgress extends StatsEntry {
		bytesSaved?: number;
		done?: boolean;
	}

	interface TrashSystemInfo {
		originalName: string;
		type: 'folder'|'file'|'link';
		placeId: string;
		path: string;
		deletionTimestamp: number;
	}

  */

}
