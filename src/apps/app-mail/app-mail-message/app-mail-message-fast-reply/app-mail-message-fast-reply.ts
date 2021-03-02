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
import { IAngularStatic, IComponentOptions, ITimeoutService } from 'angular';
import { Message } from '../../services/message-manager/message.model';
import * as MsgSendService from '../../services/message-send.service';
import { prepareReplyBodyHTML, saveDataAfterRemoval } from '../../services/message-manager/message-manager.helper';

export const ModuleName = '3nClient.component.app-mail-message-fast-reply';

export function addComponent(ng: IAngularStatic): void {
  const mod = ng.module(ModuleName, []);
  mod.component('appMailMessageFastReply', componentConfig);
}

class AppMailMessageFastReplyComponent {
  public message: Message;
  public text: string;

  static $inject = ['$timeout', MsgSendService.MessageSendServiceName];
  constructor(
    private $timeout: ITimeoutService,
    private msgSendSrv: MsgSendService.MessageSendService,
  ) {}

  async fastReply(): Promise<void> {
    const newText = `${this.text}${prepareReplyBodyHTML(this.message.sender, this.message.timestamp, this.message.bodyHTML)}`;
    const replyMsgData: Message = new Message({
      msgId: undefined,
      msgKey: undefined,
      sender: undefined,
      senderAlias: undefined,
      mailAddresses: [this.message.sender],
      alias: undefined,
      subject: `Re: ${this.message.subject}`,
      timestamp: undefined,
      bodyHTML: newText,
      attached: undefined,
      errorsWhenSend: undefined,
    });

    await saveDataAfterRemoval(replyMsgData);
    this.msgSendSrv.runSendMessage(replyMsgData, true);
    this.$timeout(() => {
      this.text = '';
    }, 100);
  }
}

const componentConfig: IComponentOptions = {
  bindings: {
    message: '<',
  },
  templateUrl: './apps/app-mail/app-mail-message/app-mail-message-fast-reply/app-mail-message-fast-reply.html',
  controller: AppMailMessageFastReplyComponent,
};
