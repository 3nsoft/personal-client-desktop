/*
 Copyright (C) 2017 3NSoft Inc.

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

export function logError(msg: string, err: any): Promise<void>;
export function logError(err: any): Promise<void>;
export function logError(msg: string): Promise<void>;
export async function logError(msgOrErr: any, err?: any): Promise<void> {
  if (err === undefined) {
    console.error(msgOrErr);
  } else {
    console.error(msgOrErr, err);
  }
  if (typeof msgOrErr === 'string') {
    await w3n.log('error', msgOrErr, jsonifyError(err));
  } else {
    await w3n.log('error', '', jsonifyError(msgOrErr));
  }
}

function jsonifyError(err: any): any {
  if (!err) { return err; }
  if ((err as Error).stack) {
    return {
      message: err.message,
      stack: err.stack,
      cause: jsonifyError(err.cause),
    };
  } else {
    return err;
  }
}

export function logWarning(msg: string, err: any): Promise<void>;
export function logWarning(err: any): Promise<void>;
export function logWarning(msg: string): Promise<void>;
export async function logWarning(msgOrErr: any, err?: any): Promise<void> {
  if (err === undefined) {
    console.warn(msgOrErr);
  } else {
    console.warn(msgOrErr, err);
  }
  if (typeof msgOrErr === 'string') {
    await w3n.log('warning', msgOrErr, jsonifyError(err));
  } else {
    await w3n.log('warning', '', jsonifyError(msgOrErr));
  }
}

export async function logInfo(...info: any[]): Promise<void> {
  console.log(...info);
  let msg = '';
  info.forEach((item, index) => {
    if (index > 0) {
      msg += '\n';
    }

    if (typeof item === 'string') {
      msg += item;
      return;
    }

    try {
      msg += JSON.stringify(item)
        .split('\\n').join('\n')
        .split('\\\\').join('\\');
    } catch (err) {
      msg += `<json-error>${err.message}</json-error>`;
    }
  });
  await w3n.log('info', msg);
}
