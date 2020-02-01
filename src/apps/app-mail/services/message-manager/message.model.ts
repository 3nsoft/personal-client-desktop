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

import { appState } from '../../../common/services/app-store';
import { getAlias, html2text } from '../../../common/helpers';
import { sanitizeHTML } from '../../../common/helpers';

export class Message {
  public msgId: string;
  public msgKey: string;
  public sender: string;
  public senderAlias: string;
  public mailAddresses: string[];
  public alias: string[];
  public subject: string;
  public timestamp: number;
  public bodyHTML: string;
  public attached: client3N.AttachFileInfo[];
  public errorsWhenSend: client3N.ErrorWhenSend[];

  constructor(
    data?: client3N.MessageEdited,
    /*
    msgId: string = 'new',
    msgKey: string = 'out=new',
    mailAddresses: string[] = [],
    alias: string[] = [],
    subject: string = '',
    timestamp: number = Date.now(),
    bodyHTML: string = '',
    attached: client3N.AttachFileInfo[] = [],
    errorsWhenSend: client3N.ErrorWhenSend[] = [],
    */
  ) {
    this.msgId = data && data.msgId ? data.msgId : 'new';
    this.msgKey = data && data.msgKey ? data.msgKey : 'out=new';
    this.sender = data && data.sender ? data.sender : appState.values.user;
    this.senderAlias = data && data.senderAlias ?
      data.senderAlias :
      getAlias(appState.values.user);
    this.mailAddresses = data && data.mailAddresses ? data.mailAddresses : [];
    this.alias = data && data.alias ?
      data.alias :
      data && data.mailAddresses ?
        data.mailAddresses.map(addr => getAlias(addr)) :
        [];
    this.subject = data && data.subject ? data.subject : '';
    this.timestamp = data && data.timestamp ? data.timestamp : Date.now();
    this.bodyHTML = data && data.bodyHTML ? data.bodyHTML : '';
    this.attached = data && data.attached ? data.attached : [];
    this.errorsWhenSend = data && data.errorsWhenSend ? data.errorsWhenSend : [];
  }

  public createFromMessage(data: client3N.Message): void {
    this.msgId = data.msgId;
    this.msgKey = data.msgKey;
    this.sender = data.sender;
    this.mailAddresses = data.mailAddresses;
    this.subject = data.subject;
    this.timestamp = data.timestamp;
    this.bodyHTML = data.bodyHTML;
    this.attached = data.attached;
    this.errorsWhenSend = data.errorsWhenSend;
    this.senderAlias = getAlias(this.sender);
    this.alias = this.mailAddresses.map(address => getAlias(address));
  }

  public toMessage(): client3N.Message {
    this.checkMsgId();
    return {
      msgId: this.msgId,
      msgKey: this.msgKey,
      sender: this.sender,
      mailAddresses: this.mailAddresses,
      subject: this.subject,
      timestamp: this.timestamp,
      bodyHTML: this.bodyHTML,
      attached: this.attached,
      errorsWhenSend: this.errorsWhenSend,
    };
  }

  public toPreMessageListItem(): client3N.MessageListItem {
    this.checkMsgId();
    return {
      msgId: this.msgId,
      msgKey: this.msgKey,
      sender: this.sender,
      mailAddresses: this.mailAddresses,
      subject: this.subject,
      timestamp: this.timestamp,
      folderId: null,
      senderAlias: this.senderAlias,
      body: html2text(this.bodyHTML).substr(0, 50),
      attachedFilesNames: this.attached.map(item => item.name),
      isRead: null,
    };
  }

  public toOutgoingMessage(): web3n.asmail.OutgoingMessage {
    this.checkMsgId();
    const outMsg: web3n.asmail.OutgoingMessage = {
      msgType: 'mail',
      subject: this.subject,
      htmlTxtBody: sanitizeHTML(this.bodyHTML),
      recipients: this.mailAddresses,
      msgId: this.msgId,
    };
    if (this.attached && this.attached.length > 0) {
      outMsg.attachments = null;
    }
    return outMsg;
  }

  private checkMsgId(): void {
    if (this.msgId === 'new') {
      const now = Date.now();
      this.msgId = `${now}`;
      this.msgKey = `out=${now}`;
      this.timestamp = now;
    }
  }
}
