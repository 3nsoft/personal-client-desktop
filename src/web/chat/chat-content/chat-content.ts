/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>.
*/

import { Subject, Observable, Subscription } from 'rxjs'
import { NamedProcs } from '../../common/services/processes'
import * as CONST from '../../common/services/const';
import * as LIB from '../../common/services/lib-internal';
import * as BusMod from '../../common/services/cache-srv';
import * as ChatNetSrvMod from '../common/chat-net-srv';
import { Chats } from '../common/chats'
import { inMsgToLogMsg, inMsgToDisplayedMsg } from '../common/transform'
import { logError } from '../../common/libs/logging';

export const ModuleName = '3nClient.components.chat-content'

class Controller {
  private chatId: string
  private isWait: boolean
  private chat: client3N.ChatRoom
  private workProcs = new NamedProcs()
  private fsForChat: Chats

  private msgOutStream: Subject<client3N.ChatDisplayedMessage> = new Subject()
  private msgOutChangeStream: Subject<{chatMsgId: string, msgOut: 'sending'|'sended'|'read'}> = new Subject()
  private displayedMessages: client3N.ChatDisplayedMessage[]

  private msgInSaveLogProc: Subscription
  private displayProc: Subscription
  private changeMsgProc: Subscription

  static $inject = ['$scope', '$state', '$location', '$anchorScroll', '$timeout', BusMod.CacheSrvName, ChatNetSrvMod.ChatNetSrvName]
  constructor(
    private $scope: angular.IScope,
    private $state: angular.ui.IStateService,
    private $location: angular.ILocationService,
    private $anchorScroll: angular.IAnchorScrollService,
    private $timeout: angular.ITimeoutService,
    private $bus: BusMod.Cache,
    private _chatNetSrv: ChatNetSrvMod.Srv
  ) {
    this.displayedMessages = []
    this.fsForChat = new Chats()

    this.$timeout(() => {
      // console.log(this)
      const currentChatListIndex = this.fsForChat.getChatListIndex(this.chatId, this.$bus.chats.list)
      this.chat = this.$bus.chats.list[currentChatListIndex]
      this.$bus.chats.list[currentChatListIndex].isRead = true
      this.$bus.chats.list[currentChatListIndex].numberUnreadMsg = 0
      this.$bus.chats.unreadChatsQuantity = this.$bus.chats.list.reduce((summ, chat) => {
        return summ + (chat.isRead ? 0 : 1)
      }, 0)
      this.initial()
      if (!this.chat.isGroup) {
        this.sendSystemMsg()
      }
    })

    this.$scope.$on('$destroy', () => {
      this.msgInSaveLogProc.unsubscribe()
      this.displayProc.unsubscribe()
      this.changeMsgProc.unsubscribe()
    })
  }

  invertColor(color: string): string {
    return LIB.invertColor(color)
  }

  getTimeStr(timestamp: number): string {
    return LIB.convertTimestamp(timestamp)
  }

  openSettings($mdMenu, ev): void {
		$mdMenu.open(ev);
  }

  getPrevTimestamp(index: number): number {
    return (index !== 0) ? this.displayedMessages[index - 1].timestamp : 0
  }

  isSameCreator(index: number): boolean {
    return (index !== 0) ? (this.displayedMessages[index].creator === this.displayedMessages[index - 1].creator ? true : false) : false
  }

