/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. 
*/

import { Subject, Observable, Subscription } from 'rxjs'
import { SingleProc } from '../../common/services/processes' 
import { Chats } from '../common/chats'
import { loadFilesFromExternalFS } from '../common/attach-srv'
import { chatMsgPrepare, filesToLinkAndSave } from '../common/transform'
import * as CONST from '../../common/services/const'
import * as LIB from '../../common/services/lib-internal'
import * as BusMod from '../../common/services/cache-srv'
import * as ChatNetSrvMod from '../common/chat-net-srv'
import * as EmojiSrvMod from '../../common/services/emoji/emoji-srv'
import { logError } from '../../common/libs/logging';

export const ModuleName = '3nClient.components.chat-msg-create'

class Controller {
  private msgOutStream$: Subject<client3N.ChatDisplayedMessage>
  private msgOutChangeStream$: Subject<{chatMsgId: string, msgOut: 'sending'|'sended'|'read'}>
  private chatId: string
  protected changeProc: SingleProc|undefined = new SingleProc()
  private chats: Chats = new Chats()
  private inputField: string = ''
  private sendProc: Subscription
  
  static $inject = ['$scope', '$timeout', BusMod.CacheSrvName, ChatNetSrvMod.ChatNetSrvName, EmojiSrvMod.EmojiServiceName]
  constructor(
    private $scope: angular.IScope,
    private $timeout: angular.ITimeoutService,
    private $bus: BusMod.Cache,
    private _chatNetSrv: ChatNetSrvMod.Srv,
    private _emojiSrv: EmojiSrvMod.Srv
  ) {
    this.$scope.$on('$destroy', () => {
      if (this.sendProc) {
        this.sendProc.unsubscribe()
      }
    })
  }

  async createMsg(attach?: {attachments: web3n.files.ReadonlyFile[], attached: client3N.AttachFileInfo[]}): Promise<void> {
    const attachments: web3n.files.ReadonlyFile[] = attach ? attach.attachments : []
    const attached: client3N.AttachFileInfo[] = attach ? attach.attached : []
    const message = await chatMsgPrepare(this.$bus.username, this.$bus.chats.list, this.chatId, this.inputField, {attachments: attachments, attached: attached})

    this._chatNetSrv.sendChatMsg(message.msgToSend, attachments)
      .then((localAttachments) => {
        this.sendProc = Observable.create(obs => w3n.mail.delivery.observeDelivery(message.msgToSend.msgId, obs))
          .subscribe(
            undefined,
            (err) => {logError(err)},
            async () => {
              this.$bus.chats.logContent.push(message.msgToLog)
              await this.chats.saveOutMsg(this.chatId, message.msgToSend)
              await this.chats.updateLogChat(this.chatId, this.$bus.chats.logContent)
              console.log(localAttachments)
              await filesToLinkAndSave(this.chatId, localAttachments)
              this.msgOutChangeStream$.next({chatMsgId: message.msgToDisplay.msgId, msgOut: 'sended'})
            } 
          )
      })

    this.msgOutStream$.next(message.msgToDisplay)
    this.$timeout(() => {
      this.inputField = null
    })
  }

  openEmojiList(): void {
    this._emojiSrv.openEmojiList()
      .then(emoji => {
        this.inputField = this.inputField + ` ${emoji.symbol} `
        this.$timeout(() => {
          (document.querySelector('#inputField') as HTMLTextAreaElement).focus()
        })
      })
  }

  async attachFiles(): Promise<void> {
    const res = await loadFilesFromExternalFS()
    this.createMsg(res)
  }

}

const componentConfig: angular.IComponentOptions = {
  bindings: {
    msgOutStream$: '< msgOutStream',
    msgOutChangeStream$: '< msgOutChangeStream',
    chatId: '<'
  },
  templateUrl: './templates/chat/chat-msg-create/chat-msg-create.html',
  controller: Controller
}

export function addComponent(angular: angular.IAngularStatic): void {
  const module = angular.module(ModuleName, [])
  module.component('chatMsgCreate', componentConfig)
}
