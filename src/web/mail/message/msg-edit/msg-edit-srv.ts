/*
 Copyright (C) 2016 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. */

import * as LIB from '../../../common/services/lib-internal';
import * as CONST from '../../../common/services/const';
import * as Transform from '../../../common/services/transform-mail';
import * as CacheSrvMod from '../../../common/services/cache-srv';
import * as CommonSrvMod from '../../../common/services/common-srv';
import * as NotifSrvMod from '../../../common/services/notifications/notifications-srv';
import * as MailFoldersFsSrv from '../../mail-folders/mail-folders-fs-srv';
import * as MailFsSrvMod from '../../mail-app/mail-fs-srv';
import * as MsgAttachSrvMod from '../msg-attach/msg-attach-srv';
import { logError } from '../../../common/libs/logging';

export let ModuleName = "3nClient.services.msg-edit";
export let MsgEditSrvName = "msgEditService";

export function addService(angular: angular.IAngularStatic): void {
  let mod = angular.module(ModuleName, []);
  mod.service(MsgEditSrvName, Srv);
}

interface MsgEditScope extends angular.IScope {
  data: client3N.MessageEditContent;
  attachments: web3n.files.File[];
  closeForm(): void;
}

interface MsgMoveScope extends angular.IScope {
  MAIL_FOLDER_IDS: { [key: string]: string };
  foldersList: { [id: string]: client3N.MailFolderMapping };
  currentFolder: string;
  targetFolder: string;
  cancel(): void;
  ok(): void;
}

export class Srv {

	static $inject = ['$rootScope', '$state', '$q', '$mdDialog', CacheSrvMod.CacheSrvName, CommonSrvMod.CommonSrvName, NotifSrvMod.NotificationsSrvName, MailFsSrvMod.MailFsSrvName, MsgAttachSrvMod.MsgAttachSrvName, MailFoldersFsSrv.MailFoldersFsSrvName];
	constructor(
    private $rootScope: angular.IRootScopeService,
    private $state: angular.ui.IStateService,
    private $q: angular.IQService,
    private $mdDialog: angular.material.IDialogService,
    private _cacheSrv: CacheSrvMod.Cache,
    private _commonSrv: CommonSrvMod.Srv,
    private _notifSrv: NotifSrvMod.Srv,
    private _mailFsSrv: MailFsSrvMod.Srv,
    private _attachSrv: MsgAttachSrvMod.Srv,
    private _foldersFsSrv: MailFoldersFsSrv.Srv
	) { }
	
  editMsg(message: client3N.MessageEditContent): angular.IPromise<{ status: string, msgId: string }> {
    let editMessage = angular.copy(message);
		return (this.$mdDialog as any).show({
      parent: angular.element(document.body),
      clickOutsideToClose: false,
      escapeToClose: false,
      fullscreen: false,
      templateUrl: './templates/mail/message/msg-edit/msg-edit-form.html',
      controller: ['$scope', '$mdDialog', ($scope: MsgEditScope, $mdDialog: angular.material.IDialogService) => {
        $scope.data = editMessage;
        console.log($scope.data);

        $scope.closeForm = (): void => {
          if (!$scope.$$childTail.msgEditForm.$pristine) {
            $scope.$broadcast('client_runMsgSavingToDraftProcess');
            // "отлавливаем" событие в контроллере компонента 'msg-edit' и запускаем процесс записи редактируемого/создаваемого сообщения в папку Draft
          } else {
            $mdDialog.cancel({ status: "close_without_save", msgId: null });
          }  
        };

        $scope.$on('client_endMsgSavingToDraftProcess', (event, res: {msgId: string, attached?: client3N.AttachFileInfo[]}) => {
          $mdDialog.cancel({ status: "close_with_save", msgId: res.msgId });
        });

        $scope.$on('client_cancelEditMsg', () => {
          $mdDialog.cancel({ status: "close_without_save", msgId: null });
        });

        $scope.$on('client_sendingEditMsg', () => {
          $mdDialog.hide({ status: "sending", msgId: $scope.data.msgId });
        });

      }]
		})
      .then((res) => {
        return res;
		}, (err) => {
      return err;
    });
  }

