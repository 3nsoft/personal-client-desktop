/*
 Copyright (C) 2016 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. */

import * as CONST from "./const";
import * as Lib from "./lib-internal";
import { symlink } from 'fs';

/**
 * создание нового (пустого) объекта типа MailFolderJSON
 * @returns new object MailFolderJSON
 */
export function newMailFolderJSON(): client3N.MailFolderJSON {
  return {
    folderId: null,
    orderNum: null,
    folderName: "",
    isSystem: false,
    icon: 'folder',
    messageIds: []
  };
}

/**
 * создание нового (пустого) объекта типа MailFolderMapping
 * @returns new object MailFolderMapping
 */
export function newMailFolderMapping(): client3N.MailFolderMapping {
  return {
    folderId: null,
    orderNum: null,
    folderName: "",
    icon: 'folder',
    isSystem: false,
    messageIds: [],
    qtNoRead: 0,
    mode: "create"
  };
}

/**
 * преобразование объекта типа MailFolderMapping в объект
 * типа MailFolderJSON
 * @param inData {MailFolderMapping}
 * @returns new object MailFolderJSON
 */
export function folderMappingToJSON(inData: client3N.MailFolderMapping): client3N.MailFolderJSON {
  return {
    folderId: inData.folderId,
    orderNum: inData.orderNum,
    folderName: inData.folderName,
    isSystem: inData.isSystem,
    icon: inData.icon,
    messageIds: inData.messageIds
  };
}

/**
 * преобразование хэша объектов типа MailFolderJSON
 * в хэш объектов типа MailFolderMapping
 * @param inData { {[id: string]: client3N.MailFolderJSON} }
 * @param messages { {[id: string]: client3N.MessageMapping} }
 * @returns outData { {[id: string]: client3N.MailFolderMapping} }
 */
export function foldersJsonToMapping(inData: {[id: string]: client3N.MailFolderJSON}, messages: {[id: string]: client3N.MessageMapping}): {[id: string]: client3N.MailFolderMapping} {
  let result: {[id: string]: client3N.MailFolderMapping} = {};
  for (let folderId of Object.keys(inData)) {
    let tmpQtNoRead = 0;
    result[folderId] = <client3N.MailFolderMapping>{};
    for (let key in inData[folderId]) {
      result[folderId][key] = inData[folderId][key];
    }
    result[folderId].mode = "normal";
    result[folderId].icon = (!!inData[folderId].icon) ? inData[folderId].icon : 'folder';
    if (messages === null) {
      result[folderId].qtNoRead = 0;
    } else {
      for (let msgId of result[folderId].messageIds) {
        tmpQtNoRead = (!messages[msgId].isRead) ? tmpQtNoRead + 1 : tmpQtNoRead;
      }
      result[folderId].qtNoRead = tmpQtNoRead;
    }
  }
  return result;
}

/**
 * функция генерации id для нового элемента списка
 * @param list - объект списка, состоящий из элементов типа {[id: string]: any}
 * @returns newId {string}
 */
export function generateId(list: {[id: string]: any}): string {
  let newId: string;
  let tempId: number[] = [];
  let key: string;
  for (key of Object.keys(list)) {
    if (key === undefined) {
      break;
    }
    tempId.push(Number(key));
  }
  if (key === undefined) {
    newId = "5";
  } else {
    let maxOldId: number = tempId.sort(function compare(a,b){return a-b;})[tempId.length-1];
		let newIdNumber = maxOldId + 1;
    newId = newIdNumber.toString();
  }
  return newId;
}

/**
 * функция формирования messageId для исходящего сообщения
 * @return {string}
 */
export function newMsgId(): string {
  let result = ((new Date()).getTime()).toFixed();
  return result;
}

/**
 * функция формирования messageKey
 * @params direction {string} - IN / OUT
 * @params msgId {string} - messageId
 * @return {string}
 */
export function newMsgKey(direction: string, msgId: string): string {
  let result: string;
  let tmpDir = direction.toLowerCase();
  if (tmpDir === "in" || tmpDir === "out") {
    result = direction + "=" + msgId;
  } else {
    result = "out=" + msgId;
  }
  return result;
}

/**
 * функция создания нового (пустого) объекта типа MessageJSON
 * @returns {MessageJSON}
 */
export function newMessageJSON(): client3N.MessageJSON {
  return {
    msgId: "new",
    msgKey: "new",
    mailAddressTO: [],
    mailAddressCC: [],
    mailAddressBC: [],
    subject: "",
    bodyHTML: "",
    timeCr: 0,
    attached: []
  };
}

