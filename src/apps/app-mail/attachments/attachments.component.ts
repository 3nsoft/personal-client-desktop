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
import { IAngularEvent, IAngularStatic, IComponentOptions, IScope, ITimeoutService } from 'angular';
import * as AttachServiceModule from '../services/attach.service';

export let ModuleName = '3nClient.attachments';
export function addComponent(ng: IAngularStatic): void {
  const mod = ng.module(ModuleName, []);
  mod.component('attachments', componentConfig);
}

class AttachmentsComponent {
  public key: string;
  public files: client3N.AttachFileInfo[] = [];
  public disable: boolean = false;
  public mode: 'normal'|'ban_of_addition' = 'normal';
  public complete: Function;
  public limit: number = 2;
  public isFullFileList: boolean = false;

  static $inject = ['$scope', '$timeout', AttachServiceModule.AttachServiceName];
  constructor(
    private $scope: IScope,
    private $timeout: ITimeoutService,
    private attachSrv: AttachServiceModule.AttachService,
  ) {}

  $onInit(): void {
    this.$scope.$on('attachment:complete', async (event: IAngularEvent, data: any) => {
      const flag = this.files.some(file => file.mode === 'toDelete');
      if (flag) {
        console.log('Запустить реальное удаление файлов');
        await this.finalRemoval();
      } else {
        this.complete({attached: this.files});
      }
    });

  }

  public getAttachmentsInfo(): string {
    if (this.getFileList()) {
      switch (this.getFileList().length) {
        case 0:
          return 'file';
        case 1:
          return '1 file';
        default:
          return `${this.getFileList().length} files`;
      }
    }
    return 'file';
  }

  public showFullFileList(): void {
    if (this.getFileList().length > 2) {
      this.$timeout(() => {
        this.isFullFileList = !this.isFullFileList;
        this.limit = this.isFullFileList ? 1000 : 2;
      });
    }
  }

  public deleteFile(fileName: string): void {
    let fileIndex: number = null;
    for (let i = 0; i < this.files.length; i++) {
      if (this.files[i].name === fileName) {
        fileIndex = i;
        break;
      }
    }
    const tmpFiles = this.files.slice();
    tmpFiles[fileIndex].mode = 'toDelete';
    this.howDisplay(tmpFiles);
  }

  public deleteAllFiles(): void {
    const tmpFiles = this.files.slice();
    tmpFiles.forEach(item => {
      item.mode = 'toDelete';
    });
    this.howDisplay(tmpFiles);
  }

  public async runAttachProcess(): Promise<void> {
    const files = await this.attachSrv.loadFilesFromExternalFS(this.key, this.files);
    const currentFiles = this.files ? this.files.slice() : [];
    this.$timeout(() => {
      this.files = currentFiles.concat(files);
    });
  }

  public async download(fileName: string): Promise<void> {
    await this.attachSrv.saveFileToExternalFS(this.key, fileName);
  }

  public async downloadAll(): Promise<void> {
    await this.attachSrv.saveAttachments(this.key);
  }

  public getFileList(): client3N.AttachFileInfo[] {
    return this.files ?
      this.files.filter(file => file.mode !== 'toDelete') :
      [];
  }

  private howDisplay(list: client3N.AttachFileInfo[]): void {
    let qtFilesNotToDelete: number = 0;
    list.forEach(item => {
      qtFilesNotToDelete = item.mode !== 'toDelete' ? qtFilesNotToDelete + 1 : qtFilesNotToDelete;
    });
    this.$timeout(() => {
      this.files = list.slice();
      if (qtFilesNotToDelete <= 2) {
        this.isFullFileList = false;
        this.limit = 2;
      }
    });
  }

  private async finalRemoval(): Promise<void> {
    if (this.getFileList().length !== 0) {
      const deletePromise: Promise<void>[] = [];
      this.files.forEach(file => {
        if (file.mode === 'toDelete') {
          deletePromise.push(this.attachSrv.deleteFile(this.key, file.name));
        }
      });
      await Promise.all(deletePromise);
    } else {
      await this.attachSrv.deleteFolder(this.key);
    }
    const tmpFiles = this.files.filter(file => file.mode !== 'toDelete');
    this.files = tmpFiles.slice();
    this.complete({attached: this.files});
  }

}

const componentConfig: IComponentOptions = {
  bindings: {
    key: '<',
    files: '=',
    disable: '<',
    mode: '<',
    complete: '&',
  },
  templateUrl: './apps/app-mail/attachments/attachments.component.html',
  controller: AttachmentsComponent,
};