  /**
   * подготовка сообщения для пересылки (forward)
   * @param initialMsg {client3N.MessageEditContent} - сообщение, которое необходимо переслать
   * @param mode 
   * @returns {client3N.MessageEditContent}
   */
  prepareMsgForForwardAndReply(initialMsg: client3N.MessageEditContent, mode: 'reply' | 'replyAll' | 'forward'): client3N.MessageEditContent {
    let preparedMsg = angular.copy(initialMsg);
    preparedMsg.sourceMsgId = angular.copy(initialMsg.msgId);
    preparedMsg.msgId = preparedMsg.msgKey = 'new';
    preparedMsg.mailAddress = this._cacheSrv.username;
    const beginReplyText = `Sent from ${initialMsg.mailAddress} at ${LIB.convertDate(initialMsg.timeCr)}`;

    let tmpAddressArray: string[];

    preparedMsg.mailAddressTO = [];
    preparedMsg.mailAddressCC = [];
    preparedMsg.mailAddressBC = [];
    preparedMsg.alias = {
      mailAddress: LIB.findNameByMail(this._cacheSrv.contacts.list, preparedMsg.mailAddress, this._cacheSrv.username),
      mailAddressTO: [],
      mailAddressCC: [],
      mailAddressBC: []
    };

    if (mode !== 'forward') {
      preparedMsg.subject = `Re: ${initialMsg.subject}`;
      // preparedMsg.bodyHTML = `<br><i style="color: rgba(0,0,0,0.56)">${beginReplyText}</i><br><div class="quote">${initialMsg.bodyHTML}</div>`;
      // preparedMsg.bodyHTML = `<br><i style="color: rgba(0,0,0,0.56)">${beginReplyText}</i><br>${initialMsg.bodyHTML}`;
      // preparedMsg.bodyHTML.replace(/<div>/g, '<div style="margin-left: 10px !important; padding-left: 15px !important; border-left: 1px solid #195f97;">');

      let tmp = `<br><i style="color: rgba(0,0,0,0.56)">${beginReplyText}</i><br>${initialMsg.bodyHTML}`;
      let tmp01 = tmp.replace(/<div>/g, '<blockquote>');
      preparedMsg.bodyHTML = tmp01.replace(/<\/div>/g, '<\/blockquote>');

      preparedMsg.mailAddressTO = [initialMsg.mailAddress];
      preparedMsg.alias.mailAddressTO = [LIB.findNameByMail(this._cacheSrv.contacts.list, initialMsg.mailAddress, this._cacheSrv.username)];
      preparedMsg.attached = [];
      if (mode === 'replyAll') {
        preparedMsg.alias.mailAddressTO = [];
        tmpAddressArray = initialMsg.mailAddressTO.concat(initialMsg.mailAddressCC);
        for (let addr of tmpAddressArray) {
          if (addr !== this._cacheSrv.username) {
            // preparedMsg.mailAddressCC.push(addr);
            preparedMsg.mailAddressTO.push(addr);
          }
        }
        // for (let addr of preparedMsg.mailAddressCC) {
        //   preparedMsg.alias.mailAddressCC.push(LIB.findNameByMail(this._cacheSrv.contacts.list, addr, this._cacheSrv.username));
        // }
        for (let addr of preparedMsg.mailAddressTO) {
          preparedMsg.alias.mailAddressTO.push(LIB.findNameByMail(this._cacheSrv.contacts.list, addr, this._cacheSrv.username));
        } 
      }
    }

    return preparedMsg;
  }
  
