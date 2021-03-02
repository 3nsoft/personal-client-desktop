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
import { copy, IAngularStatic } from 'angular';
import { Observable, ReplaySubject } from 'rxjs';
import { share } from 'rxjs/operators';

export let ModuleName = '3nClient.services.msg-send-progress';
export let MsgSendProgressServiceName = 'msgSendProgressService';

export function addService(ng: IAngularStatic): void {
  const module = ng.module(ModuleName, []);
  module.service(MsgSendProgressServiceName, MessageSendProgressService);
}

export class MessageSendProgressService {
  private msgStatuses: {[id: string]: client3N.SendingStatus} = {};
  private msgStatuseChanged: ReplaySubject<{msgId: string, status: client3N.SendingStatus}> = new ReplaySubject(1);

  public get msgStatusChanged$(): Observable<{msgId: string, status: client3N.SendingStatus}> {
    return this.msgStatuseChanged
      .pipe(
        share(),
      );
  }

  public addMsgStatus(msgId: string, status: client3N.SendingStatus): void {
    this.msgStatuses[msgId] = copy(status);
    this.msgStatuseChanged.next({msgId, status});
  }

  public getMsgStatuses(): {[id: string]: client3N.SendingStatus} {
    return this.msgStatuses;
  }

  public getMsgStatus(msgId: string): client3N.SendingStatus {
    return this.msgStatuses[msgId] ?
      copy(this.msgStatuses[msgId]) :
      null;
  }

  public removeMsgStatus(msgId: string): void {
    if (this.msgStatuses[msgId]) {
      const finalStatus = copy(this.msgStatuses[msgId]);
      delete this.msgStatuses[msgId];
      this.msgStatuseChanged.next({msgId, status: finalStatus});
    }
  }

}
