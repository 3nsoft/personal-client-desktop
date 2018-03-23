/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. */

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

  const COLOR_AVATAR = {
    "0": "#001064",
    "1": "#003300",
    "2": "#005662",
    "3": "#00600f",
    "4": "#00695c",
    "5": "#0069c0",
    "6": "#007c91",
    "7": "#01579b",
    "8": "#12005e",
    "9": "#280680",
    "10": "#373737",
    "11": "#37474f",
    "12": "#387002",
    "13": "#3949ab",
    "14": "#4a148c",
    "15": "#4b2c20",
    "16": "#524c00",
    "17": "#5c007a",
    "18": "#6a0080",
    "19": "#870000",
    "20": "#8e0000",
    "21": "#90cc00",
    "22": "#90a4ae",
    "23": "#99aa00",
    "24": "#bc5100",
    "25": "#bcaaa4",
    "26": "#bf360c",
    "27": "#c43e00",
    "28": "#c9bc1f",
    "29": "#f9a825",
    "30": "#fdd835",
    "31": "#ffa000",
    "?": "#a33333"
  };

	let code: number = (initials.charCodeAt(0) + initials.charCodeAt(1)) % 32;
	let codeStr = (initials[0] === "?") ? "?" : code.toFixed();

	return COLOR_AVATAR[codeStr];
}

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
 * функция подсчета кол-ва записей в объекте (ассоциативном массиве)
 */
export function sizeObject(obj: any): number {
  return Object.keys(obj).length;
}

/**
 * функция получения массива используемых букв для списков контактов и групп контактов
 * @param data {[id: string]: any} - объект, содержащий записи с полем "letter"
 * @return {string[]} - массив используемых символов, отсортированный по алфавиту
 */
export function getAllLetters(data: { [id: string]: any }): string[] {
  let result: string[] = [];
  let currentLetter: string;
  for (let key of Object.keys(data)) {
    currentLetter = data[key].letter.toUpperCase();
    if (result.indexOf(currentLetter) === -1) {
      result.push(currentLetter);
    }
  }
  return result.sort();
}

/**
 * простейший валиадатор mail адреса:
 * проверка на наличие символа "@" и присутствия текста
 * (строки) без пробелов после символа "@"
 * @param mail {string}
 * @return {boolean}
 */
export function checkAddress(mail: string): boolean {
	if (!!mail.match(/@/g)) {
		if (mail.match(/@/g).length === 1) {
			let part2 = mail.split("@")[1];
			if ((part2.length > 0) && (part2.indexOf(" ") === -1)) {
				return true;
			}
		}
	}
	return false;
}

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
}

/**
 * конвертация объекта Uint8array в Data URL(base64)
 * @param inputData {Uint8array}
 * @return {string} (Data URL base64)
 */
export function uint8ToBase64(inputData: Uint8Array): string {
  let size = inputData.length;
  let binaryString = new Array(size);
  while (size--) {
    binaryString[size] = String.fromCharCode(inputData[size]);
  }
  let data = binaryString.join("");
  let base64 = window.btoa(data);
  let src = `data:image/png;base64,${base64}`;

  return src;
}

/**
 * функция изменения размера картинки
 * @param imageBase64 {string} - картинка в base64
 * @param targetSize {number} - целевой размер меньшей стороны картинки
 * @return {string} (base64)
 */
export function resizeImage(imageBase64: string, targetSize: number): string {
  let tempImg = new Image();
  tempImg.src = imageBase64;

  // tempImg.onload = function () {

  // Расчитываем новые размеры изображения
  let tempImgSize = {
    width: tempImg.width,
    height: tempImg.height
  };
  if (tempImgSize.width > tempImgSize.height) {
    tempImgSize.width = tempImgSize.width * targetSize / tempImgSize.height;
    tempImgSize.height = targetSize;
  } else {
    tempImgSize.height = tempImgSize.height * targetSize / tempImgSize.width;
    tempImgSize.width = targetSize;
  }
  // Создаем холст
  let canvas = document.createElement("canvas");
  canvas.width = tempImgSize.width;
  canvas.height = tempImgSize.height;
  let ctx = canvas.getContext("2d");
  ctx.drawImage(tempImg, 0, 0, tempImgSize.width, tempImgSize.height);
  let dataUrl = canvas.toDataURL();

  return dataUrl;
}

/**
 * функция поиска nickName зная mail
 * @param contacts { [id: string]: client3N.PersonMapping }
 * @param mail {string}
 * @param me {string} - mail пользователя приложения
 * @return {string}
 */
export function findNameByMail(contacts: { [id: string]: client3N.PersonMapping }, mail: string, me?: string): string {
  const person = Object.keys(contacts)
  .map(key => contacts[key])
  .find(item => (item.mails[0] === mail));
  if (person) {
    return person.nickName;
  } else {
    if (!!me) {
      return (mail === me) ? 'Me' : mail;
    }
    return mail;
  }
}

/**
 * функция определения типа записанной на ФС сущности
 * @param fs {web3n.files.FS} - файловая система
 * @param folderPath {string} - имя папки
 * @param essenceName {string} - имя сущности в папке
 * @returns {'file' | 'folder' | 'link'}
 */
export async function whatIsIt(fs: web3n.files.FS, folderPath: string, essenceName: string): Promise<'file' | 'folder' | 'link'> {

  const list = await (fs as web3n.files.ReadonlyFS).listFolder(folderPath);
  for (let item of list) {
    if (item.name === essenceName) {
      return (item.isFolder) ? 'folder' : ((item.isFile) ? 'file' : 'link');
    }
  }
}

/**
 * преобразование даты/времени в мс в строку формата "гггг-мм-дд"
 * @param timestamp {number}
 * @return {string}
 */
