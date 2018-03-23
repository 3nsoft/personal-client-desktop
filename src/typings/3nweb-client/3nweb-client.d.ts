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

	interface MailFolderJSON {
		folderId: string;
		orderNum: number;
		folderName: string;
		isSystem: boolean;
		icon?: string;
		messageIds: string[];
	}

	interface MailFolderMapping extends MailFolderJSON {
		qtNoRead: number;
		mode: string;
	}

	interface AttachFileInfo {
		name: string;
		size: number;
		mode: 'not_saved' | 'saved' | 'delete';
	}

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

	type IncomingMessage = web3n.asmail.IncomingMessage;
	type OutgoingMessage = web3n.asmail.OutgoingMessage;
	type AttachmentsContainer = web3n.asmail.AttachmentsContainer;
	type MsgInfo = web3n.asmail.MsgInfo;
	type FileException = web3n.files.FileException;
	type WritableVersionedFS = web3n.files.WritableFS;

}
