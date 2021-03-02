/*
 Copyright (C) 2019 3NSoft Inc.

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
import { from, merge } from 'rxjs';
import { filter, flatMap, share, tap } from 'rxjs/operators';
import { appState } from '../../common/services/app-store';
import { appChatState } from './app-chat-store';
import { getAlias, getElementColor, getInitials } from '../../common/helpers';
import { Chat } from './chat';
import { NamedProcs } from '../../../common/services/processes';
import { IAngularStatic, IRootScopeService, ITimeoutService } from 'angular';
import { StateParams, StateService } from '@uirouter/angularjs';
import { inMsgToDisplayedMsg, inMsgToLogMsg, outMsgToDisplayedMsg } from './helpers';
import { logError } from '../../../common/lib/logging';

export const ModuleName = '3nClient.services.chat-net';
export const ChatNetSrvName = 'chatNetService';

export function addService(angular: IAngularStatic): void {
  const module = angular.module(ModuleName, []);
  module.service(ChatNetSrvName, Srv);
}

export class Srv {
  private chat: Chat;
  private sendProcs = new NamedProcs();

  static $inject = ['$rootScope', '$state', '$stateParams', '$timeout'];
  constructor(
    private $rootScope: IRootScopeService,
    private $state: StateService,
    private $stateParams: StateParams,
    private $timeout: ITimeoutService,
  ) {
    this.chat = new Chat();
  }

  public async sendChatMsg(
    msg: client3N.OutgoingMessage,
    attachments?: web3n.files.ReadonlyFile[],
  ): Promise<web3n.files.ReadonlyFile[]> {
    return this.sendProcs.start(msg.msgId, async ()  => {
      await w3n.mail.delivery.addMsg(msg.recipients, msg, msg.msgId, true)
        .catch(async (exc: web3n.asmail.ASMailSendException) => {
          logError(exc);
        });

      // if (msg.jsonBody.type === '001' || msg.jsonBody.type === '002') {
      if (!appChatState.values.messageWatcher.includes(msg.msgId)) {
        appChatState.values.messageWatcher.push(msg.msgId);
        w3n.mail.delivery.observeDelivery(msg.msgId, {
          next: (value: web3n.asmail.DeliveryProgress) => {}, // tslint:disable-line:no-empty
          complete: async () => {
            await w3n.mail.delivery.rmMsg(msg.msgId);
            appChatState.values.messageWatcher
              .splice(
                appChatState.values.messageWatcher.indexOf(msg.msgId),
                1,
              );
          },
          error: (err: web3n.asmail.ASMailSendException) => logError(err),
        });
      }
      // }
      return attachments || [];
    });
  }

  public async readInboxMessages(msgId: string): Promise<client3N.ChatDisplayedMessage> {
    const inMsg: client3N.IncomingMessage = await w3n.mail.inbox.getMsg(msgId)
      .catch(err => {
        logError(err);
        return null;
      });
    return inMsgToDisplayedMsg(inMsg);
  }

  public async readSendMessages(chatId: string, msgId: string): Promise<client3N.ChatDisplayedMessage> {
    const outMsg: client3N.OutgoingMessage = await this.chat.readOutMsg(chatId, msgId)
      .catch(err => {
        logError(err);
        return null;
      });
    // TODO необходимо добавить чтение файлов из локалФС
    return await outMsgToDisplayedMsg(outMsg, appState.values.user);
  }

  public async logMsgToDisplayedMsg(
    chatId: string,
    logMsg: client3N.ChatLog,
  ): Promise<client3N.ChatDisplayedMessage> {
    let result: client3N.ChatDisplayedMessage = null;
    if (logMsg.direction === 'in') {
      result = await this.readInboxMessages(logMsg.msgId);
    } else {
      result = await this.readSendMessages(chatId, logMsg.msgId);
      result.outMsg = logMsg.outMsg
        ? logMsg.outMsg
        : undefined;
    }
    return result;
  }

  /**
   * @param chatId {string}
   * @param chatName {string}
   * @param isPrimaryCreation {boolean}
   * @param timestamp {number}
   * @param mailAddresses {string[]}
   * @param reCreation? {boolean}
   */
  public async createNewChat(
    chatId: string,
    chatName: string,
    isPrimaryCreation: boolean,
    timestamp: number,
    mailAddresses: string[],
    reCreation?: boolean,
  ): Promise<void> {
    const newChat: client3N.ChatRoom = {
      chatId,
      name: chatName,
      timestamp,
      members: mailAddresses,
      isGroup: mailAddresses.length > 2,
      initials: getInitials(chatName),
      color: getElementColor(getInitials(chatName)),
      lastMsg: '',
      isRead: !reCreation,
      numberUnreadMsg: reCreation ? 1 : 0,
    };

    if (isPrimaryCreation) {
      const data: client3N.AppMsgData = {
        chatId,
        timestamp,
        isGroup: newChat.isGroup,
        name: chatName,
      };

      const msgToSend: client3N.OutgoingMessage = {
        msgId: Date.now().toFixed(),
        msgType: 'chat',
        recipients: mailAddresses.filter(addr => addr !== appState.values.user),
        jsonBody: {
          type: '001',
          data,
        },
      };

      await this.sendChatMsg(msgToSend);
    }

    this.$timeout(async () => {
      appChatState.values.list.push(newChat);
      this.prepareDataToMarkChatUnread( appChatState.values.list.length - 1);
      await this.chat.saveChatList(appChatState.values.list);
    });
  }

  public openChatFromOutsideEvent(msg: client3N.IncomingMessage, reCreation?: boolean): void {
    const isChatAvailable = appChatState.values.list
      .some(chat => chat.chatId === msg.jsonBody.data.chatId);
    if (!isChatAvailable) {
      const chatMembers = [msg.sender,  ...msg.recipients];
      const chatName = msg.recipients.length > 1
        ? msg.jsonBody.data.name
        : getAlias(msg.sender);
      this.createNewChat(
        msg.jsonBody.data.chatId,
        chatName,
        false,
        msg.jsonBody.data.timestamp,
        chatMembers,
        reCreation,
      );

    }
    if ((msg.jsonBody as client3N.AppMsg).type === '001') {
      w3n.mail.inbox.removeMsg(msg.msgId);
    }
  }

  public async initialChatContent(chatId: string): Promise<client3N.ChatDisplayedMessage[]> {
    const displayedMessages: client3N.ChatDisplayedMessage[] = [];
    const currentChatMissInMsgToLog: client3N.ChatLog[] = [];

    appChatState.values.logContent = await this.chat.readLogChat(chatId);
    const onlyInMsgs = appChatState.values.logContent
      .filter(logItem => logItem.direction === 'in');
    const lastInMsgTimestamp = onlyInMsgs.length > 0
      ? onlyInMsgs.sort((a, b) => b.timestamp - a.timestamp)[0].timestamp + 1
      : appChatState.values.list.filter(chat => chat.chatId === chatId)[0].timestamp;

    const currentChatMissInMsg$ = from(w3n.mail.inbox.listMsgs(lastInMsgTimestamp))
      .pipe(
        flatMap(msgInfos => msgInfos),
        tap(msgIfo => console.log('Q: ', msgIfo)),
        filter(msgInfo => msgInfo.msgType === 'chat'),
        flatMap(msgInfo => w3n.mail.inbox.getMsg(msgInfo.msgId), 1),
        filter(msg => ( (msg.jsonBody as client3N.AppMsg).type === '010' && (msg.jsonBody as client3N.AppMsg).data.chatId === chatId )),
        share(),
      );

    const currentChatMissInMsgToDisplay$ = currentChatMissInMsg$
      .pipe(
        filter(msg => !appChatState.values.logContent.some(logItem => logItem.msgId === msg.msgId)),
        tap(msg => {
          const logMsg = inMsgToLogMsg(msg);
          currentChatMissInMsgToLog.push(logMsg);
        }),
        flatMap(msg => inMsgToDisplayedMsg(msg)),
        tap(msg => console.log(msg)),
      );

    await merge(
      from(appChatState.values.logContent)
        .pipe(flatMap(logItem => this.logMsgToDisplayedMsg(chatId, logItem))),
        currentChatMissInMsgToDisplay$,
    )
    .pipe(
      tap(msg => displayedMessages.push(msg)),
    )
    .toPromise();

    let tmpLogContent = appChatState.values.logContent.slice();
    tmpLogContent = tmpLogContent.concat(currentChatMissInMsgToLog);
    tmpLogContent.sort((a, b) => a.timestamp - b.timestamp);
    appChatState.values.logContent = tmpLogContent.slice();
    await this.chat.updateLogChat(chatId, appChatState.values.logContent);
    displayedMessages.sort((a, b) => a.timestamp - b.timestamp);
    const chatListIndex = this.chat.getChatListIndex(chatId, appChatState.values.list);
    if (displayedMessages.length > 0) {
      appChatState.values.list[chatListIndex].lastMsg = !!displayedMessages[displayedMessages.length - 1].text
        ? displayedMessages[displayedMessages.length - 1].text.substr(0, 30)
        : '<file(s) transfer>';
    }
    return displayedMessages;
  }

  public async markChatMsgAsRead(msgId: string, chatId: string): Promise<void> {
    const chatLog = await this.chat.readLogChat(chatId);
    chatLog
      .filter(log => log.direction === 'out')
      .forEach(log => {
        if (log.outMsg) {
          log.outMsg = 'read';
          if (
            this.$state.current.name === 'root.chat.room' &&
            this.$stateParams.chatId === chatId
          ) {
            this.$rootScope
              .$broadcast(
                'chat_msg_change',
                {
                  chatMsgId: log.msgId,
                  msgOut: 'read',
                },
              );
          }
        }
      });
    w3n.mail.inbox.removeMsg(msgId);
    await this.chat.updateLogChat(chatId, chatLog);
  }

  public async markChatUnread(msg: client3N.IncomingMessage, chatId: string): Promise<void> {
    if (
      this.$state.current.name !== 'root.chat.room' ||
      (
        this.$state.current.name === 'root.chat.room' &&
        this.$stateParams.chatId !== chatId
      )
    ) {
      this.$timeout(async () => {
        const chatListIndex = this.chat.getChatListIndex(chatId, appChatState.values.list);
        if (chatListIndex > -1) {
          this.prepareDataToMarkChatUnread(chatListIndex);
          await this.chat.saveChatList(appChatState.values.list);
        } else {
          this.openChatFromOutsideEvent(msg, true);
        }
      });
    }
  }

  private prepareDataToMarkChatUnread(chatListIndex: number): void {
    let numberUnreadMessage = appChatState.values.list[chatListIndex].numberUnreadMsg
      ? appChatState.values.list[chatListIndex].numberUnreadMsg
      : 0;
    numberUnreadMessage += 1;
    const tmpChatList = appChatState.values.list.slice();
    tmpChatList[chatListIndex].numberUnreadMsg = numberUnreadMessage;
    tmpChatList[chatListIndex].isRead = false;
    appChatState.values.list = tmpChatList.slice();
    appChatState.values.unreadChatsQt = appChatState.values.list
      .reduce((sum, chat) => {
        return sum + (chat.isRead ? 0 : 1);
      }, 0);
  }
}
