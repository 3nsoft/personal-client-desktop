const COLORS = {
  '0': '#001064',
  '1': '#003300',
  '2': '#005662',
  '3': '#00600f',
  '4': '#00695c',
  '5': '#0069c0',
  '6': '#007c91',
  '7': '#01579b',
  '8': '#12005e',
  '9': '#280680',
  '10': '#373737',
  '11': '#37474f',
  '12': '#387002',
  '13': '#3949ab',
  '14': '#4a148c',
  '15': '#4b2c20',
  '16': '#524c00',
  '17': '#5c007a',
  '18': '#6a0080',
  '19': '#870000',
  '20': '#8e0000',
  '21': '#90cc00',
  '22': '#90a4ae',
  '23': '#99aa00',
  '24': '#bc5100',
  '25': '#bcaaa4',
  '26': '#bf360c',
  '27': '#c43e00',
  '28': '#c9bc1f',
  '29': '#f9a825',
  '30': '#fdd835',
  '31': '#ffa000',
  '?': '#a33333',
};

/**
 *  установка цвета на основании инициалов
 *  @param initials - строка (инициалы)
 *  @return (string) - цвет в HEX виде
 */
export function getElementColor(initials: string = '?'): string {
  const code = initials.length === 1 ?
    initials.charCodeAt(0) % 32 :
    (initials.charCodeAt(0) + initials.charCodeAt(1)) % 32;
  const codeStr = initials[0] === '?' ? '?' : code.toFixed();
  return COLORS[codeStr];
}

/**
 * функция инвертирования цвета
 * @param color {string} - цвет в HEX формате
 * @returns {string} - инвертированный цвет в HEX формате
 */
export function invertColor(color: string): string {
  if (color) {
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
 * функция перевода значения в байтах в килобайты и т.п.
 * @param valueBytes {number}
 * @returns {string}
 */
export function fromByteTo(valueBytes: number): string {
  let result: string;
  let tmp: number;

  if (valueBytes !== null && typeof valueBytes === 'number') {
    switch (true) {
      case (valueBytes > (1024 * 1024 * 1024 - 1)):
        tmp = valueBytes / (1024 * 1024 * 1024);
        result = tmp.toFixed(1) + ' GB';
        break;
      case (valueBytes > (1024 * 1024 - 1)):
        tmp = valueBytes / (1024 * 1024);
        result = tmp.toFixed(1) + ' MB';
        break;
      case (valueBytes > 1023):
        tmp = Math.round(valueBytes / 1024);
        result = tmp + ' KB';
        break;
      default:
        result = valueBytes + ' B';
    }
  } else {
    result = 'unknown';
  }
  return result;
}

/**
 * функция изменения размера картинки
 * @param imageBase64 {string} - картинка в base64
 * @param targetSize {number} - целевой размер меньшей стороны картинки
 * @return {string} (base64)
 */
export function resizeImage(imageBase64: string, targetSize: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const tempImg = new Image();

    tempImg.onload = function() { //tslint:disable-line
      // Расчитываем новые размеры изображения
      const tempImgSize = {
        width: tempImg.width,
        height: tempImg.height,
      };

      if (tempImgSize.width > tempImgSize.height) {
        tempImgSize.width = tempImgSize.width * targetSize / tempImgSize.height;
        tempImgSize.height = targetSize;
      } else {
        tempImgSize.height = tempImgSize.height * targetSize / tempImgSize.width;
        tempImgSize.width = targetSize;
      }

      // Создаем холст
      const canvas = document.createElement('canvas');
      canvas.width = tempImgSize.width;
      canvas.height = tempImgSize.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(tempImg, 0, 0, tempImgSize.width, tempImgSize.height);
      const dataUrl = canvas.toDataURL();

      resolve(dataUrl);
    };

    tempImg.src = imageBase64;
  });
}

/**
 * конвертация объекта Uint8array в Data URL(base64)
 * @param inputData {Uint8array}
 * @return {string} (Data URL base64)
 */
export function uint8ToBase64(inputData: Uint8Array): string {
  let size = inputData.length;
  const binaryString = new Array(size);
  while (size--) {
    binaryString[size] = String.fromCharCode(inputData[size]);
  }
  const data = binaryString.join('');
  const base64 = window.btoa(data);
  const src = `data:image/png;base64,${base64}`;
  return src;
}
