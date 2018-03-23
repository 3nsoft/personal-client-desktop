/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>.
*/

import { Observable } from 'rxjs/Rx'
import { NamedProcs } from '../../common/services/processes'
import * as CONST from '../../common/services/const';
import * as LIB from '../../common/services/lib-internal';
import * as BusMod from '../../common/services/cache-srv';
import { Chats } from './chats'
import { getInitials } from '../../common/services/transform-contact'
import { inMsgToLogMsg, inMsgToDisplayedMsg, outMsgToLogMsg, outMsgToDisplayedMsg } from './transform'
import { setTimeout } from 'timers';
import { logError } from '../../common/libs/logging';


export let ModuleName = "3nClient.services.chat-net"
export let ChatNetSrvName = "chatNetService"

export function addService(angular: angular.IAngularStatic): void {
  const module = angular.module(ModuleName, [])
  module.service(ChatNetSrvName, Srv)
}

export class Srv {
  private chats: Chats
  private observeSendings: string[] = []
  private sendProcs = new NamedProcs()

  static $inject = ['$rootScope', '$state', '$stateParams', '$timeout', BusMod.CacheSrvName]
  constructor(
    private $rootScope: angular.IRootScopeService,
    private $state: angular.ui.IStateService,
    private $stateParams: angular.ui.IStateParamsService,
    private $timeout: angular.ITimeoutService,
    private $bus: BusMod.Cache
  ) {
    this.chats = new Chats()
  }

  async sendChatMsg(msg: client3N.OutgoingMessage, attachments?: web3n.files.ReadonlyFile[]): Promise<web3n.files.ReadonlyFile[]> {
    return this.sendProcs.start(msg.msgId, async ()  => {
      await w3n.mail.delivery.addMsg(msg.recipients, msg, msg.msgId, true)
        .catch(async (exc: web3n.asmail.ASMailSendException) => {
          logError(exc)
        })

      // if (msg.jsonBody.type === '001' || msg.jsonBody.type === '002') {
        if (!this.$bus.general.observeSendings.includes(msg.msgId)) {
          this.$bus.general.observeSendings.push(msg.msgId)
          w3n.mail.delivery.observeDelivery(msg.msgId, {
            next: (value: web3n.asmail.DeliveryProgress) => {},
            complete: async () => {
              await w3n.mail.delivery.rmMsg(msg.msgId)
              this.$bus.general.observeSendings.splice(this.$bus.general.observeSendings.indexOf(msg.msgId), 1)
            },
            error: (err: web3n.asmail.ASMailSendException) => { logError(err) }
          })
        }
      // }
      return attachments || []
    })
  }

  async readInboxMessages(msgId: string): Promise<client3N.ChatDisplayedMessage> {
    const inMsg: client3N.IncomingMessage = await w3n.mail.inbox.getMsg(msgId)
      .catch(err => {
        logError(err)
        return null
      })
    return inMsgToDisplayedMsg(inMsg)
  }

  async readSendMessages(chatId: string, msgId: string): Promise<client3N.ChatDisplayedMessage> {
    const outMsg: client3N.OutgoingMessage = await this.chats.readOutMsg(chatId, msgId)
      .catch(err => {
        logError(err)
        return null
      })
    // TODO необходимо добавить чтение файлов из локалФС
    const result = await outMsgToDisplayedMsg(outMsg, this.$bus.username)
    return result
  }

