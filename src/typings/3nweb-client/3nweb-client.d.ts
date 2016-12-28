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
		messageIds: string[];
	}

	interface MailFolderMapping extends MailFolderJSON {
		qtNoRead: number;
		mode: string;
	}

	interface AttachFileInfo {
		name: string;
		size: number;
		mode: string; // "not_saved", "saved", "delete"
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

	interface Notification {
		app: string;
		type: string;
		text: string;
		actionData?: {
			folderId?: string;
			msgId?: string;
		};
	}

	interface SendMailErrors {
		recipientsQt: number;
		status: string;
		errors: {
			address: string;
			error: string;
		}[];
	}

}