/**
 * функция создания нового (пустого) объекта типа MessageEditContent
 * @returns {MessageEditContent}
 */
export function newMessageEditContent(): client3N.MessageEditContent {
  return {
    msgId: "new",
    msgKey: "new",
    mailAddress: null,
    mailAddressTO: [],
    mailAddressCC: [],
    mailAddressBC: [],
    subject: "",
    bodyHTML: "",
    timeCr: 0,
    attached: [],
    alias: {
      mailAddress: 'Me',
      mailAddressTO: [],
      mailAddressCC: [],
      mailAddressBC: []
    }
  }
}

/**
 * функция создания нового (пустого) объекта типа OutgoingMessage
 * @returns {OutgoingMessage}
 */
export function newOutgoingMessage(): web3n.asmail.OutgoingMessage {
  return {
    msgId: null,
    msgType: "mail",
    recipients: null,
    carbonCopy: null,
    subject: null,
    htmlTxtBody: null,
    plainTxtBody: null,
    attachments: null,
  };
}

/**
 * функция преобразования объекта типа MessageJSON
 * в объект типа MessageMapping
 * @param msgJSON {MessageJSON}
 * @param folderId {number}
 * @returns {MessageMapping}
 * поля labels, isRead, isReply могут потребовать корректировки
 */
export function msgJsonToMapping(msgJSON: client3N.MessageJSON | client3N.MessageEditContent, folderId: string): client3N.MessageMapping {
  let tmpMsgId = (msgJSON.msgId === "new") ? newMsgId() : msgJSON.msgId;
  let tmpKey = (msgJSON.msgKey === "new") ? newMsgKey("out", tmpMsgId) : ((msgJSON.msgKey === undefined) ? newMsgKey("in", tmpMsgId) : msgJSON.msgKey);

  let result: client3N.MessageMapping = {
      msgId: tmpMsgId,
      msgKey: tmpKey,
      mailAddress: (msgJSON.mailAddressTO.length > 0) ? msgJSON.mailAddressTO[0] : "",
      subject: !!msgJSON.subject ? ((msgJSON.subject.length > 47) ? msgJSON.subject.substr(0, 47) + "..." : msgJSON.subject) : "",
      body: (!!Lib.html2text(msgJSON.bodyHTML)) ? (Lib.html2text(msgJSON.bodyHTML).length > 47) ? Lib.html2text(msgJSON.bodyHTML).substr(0, 47) + "..." : Lib.html2text(msgJSON.bodyHTML) : "",
      timeCr: (!!msgJSON.timeCr) ? msgJSON.timeCr : Number(tmpMsgId),
      // isAttached: (msgJSON.attached.length > 0) ? true : false,
      isAttached: _isAttached(msgJSON.attached),
      folderId: folderId,
      labels: [],
      isOut: (tmpKey.toLowerCase().indexOf("in") !== -1) ? false : true,
      isDraft: (folderId === CONST.SYS_MAIL_FOLDERS.draft) ? true : false,
      isRead: (tmpKey.toLowerCase().indexOf("in") !== -1) ? false : true,
      isReply: false,
      isGroup: ((msgJSON.mailAddressTO.length + msgJSON.mailAddressCC.length) > 1) ? true : false,
      isSendError: (msgJSON.mailAddressErrors) ? true : false,
      //contactId:
      initials: (msgJSON.mailAddressTO.length > 0) ? (`${msgJSON.mailAddressTO[0]} `).substr(0, 2) : "??",
      color: (msgJSON.mailAddressTO.length > 0) ? Lib.getColor((`${msgJSON.mailAddressTO[0]} `).substr(0, 2)) : Lib.getColor("??")
  };

  return result;
}

/**
 * функция преобразования объекта типа MessageEditContent
 * в объект типа MessageJSON
 * @param msgEdit {MessageEditContent}
 * @returns {MessageJSON}
 */
export function msgEditToJson(msgEdit: client3N.MessageEditContent): client3N.MessageJSON {
  let tmp: any = angular.copy(msgEdit);
  delete tmp.alias;
  return (tmp as client3N.MessageJSON);
}

/**
 * функция преобразования объекта типа MessageJSON
 * в объект типа MessageEditContent
 * @param contacts {[id: string]: client3N.PersonMapping}
 * @param msgJSON {client3N.MessageJSON}
 * @returns {client3N.MessageEditContent}
 */
