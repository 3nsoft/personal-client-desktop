/* tslint:disable:max-line-length */
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

import { IAngularStatic, uiNotification } from 'angular';
import { html2text } from '../../../common/helpers/forHTML';
import { logError } from '../../../../common/services/libs/logging';

export const ModuleName = '3nClient.services.message-manager-helpers';
export const MessageManagerHelpersServiceName = 'messageManagerHelpersService';

export function addService(ng: IAngularStatic): void {
  const module = ng.module(ModuleName, []);
  module.service(MessageManagerHelpersServiceName, MessageManagerHelpersService);
}

export class MessageManagerHelpersService {
  static $inject = [ 'Notification' ];

  constructor(
    private Notification: uiNotification.INotificationService,
  ) {}

  async saveMsgContent(content: client3N.MessageEdited, mode: 'html' | 'text'): Promise<void> {
    let title = '';
    let outFileName: string = null;
    let saveContent = '';

    switch (mode) {
      case 'html':
        title = 'Save message as HTML';
        outFileName = `msg${content.timestamp.toString()}.html`;
        saveContent = `<div style="font-size: 14px; position: relative; width: 100%"><div><b>FROM: </b>${content.senderAlias}</div><div><b>TO: </b>`;
        saveContent = saveContent + (content.alias && content.alias.length > 0 ? content.alias.join(', ') : '');
        saveContent = saveContent + `</div><br><div><b>SUBJECT: </b> ${content.subject}</div><div style="position: relative; with: 100%; height: 1px; border-bottom: 1px solid rgba(0,0,0,0.12)"></div><br>${content.bodyHTML}</div></br>`;
        if (content.attached.length !== 0) {
          saveContent = saveContent + `<div style="font-size: 14px; position: relative; width: 100%"><b>ATTACHED: </b>`;
          content.attached.forEach(item => {
            saveContent = saveContent + `<span>${item.name}(${item.size}) </span>`;
          });
          saveContent = saveContent + '</div>';
        }
        break;
      case 'text':
        title = 'Save message as text';
        outFileName = `msg${content.timestamp.toString()}.txt`;
        saveContent = saveContent + 'FROM: ' + content.senderAlias + '\n';
        saveContent = saveContent + 'TO: ' + (content.alias && content.alias.length > 0 ? content.alias.join(', ') : '') + '\n';
        saveContent = saveContent + '\nSUBJECT: ' + content.subject + '\n';
        saveContent = saveContent + '---------------------------------------------\n\n';
        saveContent = saveContent + html2text(content.bodyHTML) + '\n\n';
        if (content.attached.length !== 0) {
          saveContent = saveContent + 'ATTACHED: ';
          content.attached.forEach(item => {
            saveContent = saveContent + item.name + '(' + item.size + ')  ';
          });
        }
        break;
    }

    const outFile = await w3n.device.saveFileDialog(title, null, outFileName);
    if (outFile) {
      await outFile.writeTxt(saveContent)
        .catch(err => {
          logError(err);
          this.Notification.error({message: 'Error on writing file!'});
        })
        .then(() => {
          return;
        });
      this.Notification.success({message: 'The file is saved!'});
    }

  }
}
