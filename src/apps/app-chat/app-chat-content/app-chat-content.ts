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
import {
  IAnchorScrollService,
  IAngularStatic,
  IComponentOptions,
  ILocationService,
  IScope,
  ITimeoutService,
} from 'angular';
import { merge, Observable, Subject, Subscription } from 'rxjs';
import { filter, flatMap, map, share, takeUntil, tap } from 'rxjs/operators';
import { appState } from '../../common/services/app-store';
import { appChatState } from '../common/app-chat-store';
import { NamedProcs } from '../../../common/services/processes';
import * as ChatNetSrvMod from '../common/chat-net.service';
import { Chat } from '../common/chat';
import { inMsgToDisplayedMsg, inMsgToLogMsg  } from '../common/helpers';
import { logError } from '../../../common/services/libs/logging';
import { convertTimestamp, invertColor } from '../../common/helpers';

export const ModuleName = '3nClient.components.chat-content';

export function addComponent(ng: IAngularStatic): void {
  const module = ng.module(ModuleName, []);
  module.component('appChatContent', componentConfig);
}

class Controller {
  public isWait: boolean;
  public chat: client3N.ChatRoom;
  public workProcs = new NamedProcs();
  public fsForChat: Chat;

  public msgOutStream: Subject<client3N.ChatDisplayedMessage> = new Subject();
  public msgOutChangeStream: Subject<{chatMsgId: string, msgOut: 'sending'|'sended'|'read'}> = new Subject();
  public displayedMessages: client3N.ChatDisplayedMessage[] = [];

  private ngUnsubscribe: Subject<void> = new Subject<void>();
  private subs: Record<string, Subscription> = {};

  static $inject = ['$scope', '$location', '$anchorScroll', '$timeout', ChatNetSrvMod.ChatNetSrvName];
  constructor(
    private $scope: IScope,
    private $location: ILocationService,
    private $anchorScroll: IAnchorScrollService,
    private $timeout: ITimeoutService,
    private chatNetSrv: ChatNetSrvMod.Srv,
  ) { }

