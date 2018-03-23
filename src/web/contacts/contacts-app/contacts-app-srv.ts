/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. */

import * as Lib from '../../common/services/lib-internal';
import * as TransformC from '../../common/services/transform-contact';
import * as CONST from '../../common/services/const';
import * as CacheSrvMod from '../../common/services/cache-srv';
import * as NotificationsSrvMod from '../../common/services/notifications/notifications-srv';
import { logError } from '../../common/libs/logging';

export let ModuleName = "3nClient.services.contacts-app-srv";
export let ContactsAppSrvName = "contactsAppService";

export function addService(angular: angular.IAngularStatic): void {
  let mod = angular.module(ModuleName, [CacheSrvMod.ModuleName, NotificationsSrvMod.ModuleName]);
  mod.service(ContactsAppSrvName, Srv);
}

export class Srv {
  fs: web3n.files.WritableFS = null;
  private initializing: Promise<void> = null;

  static $inject = ["$state", "$q", "$rootScope", "$timeout", "$sanitize", "$mdToast", CacheSrvMod.CacheSrvName, NotificationsSrvMod.NotificationsSrvName];
  constructor(
    private $state: angular.ui.IStateService,
    private $q: angular.IQService,
    private $rootScope: angular.IRootScopeService,
    private $timeout: angular.ITimeoutService,
    private $sanitize: angular.sanitize.ISanitizeService,
    private $mdToast: angular.material.IToastService,
    private cacheSrv: CacheSrvMod.Cache,
    private notificationsSrv: NotificationsSrvMod.Srv
    ) {
    this.initializing = w3n.storage.getAppSyncedFS(`${CONST.FS_USED.CONTACTS}`).then((fs) => { this.fs = fs; this.initializing = null; });
  }

  /**
	 * функция чтения картинки из внешней файловой системы и преобразование ее
	 * в формат Data URL base64
	 * @return {string} (base64)
	 */
	async openFileAndConvertToBase64(): Promise<string> {
		let title = "Select image:";
		let openFiles = await w3n.device.openFileDialog(title, null, false);
		let openFile: Uint8Array;
		
		if (!!openFiles) {
			openFile = await openFiles[0].readBytes();
			let src = Lib.uint8ToBase64(openFile);
			// console.log(src);
			return src;
		}
  };
  
  /**
   * создание контакта c заданными параметрами
   * @param dataToJson {client3N.PersonJSON}
   * @param mail {string}
   * @param minAvatar {string}
   */
   async createPresetPerson(dataToJson: client3N.PersonJSON, mail: string, minAvatar: string): Promise<void> {
    let personJsonToSave = angular.copy(dataToJson);
    let personMapToSave = TransformC.personJsonToMapping(dataToJson);
    personMapToSave.mails.push(mail);
    personMapToSave.minAvatar = minAvatar;
    personMapToSave.groups = [];
    personMapToSave.isConfirm = true;

    if (!Object.keys(this.cacheSrv.contacts.list).includes(personMapToSave.personId)) {
      this.cacheSrv.contacts.list[personMapToSave.personId] = personMapToSave;
      await this.writePersonsMap();
      await this.writePersonData(personJsonToSave);
    }
   }

  /**
   * функция чтения списка контактов
   * @return { {[id: string]: client3N.PersonMapping} }
   */
  async readPersonsMap(): Promise<{ [id: string]: client3N.PersonMapping }> {
    if (this.initializing) { await this.initializing; }

    let thee = this;    
    let personsMapping = await this.fs.readJSONFile<{ [id: string]: client3N.PersonMapping }>(CONST.USED_FILES_NAMES.personsMap)
      .catch(async function (exc: web3n.files.FileException) {
        if (!exc.notFound) {
          logError(exc);
          throw exc;
        }
        thee.$timeout(() => {
          thee.cacheSrv.contacts.total = 0;
          thee.cacheSrv.contacts.letters = [];
        });
        return {};
      });
    
    this.$timeout(() => {
      this.cacheSrv.contacts.list = angular.copy(personsMapping);
      this.cacheSrv.contacts.total = Lib.sizeObject(this.cacheSrv.contacts.list);
      this.cacheSrv.contacts.letters = Lib.getAllLetters(this.cacheSrv.contacts.list);
    });
    return personsMapping;
  };