export function msgJsonToEdit(contacts: {[id: string]: client3N.PersonMapping}, msgJSON: client3N.MessageJSON): client3N.MessageEditContent {
  let tmp: any = angular.copy(msgJSON);
  let alias: client3N.MessageAddressesAliases = {
    mailAddress: Lib.findNameByMail(contacts, msgJSON.mailAddress),
    mailAddressTO: <string[]>[],
    mailAddressCC: <string[]>[],
    mailAddressBC: <string[]>[]
  };
  for (let item of msgJSON.mailAddressTO) {
    alias.mailAddressTO.push(Lib.findNameByMail(contacts, item));
  }
  for (let item of msgJSON.mailAddressCC) {
    alias.mailAddressCC.push(Lib.findNameByMail(contacts, item));
  }
  for (let item of msgJSON.mailAddressBC) {
    alias.mailAddressBC.push(Lib.findNameByMail(contacts, item));
  }
  tmp.alias = alias;
  return (tmp as client3N.MessageEditContent);
}

/**
 * функция преобразования объектов типа IncomingMessage
 * в объекты типа MessageMapping
 * @param {IncomingMessage[]}
 * @returns {MessageMapping[]}
 */
 export function incomingToMapping(inMessages: web3n.asmail.IncomingMessage[]): {[id: string]: client3N.MessageMapping} {
   let msgsMapping: {[id: string]: client3N.MessageMapping} = {};
   for (let inMsg of inMessages) {
     let tmpMsgMap = <client3N.MessageMapping>{};
     tmpMsgMap.msgId = inMsg.msgId;
     tmpMsgMap.msgKey = newMsgKey("in", inMsg.msgId);
     tmpMsgMap.mailAddress = inMsg.sender;
     tmpMsgMap.subject = !!inMsg.subject ? ((inMsg.subject.length > 47) ? inMsg.subject.substr(0, 47) + "..." : inMsg.subject) : "";
     if ("htmlTxtBody" in inMsg) {
       tmpMsgMap.body = (Lib.html2text(inMsg.htmlTxtBody).length > 47) ? Lib.html2text(inMsg.htmlTxtBody).substr(0, 47) + "..." : Lib.html2text(inMsg.htmlTxtBody);
     }
     if ("plainTxtBody" in inMsg) {
       tmpMsgMap.body = (Lib.html2text(inMsg.plainTxtBody).length > 47) ? Lib.html2text(inMsg.plainTxtBody).substr(0, 47) + "..." : Lib.html2text(inMsg.plainTxtBody);
     }
     tmpMsgMap.body = (!!tmpMsgMap.body) ? tmpMsgMap.body: "";
     tmpMsgMap.timeCr = inMsg.deliveryTS;
     tmpMsgMap.isAttached = ("attachments" in inMsg) ? true : false;
     tmpMsgMap.folderId = CONST.SYS_MAIL_FOLDERS.inbox;
     tmpMsgMap.labels = [];
     tmpMsgMap.isOut = false;
     tmpMsgMap.isDraft = false;
     tmpMsgMap.isRead = false;
     tmpMsgMap.isReply = false;
     tmpMsgMap.isGroup = ((inMsg.recipients.length + inMsg.carbonCopy.length) > 1) ? true : false;
     tmpMsgMap.initials = inMsg.sender.substr(0, 2);
     tmpMsgMap.color = Lib.getColor(inMsg.sender.substr(0, 2));

     msgsMapping[tmpMsgMap.msgId] = tmpMsgMap;
   }

   return msgsMapping;
 }

 /**
  * функция преобразования объектов типа IncomingMessage
  * в объекты типа MessageJSON
  * @param {IncomingMessage}
  * @return {MessageJSON}
  */
  export async function incomingToJSON(inMessage: web3n.asmail.IncomingMessage): Promise <client3N.MessageJSON> {
    let tmpMsgJSON: client3N.MessageJSON = {
      msgId: inMessage.msgId,
      msgKey: newMsgKey("in", inMessage.msgId),
      mailAddress: inMessage.sender,
      mailAddressTO: ("recipients" in inMessage) ? inMessage.recipients : [],
      mailAddressCC: ("carbonCopy" in inMessage) ? inMessage.carbonCopy : [],
      mailAddressBC: <string[]>[],
      subject: inMessage.subject,
      bodyHTML: ("htmlTxtBody" in inMessage) ? inMessage.htmlTxtBody : null,
      bodyTxt: ("plainTxtBody" in inMessage) ? inMessage.plainTxtBody : null,
      timeCr: inMessage.deliveryTS,
      attached: []
    };
    if ("attachments" in inMessage) {
      let fileList = await inMessage.attachments.listFolder("/");
      for (let item of fileList) {
        if (item.isFile) {
          let fileStat = await inMessage.attachments.statFile(item.name);
          let fileInfo: client3N.AttachFileInfo = {
            name: item.name,
            size: fileStat.size,
            mode: "saved"
          };
          tmpMsgJSON.attached.push(fileInfo);
        }
      }
    }
    return tmpMsgJSON;
  }