  /**
   * запись сообщения в папку в ФС
   * @param content {client3N.MessageEditContent}
   * @param attachments {web3n.files.File[]}
   * @param folderId {string}
   * @returns {string} - msgId
   */
  async saveMsgToFolder(content: client3N.MessageEditContent, attachments: web3n.files.File[], folderId: string): Promise<{msgId: string; attached: client3N.AttachFileInfo[]}> {
    // подготовка к записи различных "сущностей"" сообщения (без приатаченных файлов)
    let msgJson = Transform.msgEditToJson(content);
    if (msgJson.msgId === 'new') {
      msgJson.msgId = Transform.newMsgId();
      msgJson.msgKey = Transform.newMsgKey('out', msgJson.msgId);
      msgJson.timeCr = Number(msgJson.msgId);
      let currentMsgMapping = Transform.msgJsonToMapping(msgJson, folderId);
      this._cacheSrv.messages.list[msgJson.msgId] = angular.copy(currentMsgMapping);
    } else {
      msgJson.timeCr = new Date().getTime();
      this._cacheSrv.messages.list[msgJson.msgId].timeCr = msgJson.timeCr;
    }

    // "обработка" приатаченных файлов:
    // - удаление, помеченных на удаление;
    // - сохранение ранее не сохраненных;
    let itemsToRecordIndex = 0;
    let itemsToDelete: number[] = [];
    let savePromises: Promise<void>[] = [];
    let deletePromises: Promise<boolean>[] = [];

    if (content.attached.length > 0) {
      for (let i = 0; i < content.attached.length; i++) {
        if (content.attached[i].mode === 'not_saved') {
          savePromises.push(this._attachSrv.saveFileTo3NStorage(folderId, msgJson.msgKey, content.attached[i].name, attachments[itemsToRecordIndex]));
          itemsToRecordIndex += 1;
        }
        if (content.attached[i].mode === 'delete') {
          deletePromises.push(this._attachSrv.deleteFileFrom3NStorage(folderId, msgJson.msgKey, content.attached[i].name));
          itemsToDelete.unshift(i);
        }
      }
    }

    let saveOperationStatus = await LIB.waitAll<void>(savePromises);
    let deleteOperationStatus = await LIB.waitAll<boolean>(deletePromises);

    let isSaveOperationSuccess = true;
    let isDeleteOperationSuccess = true;

    for (let result of saveOperationStatus) {
      if (!!result.error) {
        isSaveOperationSuccess = false;
        break;
      }
    }

    for (let result of deleteOperationStatus) {
      if (!!result.error) {
        isDeleteOperationSuccess = false;
        break;
      }
    }

    if (isDeleteOperationSuccess) {
      for (let index of itemsToDelete) {
        msgJson.attached.splice(index, 1);
      }
    }

    if (isSaveOperationSuccess) {
      for (let item of msgJson.attached) {
        item.mode = (item.mode === 'not_saved') ? 'saved' : item.mode;
      }
    }

    // запись содержимого сообщения
    const isMsgSaveOperationSuccess = await this._mailFsSrv.writeMsgData(folderId, msgJson);

    if (isSaveOperationSuccess && isDeleteOperationSuccess && isMsgSaveOperationSuccess) {
      return { msgId: msgJson.msgId, attached: msgJson.attached };
    } else {
      await this._mailFsSrv.deleteFolder(`${folderId}/${msgJson.msgKey}`);
      return null;
    }

  }

  /**
   * запуск процедуры удаления сообщения
   * @param msgId {string}
   */
  deleteMessage(msgId: string): angular.IPromise<void> {
    const folderId = this._cacheSrv.messages.list[msgId].folderId;
    const msgPosition = this._cacheSrv.folders.list[folderId].messageIds.indexOf(msgId);
    const isDeleteForever = (folderId === CONST.SYS_MAIL_FOLDERS.trash) ? true : false;

    if (isDeleteForever) {
      const confirm: angular.material.IConfirmDialog = this.$mdDialog.confirm()
        .title('Are you sure you want to delete this message?')
        .ariaLabel('delete dialog')
        .ok('Yes')
        .cancel('No');
      
      return this.$mdDialog.show(confirm)
        .then(() => {
          const path = `${folderId}/${this._cacheSrv.messages.list[msgId].msgKey}`;
          if (msgPosition !== -1) this._cacheSrv.folders.list[folderId].messageIds.splice(msgPosition, 1);
          delete this._cacheSrv.messages.list[msgId];

          return this.$q.when(this._mailFsSrv.writeMsgList())
            .then(() => {
              return this.$q.when(this._foldersFsSrv.writeFolderList());
            })
            .then(() => {
              return this.$q.when(this._mailFsSrv.deleteFolder(path))
            })
            .then((res) => {
              this._commonSrv.sysNotification('success', null, 'The message deleted successfully!');
            })
            .catch(() => {
              this._commonSrv.sysNotification('error', null, 'Error deleting message!');
            });
        });  

    } else {
      return this.$q.when(this._mailFsSrv.moveMsgInsideFS(msgId, CONST.SYS_MAIL_FOLDERS.trash))
        .then((res) => {
          let notifIndex = this._notifSrv.findInService(msgId);
          if (notifIndex > -1) {
            this._notifSrv.deleteNotification(notifIndex);
          }
          this._commonSrv.sysNotification('success', null, 'The message was moved to Trash!')
          this.$state.transitionTo('root.mail.folder', { folderId: folderId }, { reload: true });
        })
        .catch(() => {
          this._commonSrv.sysNotification('error', null, 'Error deleting message!');
        });
    }
  }

