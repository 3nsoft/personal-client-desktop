/**
 * простейший валиадатор mail адреса:
 * проверка на наличие символа "@" и присутствия текста
 * (строки) без пробелов после символа "@"
 * @param mail {string}
 * @return {boolean}
 */
export function checkAddress(mail: string): boolean {
  if (mail.match(/@/g) && mail.match(/@/g).length === 1) {
    const part2 = mail.split('@')[1];
    if (part2.length > 0 && part2.indexOf(' ') === -1) { return true; }
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
  let tmpNum:any = num.toString().split('e'); //tslint:disable-line
  tmpNum = Math.round(+(tmpNum[0] + 'e' + (tmpNum[1] ? (+tmpNum[1] - precission) : -precission)));
  // Обратный сдвиг
  tmpNum = tmpNum.toString().split('e');
  return +(tmpNum[0] + 'e' + (tmpNum[1] ? (+tmpNum[1] -
  + precission) : precission));
}

/**
 * функция клонирования объекта
 * @param sourceObj {Object}
 * @return {Object}
 */
export function clone<T>(sourceObj: T): T {
  let clonedObj = {} as T;
  for (let key in sourceObj) {
    if (
      typeof(sourceObj[key]) === 'object' &&
      !Array.isArray(sourceObj[key]) &&
      sourceObj[key] !== null
    ) {
      clonedObj[key] = clone(sourceObj[key]);
      continue;
    }
    if (Array.isArray(sourceObj[key])) {
      // @ts-ignore
      clonedObj[key] = (sourceObj[key] as Array).slice();
      continue;
    }
    clonedObj[key] = sourceObj[key];
  }
  return clonedObj;
}
