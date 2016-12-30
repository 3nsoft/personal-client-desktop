/*
 Copyright (C) 2016 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. */

import * as Constants from "./const-srv";

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
};

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
};

/**
 * функция преобразования html в plainText
 * @param {string} html
 * @returns {string} plain text
 */
export function html2text(html: string): string{
	let tag = document.createElement('div');
	tag.innerHTML = html;
	return tag.innerText;
}

/**
 *  установка цвета на основании инициалов
 *  @params initials - строка (инициалы)
 *  @return (string) - цвет в HEX виде
 */
export function getColor(initials: string): string {
  // const COLOR_AVATAR = {
  //   "0": "#7d4a17",
  //   "1": "#2f2fda",
  //   "2": "#434c56",
  //   "3": "#4023f6",
  //   "4": "#105c42",
  //   "5": "#12620f",
  //   "6": "#52670e",
  //   "7": "#444118",
  //   "8": "#7c6a09",
  //   "9": "#7e3535",
  //   "10": "#865627",
  //   "11": "#a23915",
  //   "12": "#98254a",
  //   "13": "#6e2281",
  //   "14": "#3f207e",
  //   "15": "#503c26",
  //   "16": "#58464b",
  //   "?": "#a33333"
  // };
  let COLOR_AVATAR = {
    "0": "#e67e30",
    "1": "#5d8aa8",
    "2": "#3b444b",
    "3": "#fe6f5e",
    "4": "#0095b6",
    "5": "#964b00",
    "6": "#900020",
    "7": "#8a3324",
    "8": "#772953",
    "9": "#007ba7",
    "10": "#cd5c5c",
    "11": "#4b3621",
    "12": "#6495ed",
    "13": "#cd5b45",
    "14": "#2f4f4f",
    "15": "#177245",
    "16": "#465945",
    "17": "#00a86b",
    "18": "#997a8d",
    "19": "#003153",
    "20": "#800080",
    "21": "#b7410e",
    "22": "#008080",
    "23": "#d53e07",
    "24": "#dd4814",
    "25": "#006666",
    "26": "#336600",
    "27": "#666600",
    "28": "#cc3300",
    "29": "#ff3333",
    "30": "#660033",
    "31": "#cccc33",
    "?": "#a33333"
  };

	let code: number = (initials.charCodeAt(0) + initials.charCodeAt(1)) % 32;
	let codeStr = (initials[0] === "?") ? "?" : code.toFixed();

	return COLOR_AVATAR[codeStr];
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
 * функция создания нового (пустого) объекта типа OutgoingMessage
 * @return {OutgoingMessage}
 */
export function newOutgoingMessage(): web3n.asmail.OutgoingMessage {
  return {
    msgId: null,
    msgType: "mail",
    chatId: null,
    recipients: null,
    carbonCopy: null,
    subject: null,
    htmlTxtBody: null,
    plainTxtBody: null,
    attachments: null,
    attachmentsFS: null
  };
}

/**
 * функция преобразования объекта типа MessageJSON
 * в объект типа MessageMapping
 * @params msgJSON {MessageJSON}
 * @params folderId {number}
 * @return {MessageMapping}
 * поля labels, isRead, isReply могут потребовать корректировки
 */
export function msgJsonToMapping(msgJSON: client3N.MessageJSON, folderId: string): client3N.MessageMapping {
  let tmpMsgId = (msgJSON.msgId === "new") ? newMsgId() : msgJSON.msgId;
  let tmpKey = (msgJSON.msgKey === "new") ? newMsgKey("out", tmpMsgId) : ((msgJSON.msgKey === undefined) ? newMsgKey("in", tmpMsgId) : msgJSON.msgKey);

  let result: client3N.MessageMapping = {
      msgId: tmpMsgId,
      msgKey: tmpKey,
      mailAddress: (msgJSON.mailAddressTO.length > 0) ? msgJSON.mailAddressTO[0] : "",
      subject: !!msgJSON.subject ? ((msgJSON.subject.length > 47) ? msgJSON.subject.substr(0, 47) + "..." : msgJSON.subject) : "",
      body: (!!html2text(msgJSON.bodyHTML)) ? (html2text(msgJSON.bodyHTML).length > 47) ? html2text(msgJSON.bodyHTML).substr(0, 47) + "..." : html2text(msgJSON.bodyHTML) : "",
      timeCr: Number(tmpMsgId),
      // isAttached: (msgJSON.attached.length > 0) ? true : false,
      isAttached: _isAttached(msgJSON.attached),
      folderId: folderId,
      labels: [],
      isOut: (tmpKey.toLowerCase().indexOf("in") !== -1) ? false : true,
      isDraft: (folderId === Constants.SYS_MAIL_FOLDERS.draft) ? true : false,
      isRead: (tmpKey.toLowerCase().indexOf("in") !== -1) ? false : true,
      isReply: false,
      isGroup: ((msgJSON.mailAddressTO.length + msgJSON.mailAddressCC.length) > 1) ? true : false,
      isSendError: (msgJSON.mailAddressErrors) ? true : false,
      //contactId:
      initials: (msgJSON.mailAddressTO.length > 0) ? msgJSON.mailAddressTO[0].substr(0, 2) : "??",
      color: (msgJSON.mailAddressTO.length > 0) ? getColor(msgJSON.mailAddressTO[0].substr(0, 2)) : getColor("??")
  };

  return result;
}

/**
 * функция преобразования объектов типа IncomingMessage
 * в объекты типа MessageMapping
 * @params {IncomingMessage[]}
 * @return {MessageMapping[]}
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
       tmpMsgMap.body = (html2text(inMsg.htmlTxtBody).length > 47) ? html2text(inMsg.htmlTxtBody).substr(0, 47) + "..." : html2text(inMsg.htmlTxtBody);
     }
     if ("plainTxtBody" in inMsg) {
       tmpMsgMap.body = (html2text(inMsg.plainTxtBody).length > 47) ? html2text(inMsg.plainTxtBody).substr(0, 47) + "..." : html2text(inMsg.plainTxtBody);
     }
     tmpMsgMap.body = (!!tmpMsgMap.body) ? tmpMsgMap.body: "";
     tmpMsgMap.timeCr = inMsg.deliveryTS;
     tmpMsgMap.isAttached = ("attachments" in inMsg) ? true : false;
     tmpMsgMap.folderId = Constants.SYS_MAIL_FOLDERS.inbox;
     tmpMsgMap.labels = [];
     tmpMsgMap.isOut = false;
     tmpMsgMap.isDraft = false;
     tmpMsgMap.isRead = false;
     tmpMsgMap.isReply = false;
     tmpMsgMap.isGroup = ((inMsg.recipients.length + inMsg.carbonCopy.length) > 1) ? true : false;
     tmpMsgMap.initials = inMsg.sender.substr(0, 2);
     tmpMsgMap.color = getColor(inMsg.sender.substr(0, 2));

     msgsMapping[tmpMsgMap.msgId] = tmpMsgMap;
   }

   return msgsMapping;
 }

 /**
  * функция преобразования объектов типа IncomingMessage
  * в объекты типа MessageJSON
  * @params {IncomingMessage}
  * @return {MessageJSON}
  */
  export async function incomingToJSON(inMessage: web3n.asmail.IncomingMessage): Promise <client3N.MessageJSON> {
    let tmpMsgJSON: client3N.MessageJSON = {
      msgId: inMessage.msgId,
      msgKey: newMsgKey("in", inMessage.msgId),
      mailAddress: inMessage.sender,
      mailAddressTO: ("recipients" in inMessage) ? inMessage.recipients : null,
      mailAddressCC: ("carbonCopy" in inMessage) ? inMessage.carbonCopy : null,
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
 * @params attahed {client3N.AttachFileInfo[]}
 * @return idAttached{boolean}
 */
function _isAttached(attached: client3N.AttachFileInfo[]): boolean {
  let tmpAttached = attached.filter((item, i, arr) => {
    return item.mode !== "delete";
  });
  return (tmpAttached.length > 0 ) ? true : false;
};

/**
 * @params src {Web3N.ByteSource}
 * @params sink {Web3N.ByteSink}
 * @params bufSize {number} - опциональный параметр (размер буфера)
 * по умолчанию bufSize = 64K
 * @return {Promise<void>}
 */
export async function pipe (src: web3n.ByteSource, sink: web3n.ByteSink, bufSize = 64*1024): Promise<void> {
  let buf = await src.read(bufSize);
  while (buf) {
    await sink.write(buf);
    buf = await src.read(bufSize);
  }
  await sink.write(null);
}

/**
 * функция перевода значения в байтах в килобайты и т.п.
 * @params valueBytes {number}
 * @returns {string}
 */
export function fromByteTo(valueBytes: number): string {
  let result: string;
  let tmp: number;

  if (valueBytes !== null) {
    switch (true) {
      case (valueBytes > (1024*1024*1024 - 1)):
        tmp = valueBytes / (1024 * 1024 * 1024);
        result = tmp.toFixed(1) + " GB";
        break;
      case (valueBytes > (1024*1024 - 1)):
        tmp = valueBytes / (1024 * 1024);
        result = tmp.toFixed(1) + " MB";
        break;
      case (valueBytes > 1023):
        tmp = Math.round(valueBytes / 1024);
        result = tmp + " KB";
        break;
      default:
        result = valueBytes + " B";
    }
  } else {
    result = "unknown";
  }
  return result;
}

/**
 * функция выполнения promises
 * @params promises {Promise<T>[]}
 * @return {Promise<{result: T, error: any}[]>}
 */
export async function waitAll <T>(promises: Promise<T>[]): Promise<{result: T, error: any}[]> {
  let results: {result: T, error: any}[] = [];

  for (let p of promises) {
    await p.then((res) => {
      results.push({result: res, error: null});
    }, (err) => {
      results.push({result: null, error: err});
    });
  }
  return results;
}

/**
 * функция проверки объекта на пустоту
 * @params obj {any}
 * @return {boolean}
 */
export function isEmptyObject(obj: any): boolean {
  return (Object.keys(obj).length > 0) ? false : true;
}

 /**
  * функция преобразования времени мс => строка
  * @params time {number} - время в мс
  * @return {string} - строка в формате чч:мм дд.мм.гггг
  */
  export function convertDate(time: number): string {
    let sourceMsgCrTime = new Date(time);
    let sourceMsgTime = {
      hours: (sourceMsgCrTime.getHours() < 10) ? "0" + sourceMsgCrTime.getHours() : sourceMsgCrTime.getHours(),
      min: (sourceMsgCrTime.getMinutes() < 10) ? "0" + sourceMsgCrTime.getMinutes() : sourceMsgCrTime.getMinutes(),
      date: (sourceMsgCrTime.getDate() < 10) ? "0" + sourceMsgCrTime.getDate() : sourceMsgCrTime.getDate(),
      month: sourceMsgCrTime.getMonth() + 1,
      year: sourceMsgCrTime.getFullYear()
    };
    let result = sourceMsgTime.hours + ":" + sourceMsgTime.min + " " + sourceMsgTime.date + "." + ((sourceMsgTime.month <10) ? "0" + sourceMsgTime.month : sourceMsgTime.month) + "." + sourceMsgTime.year;
    return result;
  };


/**
 * функция чтения файлов в контейнер Web3N.Files.File[]
 * для передачи в attach-block и дальнейшей пересылке сообщения
 */
export async function fromMsgToFiles(msgKey: string, folderId: string, fileName: string): Promise<web3n.files.File> {
  let msgId = msgKey.substr(msgKey.indexOf("=") + 1);
  let file: web3n.files.File = null;

  if (folderId === Constants.SYS_MAIL_FOLDERS.inbox) {
    // "inbox"
    let inboxMsg = await w3n.mail.inbox.getMsg(msgId);
    file = await inboxMsg.attachments.readonlyFile(fileName);
  } else {
    // not "inbox"
    let fs = await w3n.storage.getAppLocalFS("computer.3nweb.mail");
    let path = folderId + "/" + msgKey + "/attachments/" + fileName;
    file = await fs.readonlyFile(path);
  }

  return file;
};

/**
 * функция округления с заданной точностью
 * @param num {number} - округляемое число
 * @param precision {number} - точность округления (количество знаков после запятой
 * указывается со знаком "-")
 * @return {number} - скорректированная округленная десятичная дробь
 */
export function round(num: number, precission: number): number {
  // Сдвиг разрядов
  let tmpNum:any = num.toString().split('e');
  tmpNum = Math.round(+(tmpNum[0] + 'e' + (tmpNum[1] ? (+tmpNum[1] - precission) : -precission)));
  // Обратный сдвиг
  tmpNum = tmpNum.toString().split('e');
  return +(tmpNum[0] + 'e' + (tmpNum[1] ? (+tmpNum[1] -
  + precission) : precission));
};
