/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. */

import * as Constants from "./const";
import * as Lib from "./lib-internal";

/**
 * создание нового (пустого) объекта типа PersonJSON
 * @return new object PersonJSON
 */
export function newPersonJSON(): client3N.PersonJSON {
  return {
    personId: null,
    nickName: "",
    fullName: "",
    phone: "",
    notice: "",
    avatar: ""
  };
}

/**
 * создание нового (пустого) объекта типа PersonDataToEdit
 * @return new object PersonDataToEdit
 */
export function PersonDataToEdit(): client3N.PersonDataToEdit {
  return {
    personId: null,
    nickName: "",
    fullName: "",
    phone: "",
    notice: "",
		avatar: "",
		mails: [],
		groups: ["0"]
  };
}

/**
 * создание нового (пустого) объекта типа PersonMapping
 * @return new object PersonMapping
 */
export function newPersonMapping(): client3N.PersonMapping {
  return {
    personId: null,
		nickName: "",
    mails: [""],
    groups: ["0"],
		minAvatar: "",
		letter: "",
		isConfirm: false,
		inBlackList: false,
		initials: "",
		color: "#dddddd",
		labels: [],
		mode: ""
  };
}

/**
 * создание нового (пустого) объекта типа GroupJSON
 * @returns new object GroupJSON
 */
export function newGroupJSON(): client3N.GroupJSON {
  return {
    groupId: null,
		name: "",
		notice: "",
    avatar: ""
  };
}


/**
 * создание нового (пустого) объекта типа GroupMapping
 * @return new object GroupMapping
 */
export function newGroupMapping(): client3N.GroupMapping {
  return {
    groupId: null,
		name: "",
    members: [],
		minAvatar: "",
		isSystem: false,
		letter: "",
		initials: "",
		color: "#dddddd",
		labels: [],
		mode: ""
  };
}

/**
 * преобразование объекта тип PersonDataToEdit в объект типа PersonJSON
 * @param inData {PersonDataToEdit}
 * @return {PersonJSON}
 */
export function PersonDataToEditToJSON(inData: client3N.PersonDataToEdit): client3N.PersonJSON {
	let result: client3N.PersonJSON = {
		personId: inData.personId,
		nickName: inData.nickName,
		fullName: inData.fullName,
		phone: inData.phone,
		notice: inData.notice,
		avatar: inData.avatar
	};
	return result;
}


/**
 * преобразование объекта тип PersonJSON в объект типа PersonMapping
 * @param inData {PersonJSON}
 * @return {PersonMapping}
 */
export function personJsonToMapping(inData: client3N.PersonJSON): client3N.PersonMapping {
	let result: client3N.PersonMapping = {
		personId: inData.personId,
		nickName: inData.nickName,
		mails: [],
		groups: ["0"],
		minAvatar: "",
		letter: (!!inData.nickName) ? inData.nickName[0].toUpperCase() : "",
		isConfirm: false,
		inBlackList: false,
		initials: getInitials(inData.nickName),
		color: Lib.getColor(getInitials(inData.nickName)),
		labels: [],
		mode: ""
	};
	return result;
}

/**
 * преобразование объекта тип PersonDataToEdit в объект типа PersonMapping
 * @param inData {PersonDataToEdit}
 * @return {PersonMapping}
 */
export function PersonDataToEditToMapping(inData: client3N.PersonDataToEdit): client3N.PersonMapping {
	let result: client3N.PersonMapping = {
		personId: inData.personId,
		nickName: inData.nickName,
		mails: inData.mails,
		groups: inData.groups,
		minAvatar: "",
		letter: (!!inData.nickName) ? inData.nickName[0].toUpperCase() : "",
		isConfirm: false,
		inBlackList: false,
		initials: getInitials(inData.nickName),
		color: Lib.getColor(getInitials(inData.nickName)),
		labels: [],
		mode: ""
	};
	return result;
}

/**
 * преобразование объекта тип GroupSON в объект типа GroupMapping
 * @param inData {GroupJSON}
 * @return {GroupMapping}
 */
export function groupJsonToMapping(inData: client3N.GroupJSON): client3N.GroupMapping {
	let result: client3N.GroupMapping = {
		groupId: inData.groupId,
		name: inData.name,
		members: [],
		minAvatar: "",
		isSystem: false,
		letter: inData.name[0].toUpperCase(),
		initials: getInitials(inData.name),
		color: Lib.getColor(getInitials(inData.name)),
		labels: [],
		mode: ""
	};
	return result;
}

/**
 * выделение инициалов из названия контакта/группы
 * @param name {string}
 * @return {string}
 */
export function getInitials(name: string): string {
	let result = "";
	let partName = name.split(" ");
	if (partName.length === 1) {
		result = `${partName[0]} `.substr(0, 2);
	} else {
		result = partName[0][0] + partName[1][0];
	}
	return result;
}
