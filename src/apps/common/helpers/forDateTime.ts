/**
 * преобразование даты/времени в мс в строку формата "гггг-мм-дд"
 * @param timestamp {number}
 * @return {string}
 */
export function dateToString(timestamp: number): string {
  const inParam = new Date(timestamp);
  const timeParse = {
    year: inParam.getFullYear(),
    month: (inParam.getMonth() + 1) < 10 ?
      `0${inParam.getMonth() + 1}` :
      `${inParam.getMonth() + 1}`,
    date: (inParam.getDate() < 10) ?
    `0${inParam.getDate()}` :
    `${inParam.getDate()}`,
  };
  return `${timeParse.year}-${timeParse.month}-${timeParse.date}`;
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
    hours: (sourceMsgCrTime.getHours() < 10) ?
      `0${sourceMsgCrTime.getHours()}` :
      `${sourceMsgCrTime.getHours()}`,
    min: (sourceMsgCrTime.getMinutes() < 10) ?
      `0${sourceMsgCrTime.getMinutes()}` :
      `${sourceMsgCrTime.getMinutes()}`,
    date: (sourceMsgCrTime.getDate() < 10) ?
      `0${sourceMsgCrTime.getDate()}` :
      `${sourceMsgCrTime.getDate()}`,
    month: (sourceMsgCrTime.getMonth() + 1) < 10 ?
      `0${sourceMsgCrTime.getMonth() + 1}` :
      `${sourceMsgCrTime.getMonth() + 1}`,
    year: `${sourceMsgCrTime.getFullYear()}`,
  };
  return !withoutTime ?
    `${sourceMsgTime.hours}:${sourceMsgTime.min} ${sourceMsgTime.date}.${sourceMsgTime.month}.${sourceMsgTime.year}` :
    `${sourceMsgTime.date}.${sourceMsgTime.month}.${sourceMsgTime.year}`;
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
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const month = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const currentDate = new Date(timestamp);
  const result = {
    hours: (currentDate.getHours() < 10) ?
      `0${currentDate.getHours()}` :
      currentDate.getHours(),
    min: (currentDate.getMinutes() < 10) ?
      `0${currentDate.getMinutes()}` :
      currentDate.getMinutes(),
    day: days[currentDate.getDay()],
    date: (currentDate.getDate() < 10) ?
      `0${currentDate.getDate()}` :
      currentDate.getDate(),
    month: month[currentDate.getMonth()],
  };

  if (isDateInPeriod(currentDate, 'today')) {
    return !withoutTime ? `${result.hours}:${result.min}` : 'Today';
  }

  if (isDateInPeriod(currentDate, 'week')) {
    return !withoutTime ?
      `${result.day} at ${result.hours}:${result.min}` :
      `${result.day}`;
  }

  return !withoutTime ?
    `${result.date} ${result.month} at ${result.hours}:${result.min}` :
    `${result.date} ${result.month}`;
}