  /**
   * сохранение содержимого сообщения во внешнюю ФС
   * @param content {client3N.MessageEditContent}
   * @param mode {'html' | 'text'}
   */
  async saveMsgContent(content: client3N.MessageEditContent, mode: 'html' | 'text'): Promise<void> {
    let title = '';
    let outFileName: string = null;
    let saveContent = '';
    const isOut = this._cacheSrv.messages.list[content.msgId].isOut;

    switch (mode) {
      case 'html':
        title = 'Save message as HTML';
        outFileName = `msg${content.timeCr.toString()}.html`;
        saveContent = `<div style="font-size: 14px; position: relative; width: 100%"><div><b>FROM: </b>${content.mailAddress}</div><div><b>TO: </b>`;
        saveContent = saveContent + ((!!content.mailAddressTO) ? content.mailAddressTO.join(', ') : '');
        saveContent = saveContent + `</div><div><b>COPY: </b>`;
        saveContent = saveContent + ((!!content.mailAddressCC) ? content.mailAddressCC.join(', ') : '');
        saveContent = saveContent + `</div><div><b>HIDDEN COPY: </b>`;
        saveContent = saveContent + ((!!content.mailAddressBC) ? content.mailAddressBC.join(', ') : '');
        saveContent = saveContent + `</div><br><div><b>SUBJECT: </b> ${content.subject}</div><div style="position: relative; with: 100%; height: 1px; border-bottom: 1px solid rgba(0,0,0,0.12)"></div><br>${content.bodyHTML}</div></br>`;
        if (content.attached.length !== 0) {
           saveContent = saveContent + `<div style="font-size: 14px; position: relative; width: 100%"><b>ATTACHED: </b>`;
           for (let item of content.attached) {
             saveContent = saveContent + `<span>${item.name}(${item.size}) </span>`;
           }
           saveContent = saveContent + "</div>";
         }
        break;
      case 'text':
        title = "Save message as text";
         outFileName = `msg${content.timeCr.toString()}.txt`;
         saveContent = saveContent + 'FROM: ' + ((!!content.mailAddress) ? content.mailAddress : '') + '\n';
         saveContent = saveContent + 'TO: ' + ((!!content.mailAddressTO) ? content.mailAddressTO.join(', ') : '') + '\n';
         saveContent = saveContent + 'COPY: ' + ((!!content.mailAddressCC) ? content.mailAddressCC.join(', ') : '') + '\n';
         saveContent = saveContent + 'HIDDEN COPY: ' + ((!!content.mailAddressBC) ? content.mailAddressBC.join(', ') : '') + '\n';
         saveContent = saveContent + '\nSUBJECT: ' + content.subject + '\n';
         saveContent = saveContent + '---------------------------------------------\n\n';
         saveContent = saveContent + LIB.html2text(content.bodyHTML) + '\n\n';
         if (content.attached.length !== 0) {
           saveContent = saveContent + 'ATTACHED: ';
           for (let item of content.attached) {
             saveContent = saveContent + item.name + '(' + item.size + ')  ';
           }
         }
        break;
    }

    const outFile = await w3n.device.saveFileDialog(title, null, outFileName);
    if (!!outFile) {
      await outFile.writeTxt(saveContent)
        .catch((err) => {
          logError(err);
          this._commonSrv.sysNotification('error', null, 'Error on writing file!');
        })
        .then(() => {
          return;
        });
      
      this._commonSrv.sysNotification('success', null, 'The file is saved!');
    }

  }

  /**
   * перемещения выбранного сообщения
   * @param msgId {string}
   */
  moveMsg(msgId: string): angular.IPromise<boolean> {
    const folderId = this._cacheSrv.messages.list[msgId].folderId;
    const msgKey = this._cacheSrv.messages.list[msgId].msgKey;
  
    return this.$mdDialog.show({
      preserveScope: true,
      templateUrl: './templates/mail/message/msg-edit/tmpl/msg-move-dialog.html',
      parent: angular.element(document.body),
      clickOutsideToClose: false,
      escapeToClose: true,
      controller: ($scope: MsgMoveScope, $mdDialog: angular.material.IDialogService) => {
        $scope.MAIL_FOLDER_IDS = CONST.SYS_MAIL_FOLDERS;
        $scope.foldersList = this._cacheSrv.folders.list;
        $scope.currentFolder = folderId;
        $scope.targetFolder = null;

        $scope.cancel = (): void => {
          $scope.targetFolder = null;
          $mdDialog.cancel();
        };

        $scope.ok = (): void => {
          $mdDialog.hide($scope.targetFolder);
        };
      }
    })
    .then((targetFolder: string) => {
      return this.$q.when(this._mailFsSrv.moveMsgInsideFS(msgId, targetFolder));
    })
    .then((res) => {
      if (res) {
        this._cacheSrv.messages.selectId = null;
        this.$state.transitionTo('root.mail.folder', { folderId: folderId }, { reload: true });
      } else {
        this._commonSrv.sysNotification('error', null, 'Error on moving message!');
      }
      return res;
    });
  }

  /**
   * пометить входящее сообщение как непрочитанное
   * @param msgId {string}
   */
  markAsUnread(msgId: string): angular.IPromise<boolean> {
    this._cacheSrv.messages.list[msgId].isRead = false;

    return this.$q.when(this._mailFsSrv.writeMsgList());
  }

}