  async initial() {
    this.isWait = true
    const prevMsgsToDisplay  = await this._chatNetSrv.initialChatContent(this.chatId)
    // console.log(prevMsgsToDisplay)
    this.$timeout(async () => {
      this.displayedMessages = this.displayedMessages.concat(prevMsgsToDisplay)
      // console.log(this.displayedMessages)
      if (this.displayedMessages.length > 0) {
        this.$bus.chats.list.find(chat => chat.chatId === this.chatId).timestamp = this.displayedMessages[this.displayedMessages.length - 1].timestamp
        await this.fsForChat.saveChatList(this.$bus.chats.list)
      }
      this.$timeout(() => {
        this.isWait = false
      })
      if (prevMsgsToDisplay.length > 0) {
        const lastMsg = prevMsgsToDisplay[prevMsgsToDisplay.length -1]
        const lastMsgId = `${lastMsg.outMsg ? 'out' : 'in'}${lastMsg.timestamp}`
        this.scrollToMsg(lastMsgId)
      }
    })

    const msgIn$ = (Observable.create(obs => w3n.mail.inbox.subscribe('message', obs)) as Observable<client3N.IncomingMessage>)
      .filter(msg => (msg.msgType === 'chat') && (msg.jsonBody.type === '010') && (msg.jsonBody.data.chatId === this.chatId))
      .do(msg => console.log(msg))
      .share()

    this.msgInSaveLogProc = msgIn$
      .do(msg => console.log(msg))
      .map(msg => inMsgToLogMsg(msg))
      .do(msg => {
        this.$bus.chats.logContent.push(msg)
        this.fsForChat.updateLogChat(this.chatId, this.$bus.chats.logContent)
      })
      .subscribe()

    this.displayProc = msgIn$
      .flatMap(msg => inMsgToDisplayedMsg(msg))
      .do(msg => this.sendSystemMsg())
      .merge(this.msgOutStream.asObservable())
      .subscribe(
        msg => {
          this.$timeout(async() => {
            this.displayedMessages.push(msg)
            let currentChatListIndex = null
            this.$bus.chats.list.find((chat, index) => {
              if (chat.chatId === this.chatId) {
                currentChatListIndex = index
                return true
              }
            })
            this.$bus.chats.list[currentChatListIndex].timestamp = this.displayedMessages[this.displayedMessages.length - 1].timestamp
            this.$bus.chats.list[currentChatListIndex].lastMsg = !!this.displayedMessages[this.displayedMessages.length - 1].text ? this.displayedMessages[this.displayedMessages.length - 1].text.substr(0, 30) : '<file(s) transfer>'
            if (msg.outMsg) {
              const msgElementId = `out${msg.timestamp}`
              this.scrollToMsg(msgElementId)
            }
            await this.fsForChat.saveChatList(this.$bus.chats.list)
          })
        },
        err => logError(err)
      )

    const chatMsgChangesSink = new Subject<{chatMsgId: string, msgOut: 'sending'|'sended'|'read'}>()

    this.$scope.$on('chat_msg_change', (event, data: {chatMsgId: string, msgOut: 'sending'|'sended'|'read'}) => {
      chatMsgChangesSink.next(data)
    })

    this.changeMsgProc = this.msgOutChangeStream.asObservable()
      .merge(chatMsgChangesSink.asObservable())
      .do(msg => {
        let changedMsg = this.displayedMessages.find(dMsg => dMsg.msgId === msg.chatMsgId)
        if (changedMsg) {
          this.$timeout(() => {
            changedMsg.outMsg = msg.msgOut
          })
        }
      })
      .subscribe()
  }

  async deleteChat(): Promise<void> {
    console.log(`Delete chat with id: ${this.chatId}`)
    const chatLog = await this.fsForChat.readLogChat(this.chatId)
    const delPromises = chatLog
      .filter(log => log.direction === 'in')
      .map(log => w3n.mail.inbox.removeMsg(log.msgId))
    await Promise.all(delPromises)

    const chatIndex = this.fsForChat.getChatListIndex(this.chatId, this.$bus.chats.list)
    if (chatIndex !== null) {
      this.$timeout(() => {
        this.$bus.chats.list.splice(chatIndex, 1)
        this.$bus.chats.selected = null
      })
      await this.fsForChat.delChatFolder(this.chatId)
      await this.fsForChat.delLocallyChatFolder(this.chatId)
      await this.fsForChat.saveChatList(this.$bus.chats.list)
      this.$state.go('^')
    }
  }

  sendSystemMsg(): void {
    const timestamp = Date.now()
    const msgId = timestamp.toFixed()
    const msgToSend: client3N.OutgoingMessage = {
      msgId: msgId,
      msgType: 'chat',
      recipients: this.chat.members.filter(member => member !== this.$bus.username),
      jsonBody: {
        type: '002',
        data: {
          chatId: this.chatId,
          timestamp: timestamp,
          isGroup: false
        }
      }
    }
    this._chatNetSrv.sendChatMsg(msgToSend)
      .then(() => {
        this.$timeout(() => {
          this.$bus.chats.list.find(chat => chat.chatId === this.chat.chatId).isRead = true
          this.workProcs.start(msgToSend.msgId, async () => {
            this.fsForChat.saveChatList(this.$bus.chats.list)
          })
        })
      })
  }

  scrollToMsg(elemId: string): void {
    this.$timeout(() => {
      this.$location.hash(elemId)
      this.$anchorScroll()
    })
  }

}

const componentConfig: angular.IComponentOptions = {
  bindings: {
    chatId: '<'
  },
  templateUrl: './templates/chat/chat-content/chat-content.html',
  controller: Controller
}

export function addComponent(angular: angular.IAngularStatic): void {
  const module = angular.module(ModuleName, [])
  module.component('chatContent', componentConfig)
}