  /**
   * функция записи списка контактов
   * @param data? { {[id: string]: client3N.PersonMapping} } - если параметр не передается, то
   * производится запись объекта из cacheSrv
   * @return Promise<void>
   */
  async writePersonsMap(data?: { [id: string]: client3N.PersonMapping }): Promise<void> {
    if (this.initializing) { await this.initializing; }
    
    let dataToWrite: { [id: string]: client3N.PersonMapping };
    if (!!data) {
      dataToWrite = data;
    } else {
      dataToWrite = angular.copy(this.cacheSrv.contacts.list);
    }
    this.$timeout(() => {
      this.cacheSrv.contacts.total = Lib.sizeObject(dataToWrite);
      this.cacheSrv.contacts.letters = Lib.getAllLetters(dataToWrite);
    });

    await this.fs.writeJSONFile(CONST.USED_FILES_NAMES.personsMap, dataToWrite)
      .catch(async function (exc: web3n.files.FileException) {
        logError(exc);
      });
  };

  /**
   * функция чтения данных контакта
   * @param personId {string}
   * @return {Promise<client3N.PersonJSON>}
   */
  async readPersonData(personId: string): Promise<client3N.PersonJSON> {
    if (this.initializing) { await this.initializing; }

    let result: client3N.PersonJSON;
    let path = `contacts/${personId}/data.json`;
    result = await this.fs.readJSONFile<client3N.PersonJSON>(path)
      .catch(async function (exc: web3n.files.FileException) {
        if (!exc.notFound) {
          logError(exc);
          throw exc;
        };
        return TransformC.newPersonJSON();
      })

    return result;
  };

  /**
   * функция записи данных контакта
   * @param data {client3N.PersonJSON}
   * @return {Promise<void>}
   */
  async writePersonData(data: client3N.PersonJSON): Promise<void> {
    if (this.initializing) { await this.initializing; }

    let path = `contacts/${data.personId}/data.json`;
    await this.fs.writeJSONFile(path, data)
      .catch((err) => {
        logError(err);
      })
  };

  /**
   * функция удаления группы выделенных контактов
   * @param markedPersons {string[]}
   * @return {Promise<void>}
   */
  deleteMarkPersons(markedPersons: string[]): Promise<void[]> {
    /*let delPersonsProm: ng.IPromise<void>[] = [];
    
    for (let personId of markedPersons) {
      let path = `contacts/${personId}`;
      let groups = angular.copy(this.cacheSrv.contacts.list[personId].groups);
      for (let grId of groups) {
        let grIndex = this.cacheSrv.groups.list[grId].members.indexOf(personId);
        if (grIndex !== -1) {
          this.cacheSrv.groups.list[grId].members.splice(grIndex, 1);
        }
      }

      delPersonsProm.push(this.$q.when(this.fs.deleteFolder(path, true)));
    }

    return this.$q.all(delPersonsProm)
      .then(() => {
        for (let pId of markedPersons) {
          delete this.cacheSrv.contacts.list[pId];
        }
        return this.$q.when(this.writePersonsMap(this.cacheSrv.contacts.list));
      })
      .then(() => {
        this.cacheSrv.contacts.total = Lib.sizeObject(this.cacheSrv.contacts.list);
        this.cacheSrv.contacts.letters = Lib.getAllLetters(this.cacheSrv.contacts.list);
        return this.$q.when(this.writeGroupsMap(this.cacheSrv.groups.list));
      })
      .then(() => {
        this.cacheSrv.contacts.select = null;
        this.cacheSrv.contacts.marked = [];
        this.cacheSrv.contacts.cMode = "hide";
        this.$state.reload();
      });*/

    let delPersonsProm: Promise<void>[] = []
    delPersonsProm = markedPersons.map(personId => {
      let path = `contacts/${personId}`
      let groups = angular.copy(this.cacheSrv.contacts.list[personId].groups)
      groups.map(grId => {
        let personIndexInGroup = this.cacheSrv.groups.list[grId].members.indexOf(personId)
        if (personIndexInGroup !== -1) {
          this.cacheSrv.groups.list[grId].members.splice(personIndexInGroup, 1)
        }
      })
      delete this.cacheSrv.contacts.list[personId]
      this.cacheSrv.contacts.total = Lib.sizeObject(this.cacheSrv.contacts.list)
      this.cacheSrv.contacts.letters = Lib.getAllLetters(this.cacheSrv.contacts.list)
      return this.fs.deleteFolder(path, true)
    })

    this.$q.when(this.writePersonsMap(this.cacheSrv.contacts.list))
    this.$q.when(this.writeGroupsMap(this.cacheSrv.groups.list))
    return Promise.all(delPersonsProm)
  };