  async logMsgToDisplayedMsg(chatId: string, logMsg: client3N.ChatLog): Promise<client3N.ChatDisplayedMessage> {
    let result: client3N.ChatDisplayedMessage = null
    if (logMsg.direction === 'in') {
      result = await this.readInboxMessages(logMsg.msgId)
    } else {
      result = await this.readSendMessages(chatId, logMsg.msgId)
      result.outMsg = (logMsg.outMsg) ? logMsg.outMsg : undefined
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
  async createNewChat(chatId: string, chatName:string, isPrimaryCreation: boolean, timestamp: number, mailAddresses: string[],reCreation?: boolean): Promise<void> {
    const newChat: client3N.ChatRoom = {
      chatId: chatId,
      name: chatName,
      timestamp: timestamp,
      members: mailAddresses,
      isGroup: (mailAddresses.length > 2) ? true : false,
      initials: getInitials(chatName),
      color: LIB.getColor(getInitials(chatName)),
      lastMsg: '',
      isRead: reCreation ? false : true,
      numberUnreadMsg: reCreation ? 1 : 0
    }

    if (isPrimaryCreation) {
      const data: client3N.AppMsgData = {
        chatId,
        timestamp,
        isGroup: newChat.isGroup,
        name: chatName
      }

      const msgToSend: client3N.OutgoingMessage = {
        msgId: Date.now().toFixed(),
        msgType: 'chat',
        recipients: mailAddresses.filter(addr => addr !== this.$bus.username),
        jsonBody: {
          type: '001',
          data
        }
      }

      await this.sendChatMsg(msgToSend)
    }

    this.$timeout(async () => {
      this.$bus.chats.list.push(newChat)
      this.prepareDataToMarkChatUnread(this.$bus.chats.list.length - 1)
      await this.chats.saveChatList(this.$bus.chats.list)
    })
  }

  openChatFromOutsideEvent(msg: client3N.IncomingMessage, reCreation?: boolean): void {
    // console.log(this.$state)
    const isChatAvailable = this.$bus.chats.list.some(chat => chat.chatId === msg.jsonBody.data.chatId)
    if (!isChatAvailable) {
      const chatMembers = [msg.sender,  ...msg.recipients]
      const chatName = (msg.recipients.length > 1) ? msg.jsonBody.data.name : LIB.findNameByMail(this.$bus.contacts.list, msg.sender)
      this.createNewChat(msg.jsonBody.data.chatId, chatName, false, msg.jsonBody.data.timestamp, chatMembers, reCreation)

    }
    if ((msg.jsonBody as client3N.AppMsg).type === '001') {
      w3n.mail.inbox.removeMsg(msg.msgId)
    }
  }

  async initialChatContent(chatId: string): Promise<client3N.ChatDisplayedMessage[]> {
    let displayedMessages: client3N.ChatDisplayedMessage[] = []
    let currentChatMissInMsgToLog: client3N.ChatLog[] = []

    this.$bus.chats.logContent = await this.chats.readLogChat(chatId)
    const onlyInMsgs = this.$bus.chats.logContent
      .filter(logItem => logItem.direction === 'in')
    const lastInMsgTimestamp = (onlyInMsgs.length > 0) ? onlyInMsgs.sort((a, b) => b.timestamp - a.timestamp)[0].timestamp + 1 : this.$bus.chats.list.filter(chat => chat.chatId === chatId)[0].timestamp

    const currentChatMissInMsg$ = Observable.fromPromise(w3n.mail.inbox.listMsgs(lastInMsgTimestamp))
      .flatMap(msgInfos => msgInfos)
      .filter(msgInfo => msgInfo.msgType === 'chat')
      .flatMap(msgInfo => w3n.mail.inbox.getMsg(msgInfo.msgId), 1)
      .filter(msg => ( (msg.jsonBody as client3N.AppMsg).type === '010'
        &&
        (msg.jsonBody as client3N.AppMsg).data.chatId === chatId ))
      .share()

    const currentChatMissInMsgToDisplay$ = currentChatMissInMsg$
      .filter(msg => {
        const msgIsPresent = this.$bus.chats.logContent.some(logItem => logItem.msgId === msg.msgId)
        return !msgIsPresent
      })
      .do(msg => {
        const logMsg = inMsgToLogMsg(msg)
        currentChatMissInMsgToLog.push(logMsg)
      })
      .flatMap(msg => inMsgToDisplayedMsg(msg))
      .do(msg => console.log(msg))

    await Observable.from(this.$bus.chats.logContent)
      .flatMap(logItem => this.logMsgToDisplayedMsg(chatId, logItem))
      .merge(currentChatMissInMsgToDisplay$)
      .do(msg => displayedMessages.push(msg))
      .toPromise()

    this.$bus.chats.logContent = this.$bus.chats.logContent.concat(currentChatMissInMsgToLog)
    this.$bus.chats.logContent.sort((a, b) => a.timestamp - b.timestamp)
    await this.chats.updateLogChat(chatId, this.$bus.chats.logContent)

    displayedMessages.sort((a, b) => a.timestamp - b.timestamp)

    const chatListIndex = this.chats.getChatListIndex(chatId, this.$bus.chats.list)
    if (displayedMessages.length > 0) {
      this.$bus.chats.list[chatListIndex].lastMsg = !!displayedMessages[displayedMessages.length - 1].text ?  displayedMessages[displayedMessages.length - 1].text.substr(0, 30) : '<file(s) transfer>'
    }
    return displayedMessages
  }

  async markChatMsgAsRead(msgId: string, chatId: string): Promise<void> {
    const chatLog = await this.chats.readLogChat(chatId)
    chatLog
      .filter(log => log.direction === 'out')
      .forEach(log => {
        if (log.outMsg) {
          log.outMsg = 'read'
          if (this.$state.current.name === 'root.chat.room' && this.$stateParams.chatId === chatId) {
          this.$rootScope.$broadcast('chat_msg_change', {chatMsgId: log.msgId, msgOut: 'read'})
          }
        }
      })
    w3n.mail.inbox.removeMsg(msgId)
    await this.chats.updateLogChat(chatId, chatLog)
  }

  private prepareDataToMarkChatUnread(chatListIndex: number): void {
    let numberUnreadMessage = (this.$bus.chats.list[chatListIndex].numberUnreadMsg) ? this.$bus.chats.list[chatListIndex].numberUnreadMsg : 0
    numberUnreadMessage += 1
    this.$bus.chats.list[chatListIndex].numberUnreadMsg = numberUnreadMessage
    this.$bus.chats.list[chatListIndex].isRead = false
    this.$bus.chats.unreadChatsQuantity = this.$bus.chats.list.reduce((summ, chat) => {
      return summ + (chat.isRead ? 0 : 1)
    }, 0)
  }

  async markChatUnread(msg: client3N.IncomingMessage, chatId: string): Promise<void> {
    if (this.$state.current.name !== 'root.chat.room' || (this.$state.current.name === 'root.chat.room' && this.$stateParams.chatId !== chatId)) {
      this.$timeout(async () => {
        const chatListIndex = this.chats.getChatListIndex(chatId, this.$bus.chats.list)
        if (chatListIndex !== null) {
          this.prepareDataToMarkChatUnread(chatListIndex)
          await this.chats.saveChatList(this.$bus.chats.list)
        } else {
          this.openChatFromOutsideEvent(msg, true)
        }
      })
    }
  }


}