/**
 * функция определения наличия приатаченных файлов
 * @param attahed {client3N.AttachFileInfo[]}
 * @return idAttached{boolean}
 */
function _isAttached(attached: client3N.AttachFileInfo[]): boolean {
  let tmpAttached = attached.filter((item, i, arr) => {
    return item.mode !== "delete";
  });
  return (tmpAttached.length > 0 ) ? true : false;
}

/**
 * функция чтения файлов в контейнер Web3N.Files.File[]
 * для передачи в attach-block и дальнейшей пересылке сообщения
 */
export async function fromMsgToFiles(msgKey: string, folderId: string, fileName: string): Promise<web3n.files.File> {
  const msgId = msgKey.substr(msgKey.indexOf("=") + 1);
  let file: web3n.files.File = null;

  if (folderId === CONST.SYS_MAIL_FOLDERS.inbox) {
    // "inbox"
    const inboxMsg = await w3n.mail.inbox.getMsg(msgId);
    file = await inboxMsg.attachments.readonlyFile(fileName);
  } else {
    // not "inbox"
    const path = `${folderId}/${msgKey}/attachments`;
    const fs = await w3n.storage.getAppLocalFS(`${CONST.FS_USED.MAIL}`);
    const essenceType = await Lib.whatIsIt(fs, path, fileName);
    switch (essenceType) {
      case 'file':
        file = await fs.readonlyFile(`${path}/${fileName}`);
        break;
      case 'link':
        const symlink = await fs.readLink(`${path}/${fileName}`);
        file = (await symlink.target()) as web3n.files.File;
        break;
    }
  }

  return file;
}

/**
 * sanitize bodyHTML
 * @params html {strig}
 * @return sanitized html {strig}
 */
export function sanitizeHTML(source: string): string {
  const allowedElems = ["DIV", "P", "SPAN", "A", "IMG", "BR", "B", "I", "U", "S", "OL", "UL", "LI"];
  let allowedStyle = {};
  let wrapElem = document.createElement("div");
  wrapElem.innerHTML = source;
  let childElems = wrapElem.getElementsByTagName("*") as any as Element[];
  // удаление не разрешенных элементов
  for (let elem of childElems) {
    if (allowedElems.indexOf(elem.tagName) === -1) {
      elem.remove();
      continue;
    }

    allowedStyle = {
      "font-size": null,
      "font-family": null,
      "color": null,
      "background-color": null,
      "text-align": null
    };
    // запоминаем значения разрешенных css свойств
    for (let key in allowedStyle) {
      if ((elem as HTMLElement).style[key] !== "") {
        allowedStyle[key] = (elem as HTMLElement).style[key];
      }
    }
    // очищаем аттрибут style
    if (elem.hasAttribute("style")) {
      elem.setAttribute("style", "");
    }
    // восстанавливаем только разрешенные свойства style
    for (let key in allowedStyle) {
      if (allowedStyle[key] !== null) {
        (elem as HTMLElement).style[key] = allowedStyle[key];
      }
    }
    // для <a> удаляем все аттрибуты кроме href
    // и добавляем аттрибут target="_blank"
    if (elem.tagName === "A") {
      for (let i = 0; i < elem.attributes.length; i++) {
        if (elem.attributes[i].name !== "href") {
          elem.removeAttribute(elem.attributes[i].name);
        }
      }
      elem.setAttribute("target", "_blank");
    }
    // для <img> удаляем все аттрибуты кроме src
    if (elem.tagName === "IMG") {
      for (let i = 0; i < elem.attributes.length; i++) {
        if (elem.attributes[i].name !== "src") {
          elem.removeAttribute(elem.attributes[i].name);
        }
      }
    }
  }

  return wrapElem.innerHTML;
}
