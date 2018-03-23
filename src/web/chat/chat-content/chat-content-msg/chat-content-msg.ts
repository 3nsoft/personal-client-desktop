/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>.
*/

import { Subject, Observable } from 'rxjs'
import * as CONST from '../../../common/services/const'
import * as LIB from '../../../common/services/lib-internal'
import * as CommonMod from '../../../common/services/common-srv'
import * as BusMod from '../../../common/services/cache-srv'
import { getInitials } from '../../../common/services/transform-contact'
import { saveFileToExternalFS } from '../../common/attach-srv'

export const ModuleName = '3nClient.components.chat-content-msg'

class Controller {
  private isGroup: boolean
  private msg: client3N.ChatDisplayedMessage
  private mId: string
  private creator: {
    name: string,
    initials: string,
    bgColor: string,
    color: string
  }
  private isSameCreator: boolean
  private prevTimestamp: number
  private msgIn: boolean
  private msgDate: string
  private attachWrapOpen: boolean = false

  static $inject = ['$scope', '$timeout', BusMod.CacheSrvName, CommonMod.CommonSrvName]
  constructor(
    private $scope: angular.IScope,
    private $timeout: angular.ITimeoutService,
    private $bus: BusMod.Cache,
    private $common: CommonMod.Srv
  ) {
    this.$timeout(() => {
      this.msgIn = !!this.msg.creator && this.msg.creator !== this.$bus.username
      this.mId = this.msgIn ? `in${this.msg.timestamp}` : `out${this.msg.timestamp}`
      this.creator = this.getCreatorInfo()
      console.log(this.msg)
    })

  }

  getMsgCreatorName(): string {
    return LIB.findNameByMail(this.$bus.contacts.list, this.msg.creator, this.$bus.username)
  }

  sameDates(): boolean {
    return LIB.convertDate(this.msg.timestamp, true) === LIB.convertDate(this.prevTimestamp, true)
  }

  sameDateTime(): boolean {
    return LIB.convertDate(this.msg.timestamp) === LIB.convertDate(this.prevTimestamp)
  }

  getMsgDate(): string {
    return LIB.convertTimestamp(this.msg.timestamp, true)
  }

  getTimestamp(): string {
    return LIB.convertTimestamp(this.msg.timestamp)
  }

  getCreatorInfo(): {name: string, initials: string, bgColor: string, color: string} {
    const name = LIB.findNameByMail(this.$bus.contacts.list, this.msg.creator, this.$bus.username)
    const initials = getInitials(this.msg.creator)
    const bgColor = LIB.getColor(initials)
    const color = LIB.invertColor(bgColor)
    return {name: name, initials: initials, bgColor: bgColor, color: color}
  }

  getFileSize(size: number): string {
    return LIB.fromByteTo(size)
  }

  async download(index: number): Promise<void> {
    console.log(this.msg.attached[index].name)
    const result = await saveFileToExternalFS(this.$bus.chats.selected, this.msg.msgId, !this.msgIn, this.msg.attached[index].name)
    if (result) {
      this.$common.sysNotification('success', null, 'The file is saved')
    } else {
      this.$common.sysNotification('error', null, 'Error writing file!')
    }
  }


}

const componentConfig: angular.IComponentOptions = {
  bindings: {
    isGroup: '<',
    msg: '<',
    isSameCreator: '<',
    prevTimestamp: '<'
  },
  templateUrl: './templates/chat/chat-content/chat-content-msg/chat-content-msg.html',
  controller: Controller
}

export function addComponent(angular: angular.IAngularStatic): void {
  const module = angular.module(ModuleName, [])
  module.component('chatContentMsg', componentConfig)
}
