/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it
 under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License,
 or (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 or FITNESS FOR A PARTICULAR PURPOSE.
 See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program.
 If not, see <http://www.gnu.org/licenses/>.
*/
import { IAngularStatic, IScope, ITimeoutService } from 'angular';
import { appState } from '../../common/services/app-store';
import { appChatState } from '../common/app-chat-store';
import { Observable, Subject } from 'rxjs';
import { SingleProc } from '../../../common/services/processes';
import { Chat } from '../common/chat';
import { loadFilesFromExternalFS } from '../common/attach.service';
import * as ChatNetSrvMod from '../common/chat-net.service';
import * as EmojiSrvMod from '../../../common/services/emoji/emoji-srv';
import { logError } from '../../../common/services/libs/logging';
import { chatMsgPrepare, filesToLinkAndSave } from '../common/helpers';
import { takeUntil } from 'rxjs/operators';

export const ModuleName = '3nClient.components.chat-msg-create';
export function addComponent(ng: IAngularStatic): void {
  const module = ng.module(ModuleName, []);
  module.component('appChatMsgCreate', componentConfig);
}

class Controller {
  public msgOutStream$: Subject<client3N.ChatDisplayedMessage>;
  public msgOutChangeStream$: Subject<{chatMsgId: string, msgOut: 'sending'|'sended'|'read'}>;
  public chatId: string;
  public chats: Chat = new Chat();
  public inputField: string = '';
  protected changeProc: SingleProc|undefined = new SingleProc();
  private ngUnsubscribe: Subject<void> = new Subject<void>();

  static $inject = ['$scope', '$timeout', ChatNetSrvMod.ChatNetSrvName, EmojiSrvMod.EmojiServiceName];
  constructor(
    private $scope: IScope,
    private $timeout: ITimeoutService,
    private chatNetSrv: ChatNetSrvMod.Srv,
    private emojiSrv: EmojiSrvMod.Srv,
  ) {}

  $onInit(): void {
    this.chatId = appChatState.values.selected;
    appChatState
      .change$
      .selected
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(chatId => this.chatId = chatId);
  }

  $onDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public async createMsg(attach?: {attachments: web3n.files.ReadonlyFile[], attached: client3N.AttachFileInfo[]}): Promise<void> {
    const attachments: web3n.files.ReadonlyFile[] = attach ? attach.attachments : [];
    const attached: client3N.AttachFileInfo[] = attach ? attach.attached : [];
    const message = await chatMsgPrepare(
      appState.values.user,
      appChatState.values.list,
      this.chatId,
      this.inputField,
      {
        attachments,
        attached,
      },
    );

    this.chatNetSrv.sendChatMsg(message.msgToSend, attachments)
      .then(localAttachments => {
        Observable.create(obs => w3n.mail.delivery.observeDelivery(message.msgToSend.msgId, obs))
          .pipe(takeUntil(this.ngUnsubscribe))
          .subscribe(
            undefined,
            err => { logError(err); },
            async () => {
              appChatState.values.logContent.push(message.msgToLog);
              await this.chats.saveOutMsg(this.chatId, message.msgToSend);
              await this.chats.updateLogChat(this.chatId, appChatState.values.logContent);
              console.log(localAttachments);
              await filesToLinkAndSave(this.chatId, localAttachments);
              this.msgOutChangeStream$.next({chatMsgId: message.msgToDisplay.msgId, msgOut: 'sended'});
          });
      });

    this.msgOutStream$.next(message.msgToDisplay);
    this.$timeout(() => {
      this.inputField = null;
    });
  }

  public openEmojiList(): void {
    this.emojiSrv.openEmojiList()
      .then(emoji => {
        this.inputField = this.inputField + ` ${emoji.symbol} `;
        this.$timeout(() => {
          (document.querySelector('#inputField') as HTMLTextAreaElement).focus();
        });
      });
  }

  public async attachFiles(): Promise<void> {
    const res = await loadFilesFromExternalFS();
    this.createMsg(res);
  }

}

const componentConfig: angular.IComponentOptions = {
  bindings: {
    msgOutStream$: '< msgOutStream',
    msgOutChangeStream$: '< msgOutChangeStream',
  },
  templateUrl: './apps/app-chat/app-chat-msg-create/app-chat-msg-create.html',
  controller: Controller,
};
