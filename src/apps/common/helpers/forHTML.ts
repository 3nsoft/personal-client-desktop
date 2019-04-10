/**
 * функция преобразования html в plainText
 * @param {string} html
 * @returns {string} plain text
 */
export function html2text(html: string): string {
  const tag = document.createElement('div');
  tag.innerHTML = html;
  return tag.innerText;
}

/**
 * поиск всех предков элемента до BODY
 * @param elem {Element}
 */
export function findAllParents(elem: Element): HTMLElement[] {
  const parents: HTMLElement[] = [];
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
 * @return {boolean}
 */
export function inTheList(list: HTMLElement[], selector: string): boolean {
  const searchElement = document.querySelector(selector);
  return list.some(elem => elem === searchElement);
}