  /**
   * функция "включения" флагов isConfirm и inBlackList
   * @param markedPersons {string[]}
   * @param flag {atring} - "confirm" or "b-list"
   * @return {ng.IPromise<void>}
   */
  setFlagMarkPersons(markedPersons: string[], flag: string): ng.IPromise<void> {
    for (let personId of markedPersons) {
      if (flag === "confirm") {
        this.cacheSrv.contacts.list[personId].isConfirm = true;
        let grConfirmIndex = this.cacheSrv.contacts.list[personId].groups.indexOf("0");
        this.cacheSrv.contacts.list[personId].groups.splice(grConfirmIndex, 1);
      } else {
        this.cacheSrv.contacts.list[personId].inBlackList = true;
        this.cacheSrv.contacts.list[personId].groups.push("1");
      }
    }

    return this.$q.when(this.writePersonsMap(this.cacheSrv.contacts.list))
      .then(() => {
        for (let personId of markedPersons) {
          if (flag === "confirm") {
            let personIndex = this.cacheSrv.groups.list["0"].members.indexOf(personId);
            this.cacheSrv.groups.list["0"].members.splice(personIndex, 1);
          } else {
            this.cacheSrv.groups.list["1"].members.push(personId);
          }
        }

        return this.$q.when(this.writeGroupsMap(this.cacheSrv.groups.list));
      })
      .then(() => {
        this.cacheSrv.contacts.marked = [];
        this.$rootScope.$broadcast("client_savePerson", { personDataToEdt: null, isMap: true });
      });

  };


  /* группы контактов */  

  /**
   * функция чтения списка групп контактов
   * @return { {[id: string]: client3N.GroupMapping} }
   */
  async readGroupsMap(): Promise<{ [id: string]: client3N.GroupMapping }> {
    if (this.initializing) { await this.initializing; }

    let thee = this;
    let groupsMapping = await this.fs.readJSONFile<{ [id: string]: client3N.GroupMapping }>(CONST.USED_FILES_NAMES.groupsMap)
      .catch(async function (exc: web3n.files.FileException) {
        if (!exc.notFound) { throw exc; };
        await thee.writeGroupsMap(CONST.GROUPS_MAP_DEFAULT);
        for (let key of Object.keys(CONST.GROUPS_JSON_DEFAULT)) {
          let path = `groups/${CONST.GROUPS_JSON_DEFAULT[key].groupId}/data.json`;
          await thee.fs.writeJSONFile(path, CONST.GROUPS_JSON_DEFAULT[key]);
        }
        thee.$timeout(() => {
          thee.cacheSrv.groups.list = angular.copy(CONST.GROUPS_MAP_DEFAULT);
          thee.cacheSrv.groups.total = Lib.sizeObject(thee.cacheSrv.groups.list);
          thee.cacheSrv.groups.letters = Lib.getAllLetters(thee.cacheSrv.groups.list)
        });  
        return CONST.GROUPS_MAP_DEFAULT;
      });
    
    this.$timeout(() => {
      this.cacheSrv.groups.list = angular.copy(groupsMapping);
      this.cacheSrv.groups.total = Lib.sizeObject(this.cacheSrv.groups.list);
      this.cacheSrv.groups.letters = Lib.getAllLetters(this.cacheSrv.groups.list);
    });  
    return groupsMapping;
  };