  async $onInit(): Promise<void> {
    this.fsForChat = new Chat();
    // appChatState.values.logContent = await this.fsForChat
    //   .readLogChat(appChatState.values.selected);
    // console.log(appChatState.values.selected, appChatState.values.logContent);

    this.init();

    appChatState
      .change$
      .selected
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        Object.keys(this.subs)
          .forEach(key => this.subs[key].unsubscribe());
        this.init();
      });
  }

  $onDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public invertColor(color: string): string {
    return invertColor(color);
  }

  public getTimeStr(timestamp: number): string {
    return convertTimestamp(timestamp);
  }

  public openSettings($mdMenu, ev): void {
    $mdMenu.open(ev);
  }

  public getPrevTimestamp(index: number): number {
    return index !== 0
      ? this.displayedMessages[index - 1].timestamp
      : 0;
  }

  public isSameCreator(index: number): boolean {
    return index !== 0
      ? this.displayedMessages[index].creator === this.displayedMessages[index - 1].creator
      : false;
  }

  public async initialChat(): Promise<void> {
    this.isWait = true;
    const prevMsgsToDisplay = await this.chatNetSrv
      .initialChatContent(appChatState.values.selected);
    console.log(prevMsgsToDisplay);
    this.$timeout(async () => {
      this.displayedMessages = this.displayedMessages.concat(prevMsgsToDisplay);
      if (this.displayedMessages.length) {
        appChatState.values.list
          .find(chat => chat.chatId === appChatState.values.selected)
          .timestamp = this.displayedMessages[this.displayedMessages.length - 1].timestamp;
        await this.fsForChat.saveChatList(appChatState.values.list);
      }
      this.$timeout(() => {
        this.isWait = false;
      });
      if (prevMsgsToDisplay.length) {
        const lastMsg = prevMsgsToDisplay[prevMsgsToDisplay.length - 1];
        const lastMsgId = `${lastMsg.outMsg ? 'out' : 'in'}${lastMsg.timestamp}`;
        this.scrollToMsg(lastMsgId);
      }
    });

    const msgIn$ = (Observable.create(obs => w3n.mail.inbox.subscribe('message', obs)) as Observable<client3N.IncomingMessage>)
      .pipe(
        filter(msg => msg.msgType === 'chat' &&
          msg.jsonBody.type === '010' &&
          msg.jsonBody.data.chatId === appChatState.values.selected),
        tap(msg => console.log(msg)),
        share(),
      );

    this.subs.in = msgIn$
      .pipe(
        tap(msg => console.log(msg)),
        map(msg => inMsgToLogMsg(msg)),
        tap(msg => {
          const tmpLogContent = appChatState.values.logContent.slice();
          tmpLogContent.push(msg);
          appChatState.values.logContent = tmpLogContent.slice();
          this.fsForChat.updateLogChat(
            appChatState.values.selected,
            appChatState.values.logContent,
          );
        }),
        takeUntil(this.ngUnsubscribe),
      )
      .subscribe();

    this.subs.m1 = merge(
      msgIn$
        .pipe(
          flatMap(msg => inMsgToDisplayedMsg(msg)),
          tap(msg => this.sendSystemMsg()),
          takeUntil(this.ngUnsubscribe),
        ),
      this.msgOutStream.asObservable(),
    )
      .subscribe(msg => {
        this.$timeout(async () => {
          this.displayedMessages.push(msg);
          const currentChatListIndex = appChatState.values.list
            .findIndex(chat => chat.chatId === appChatState.values.selected);
          const tmpChatList = appChatState.values.list.slice();
          tmpChatList[currentChatListIndex].timestamp = this.displayedMessages[this.displayedMessages.length - 1].timestamp;
          tmpChatList[currentChatListIndex].lastMsg = this.displayedMessages[this.displayedMessages.length - 1].text
            ? this.displayedMessages[this.displayedMessages.length - 1].text.substr(0, 30)
            : '<file(s) transfer>';
          appChatState.values.list = tmpChatList.slice();
          if (msg.outMsg) {
            const msgElementId = `out${msg.timestamp}`;
            this.scrollToMsg(msgElementId);
          }
          await this.fsForChat.saveChatList(appChatState.values.list);
        });
      }, err => logError(err),
      );

    const chatMsgChangesSink = new Subject<{chatMsgId: string, msgOut: 'sending'|'sended'|'read'}>();

    this.$scope.$on(
      'chat_msg_change',
      (event, data: {chatMsgId: string, msgOut: 'sending'|'sended'|'read'}) => chatMsgChangesSink.next(data));

    this.subs.m2 = merge(
      this.msgOutChangeStream.asObservable(),
      chatMsgChangesSink.asObservable(),
    )
      .pipe(
        tap(msg => {
          const changedMsg = this.displayedMessages.find(dMsg => dMsg.msgId === msg.chatMsgId);
          if (changedMsg) {
            this.$timeout(() => {
              changedMsg.outMsg = msg.msgOut;
            });
          }
        }),
        takeUntil(this.ngUnsubscribe),
      )
      .subscribe();
  }

  public async deleteChat(): Promise<void> {
    console.log(`Delete chat with id: ${appChatState.values.selected}`);
    const chatLog = await this.fsForChat.readLogChat(appChatState.values.selected);
    const delPromises = chatLog
      .filter(log => log.direction === 'in')
      .map(log => w3n.mail.inbox.removeMsg(log.msgId));
    await Promise.all(delPromises);

    const chatIndex = this.fsForChat.getChatListIndex(
      appChatState.values.selected,
      appChatState.values.list,
    );
    if (chatIndex !== null) {
      this.$timeout(() => {
        appChatState.values.list.splice(chatIndex, 1);
        appChatState.values.selected = null;
      });
      await this.fsForChat.delChatFolder(appChatState.values.selected);
      await this.fsForChat.delLocallyChatFolder(appChatState.values.selected);
      await this.fsForChat.saveChatList(appChatState.values.list);
      appChatState.values.selected = null;
    }
  }

  public sendSystemMsg(): void {
    const timestamp = Date.now();
    const msgId = timestamp.toFixed();
    const msgToSend: client3N.OutgoingMessage = {
      msgId,
      msgType: 'chat',
      recipients: this.chat.members.filter(member => member !== appState.values.user),
      jsonBody: {
        type: '002',
        data: {
          chatId: appChatState.values.selected,
          timestamp,
          isGroup: false,
        },
      },
    };
    this.chatNetSrv.sendChatMsg(msgToSend)
      .then(() => {
        this.$timeout(() => {
          appChatState.values.list.find(chat => chat.chatId === this.chat.chatId).isRead = true;
          this.workProcs.start(msgToSend.msgId, async () => {
            this.fsForChat.saveChatList(appChatState.values.list);
          });
        });
      });
  }

  public scrollToMsg(elemId: string): void {
    this.$timeout(() => {
      this.$location.hash(elemId);
      this.$anchorScroll();
    });
  }

  private init(): void {
    this.$timeout(async () => {
      // console.log(this)
      this.displayedMessages = [];
      const currentChatListIndex = this.fsForChat.getChatListIndex(
        appChatState.values.selected,
        appChatState.values.list,
      );
      this.chat = appChatState.values.list[currentChatListIndex];
      const tmpChatList = appChatState.values.list.slice();
      tmpChatList[currentChatListIndex].isRead = true;
      tmpChatList[currentChatListIndex].numberUnreadMsg = 0;
      appChatState.values.list = tmpChatList.slice();
      appChatState.values.unreadChatsQt = appChatState.values.list
        .reduce((sum, chat) => {
          return sum + (chat.isRead ? 0 : 1);
        }, 0);
      await this.initialChat();
      if (!this.chat.isGroup) {
        this.sendSystemMsg();
      }
    });
  }

}

const componentConfig: IComponentOptions = {
  bindings: {},
  templateUrl: './apps/app-chat/app-chat-content/app-chat-content.html',
  controller: Controller,
};
