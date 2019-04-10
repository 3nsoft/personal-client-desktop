/* tslint:disable:max-classes-per-file  */
/* tslint:disable:member-ordering */
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

import { SingleProc } from '../processes';
import { logError } from '../libs/logging';

export abstract class StorageOnFS<T> {
  protected initializing: Promise<void>|undefined;
  protected fs: T;

  protected constructor(
    fsPromise: Promise<T>,
  ) {
    this.initializing = fsPromise
      .then(fs => {
        this.fs = fs;
        this.initializing = undefined;
      });
  }
}

export class JsonFromFile<T> extends StorageOnFS<client3N.WritableVersionedFS> {
  private valueToSave: T|undefined;
  protected changeProc: SingleProc|undefined = new SingleProc();

  constructor(
    fsPromise: Promise<client3N.WritableVersionedFS>,
    private mainFilePath: string,
    private defaulValue: T,
  ) {
    super(fsPromise);
  }

  public async save(val: T, path?: string): Promise<void> {
    if (this.initializing) { await this.initializing; }
    if (!this.changeProc) {
      throw new Error(`Json from ${this.mainFilePath} is already closed.`);
    }

    this.valueToSave = val;
    return this.changeProc.startOrChain(async () => {
      if (this.valueToSave !== val) { return; }
      const fullPath = !path ?
        this.mainFilePath :
        `${this.mainFilePath}/${path}`;
      await this.fs.writeJSONFile(fullPath, val);
    })
    .catch( err => logError(`Error occured when saving json to ${this.mainFilePath}`, err));
  }

  public async get(path?: string): Promise<T> {
    if (this.initializing) { await this.initializing; }
    const fullPath = !path ?
      this.mainFilePath :
      `${this.mainFilePath}/${path}`;
    return await this.fs.readJSONFile<T>(fullPath)
      .catch((exc: client3N.FileException) => {
        if (exc.notFound) {
          return this.defaulValue;
        } else {
          throw exc;
        }
      });
  }

  public async delete(path?: string): Promise<void> {
    if (this.initializing) { await this.initializing; }
    const fullPath = !path ?
      this.mainFilePath :
      `${this.mainFilePath}/${path}`;
    return await this.fs.deleteFolder(fullPath, true)
      .catch((exc: client3N.FileException) => {
        logError(exc);
        throw exc;
      });
  }

  async saveLink(file: web3n.files.ReadonlyFile, path?: string): Promise<void> {
    if (this.initializing) { await this.initializing; }
    const fullPath = !path ?
      this.mainFilePath :
      `${this.mainFilePath}/${path}`;
    return await this.fs.link(fullPath, file)
      .catch((exc: client3N.FileException) => {
        logError(exc);
        throw exc;
      });
  }

  async readLink(fileName: string, path?: string): Promise<web3n.files.SymLink> {
    if (this.initializing) { await this.initializing; }
    const fullPath = !path ?
      `${this.mainFilePath}/${fileName}` :
      `${this.mainFilePath}/${path}/${fileName}`;
    return await this.fs.readLink(fullPath)
      .catch((exc: client3N.FileException) => {
        logError(exc);
        throw exc;
      });
  }

}