  /**
   * функция записи списка групп контактов
   * @param data? { {[id: string]: client3N.GroupMapping} } - если параметр не передается, то
   * производится запись объекта из cacheSrv
   * @return Promise<void>
   */
  async writeGroupsMap(data?: {[id: string]: client3N.GroupMapping}): Promise<void> {
    if (this.initializing) { await this.initializing; }
    
    let dataToWrite: { [id: string]: client3N.GroupMapping };
    if (!!data) {
      dataToWrite = data;
    } else {
      dataToWrite = angular.copy(this.cacheSrv.groups.list);
    }
    this.$timeout(() => {
      this.cacheSrv.groups.total = Lib.sizeObject(dataToWrite);
      this.cacheSrv.groups.letters = Lib.getAllLetters(dataToWrite);
    });

    await this.fs.writeJSONFile(CONST.USED_FILES_NAMES.groupsMap, dataToWrite)
      .catch(async function (exc: web3n.files.FileException) {
        logError(exc);
      });
  };

  /**
   * функция чтения данных группы контактов
   * @param groupId {string}
   * @return {Promise<client3N.GroupJSON>}
   */
  async readGroupData(groupId: string): Promise<client3N.GroupJSON> {
    if (this.initializing) { await this.initializing; }

    let result: client3N.GroupJSON;
    let path = `groups/${groupId}/data.json`;
    result = await this.fs.readJSONFile<client3N.GroupJSON>(path)
      .catch(async function (exc: web3n.files.FileException) {
        if (!exc.notFound) {
          logError(exc);
          throw exc;
        };
        return TransformC.newGroupJSON();
      })

    return result;
  };

  /**
   * функция записи данных группы контактов
   * @param data {client3N.GroupJSON}
   * @return {Promise<void>}
   */
  async writeGroupData(data: client3N.GroupJSON): Promise<void> {
    if (this.initializing) { await this.initializing; }

    let path = `groups/${data.groupId}/data.json`;
    await this.fs.writeJSONFile(path, data)
      .catch((err) => {
        logError(err);
      })
  };

  /**
   * функция удаления группы контактов
   * @param groupId {string}
   * @return {ng.IPromise<void>}
   */
  deleteGroup(groupId: string): ng.IPromise<void> {
    if ((groupId !== "0") && (groupId !== "1")) {
      let path = `groups/${groupId}`;
      let members = angular.copy(this.cacheSrv.groups.list[groupId].members);
      for (let personId of members) {
        let index = this.cacheSrv.contacts.list[personId].groups.indexOf(groupId);
        if (index > -1) {
          this.cacheSrv.contacts.list[personId].groups.splice(index, 1);
        }
      }
      delete this.cacheSrv.groups.list[groupId];


      return this.$q.when(this.writeGroupsMap(this.cacheSrv.groups.list))
        .then(() => {
          return this.$q.when(this.writePersonsMap(this.cacheSrv.contacts.list));
        })
        .then(() => {
          return this.$q.when(this.fs.deleteFolder(path, true));
        })
        .then(() => {
          this.cacheSrv.groups.select = null;
          this.cacheSrv.groups.grMode = "hide";
          this.$state.reload();
        });  
    }  
  };

}