export function dateToString(timestamp: number): string {
  const inParam = new Date(timestamp)
  const timeParse = {
    year: inParam.getFullYear(),
    month: (inParam.getMonth() + 1) < 10 ? `0${inParam.getMonth() + 1}` : `${inParam.getMonth() + 1}`,
    date: (inParam.getDate() < 10) ? `0${inParam.getDate()}`: `${inParam.getDate()}`
  }
  return `${timeParse.year}-${timeParse.month}-${timeParse.date}`
}

/**
 * определить попадает ли дата в выбранный диапазон (фильтр)
 * @param now {Date}
 * @param mode {'today' | 'week' | 'all'}
 * @returns {boolean}
 */
export function isDateInPeriod(now: Date, mode: 'today' | 'week' | 'all'): boolean {
  const week = 7 * 24 * 60 * 60 * 1000;
  const current = new Date();
  const currentBegin = new Date(current.getFullYear(), current.getMonth(), current.getDate(), 0, 0);
  const weekAgo = new Date(current.getTime() - week);
  const dateWeekAgo = new Date(weekAgo.getFullYear(), weekAgo.getMonth(), weekAgo.getDate(), 0, 0);

  switch (mode) {
    case 'today':
      return (now < currentBegin) ? false : true;
    case 'week':
      return (now < dateWeekAgo) ? false : true;
    default:
      return true;
  }
}

/**
 * функция преобразования времени мс в строку формата "чч:мм дд.мм.гггг" или "дд.мм.гггг"
 * @param time {number} - время в мс
 * @param withoutTime? {boolean}
 * @return {string} - строка в формате "чч:мм дд.мм.гггг" или "дд.мм.гггг"
 */
export function convertDate(time: number, withoutTime?: boolean): string {
  const sourceMsgCrTime = new Date(time);
  const sourceMsgTime = {
    hours: (sourceMsgCrTime.getHours() < 10) ? `0${sourceMsgCrTime.getHours()}` : `${sourceMsgCrTime.getHours()}`,
    min: (sourceMsgCrTime.getMinutes() < 10) ? `0${sourceMsgCrTime.getMinutes()}` : `${sourceMsgCrTime.getMinutes()}`,
    date: (sourceMsgCrTime.getDate() < 10) ? `0${sourceMsgCrTime.getDate()}` : `${sourceMsgCrTime.getDate()}`,
    month: (sourceMsgCrTime.getMonth() + 1) < 10 ? `0${sourceMsgCrTime.getMonth() + 1}` : `${sourceMsgCrTime.getMonth() + 1}`,
    year: `${sourceMsgCrTime.getFullYear()}`
  };
  return !withoutTime ? `${sourceMsgTime.hours}:${sourceMsgTime.min} ${sourceMsgTime.date}.${sourceMsgTime.month}.${sourceMsgTime.year}` : `${sourceMsgTime.date}.${sourceMsgTime.month}.${sourceMsgTime.year}`
}

/**
 * функция преобразования времени мс в строку формата:
 * - если сегодня, то - "чч:мм"
 * - если прошло менее недели, то - "день недели чч:мм";
 * - если прошло более недели, то - "дд.мм чч:мм"
 * @param timestamp {number} - время в мс
 * @param withoutTime? {boolean}
 * @return {string}
 */
export function convertTimestamp(timestamp: number, withoutTime?: boolean): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const month = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  const currentDate = new Date(timestamp)
  let result = {
    hours: (currentDate.getHours() < 10) ? `0${currentDate.getHours()}` :  currentDate.getHours(),
    min: (currentDate.getMinutes() < 10) ? `0${currentDate.getMinutes()}` :  currentDate.getMinutes(),
    day: days[currentDate.getDay()],
    date: (currentDate.getDate() < 10) ? "0" + currentDate.getDate() : currentDate.getDate(),
    month: month[currentDate.getMonth()]
  }

  if (isDateInPeriod(currentDate, 'today')) {
    return !withoutTime ? `${result.hours}:${result.min}` : 'Today'
  }

  if (isDateInPeriod(currentDate, 'week')) {
    return !withoutTime ? `${result.day} at ${result.hours}:${result.min}` : `${result.day}`
  }

  return !withoutTime ? `${result.date} ${result.month} at ${result.hours}:${result.min}` : `${result.date} ${result.month}`
}

/**
 * функция инвертирования цвета
 * @param color {string} - цвет в HEX формате
 * @returns {string} - инвертированный цвет в HEX формате
 */
export function invertColor(color: string): string {
  if (!!color) {
    let tmpColor = color.substring(1);
    let tmpColorNum = parseInt(tmpColor, 16);
    tmpColorNum = 0xFFFFFF ^ tmpColorNum;
    tmpColor = tmpColorNum.toString(16);
    tmpColor = ('00000' + tmpColor).slice(-6);
    tmpColor = `#${tmpColor}`;
    return tmpColor;
  }
  return '#000000';
}

/**
 * поиск всех предков элемента до BODY
 * @param elem {Element}
 */
export function findAllParents(elem: Element): HTMLElement[] {
  let parents: HTMLElement[] = [];
  let currentElement: Element | HTMLElement = elem;
  let currentParentElement: HTMLElement;
  let needStop = false;

  while (!needStop) {
    currentParentElement = currentElement.parentElement;
    parents.push(currentParentElement);
    if (currentParentElement.nodeName !== 'BODY') {
      currentElement = currentParentElement;
    } else {
      needStop = true;
    }
  }

  return parents;
}

/**
 * находится ли HTMLElement в списке
 * @param list {HTMLElement[]}
 * @param selector {string} 
 */
export function inTheList(list: HTMLElement[], selector: string): boolean {
  const searchElement = document.querySelector(selector);
  return list.some(elem => (elem === searchElement));
}


