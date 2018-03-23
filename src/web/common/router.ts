/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. */

import { Observable, Subject, Subscription } from 'rxjs';
import * as CONST from './services/const';
import * as IMAGES from './services/images';
import * as CacheSrvMod from './services/cache-srv';
import * as NotificationSrvMod from '../common/services/notifications/notifications-srv';
import * as TagSrvMod from '../common/services/tags/tag-srv';
import * as ContactsAppSrvMod from '../contacts/contacts-app/contacts-app-srv';
import * as MailFsSrvMod from '../mail/mail-app/mail-fs-srv';
import * as MailSrvMod from '../mail/mail-app/mail-srv';
import * as MailFoldersFsSrvMod from '../mail/mail-folders/mail-folders-fs-srv';
import * as MailFoldersSrvMod from '../mail/mail-folders/mail-folders-srv';
import * as MailTransform from '../common/services/transform-mail';
import { Chats } from '../chat/common/chats';
import * as ChatNetSrvMod from '../chat/common/chat-net-srv';
import { logError } from '../common/libs/logging';

export function router($stateProvider: angular.ui.IStateProvider, $urlRouterProvider: angular.ui.IUrlRouterProvider): void {
	$urlRouterProvider
		.otherwise('/');

	$stateProvider
		.state('root', {
			url: '/',
			template: `<main></main>`,
			resolve: {
				data: [
					'$timeout',
					CacheSrvMod.CacheSrvName,
					NotificationSrvMod.NotificationsSrvName,
					TagSrvMod.TagsSrvName,
					ContactsAppSrvMod.ContactsAppSrvName,
					MailFsSrvMod.MailFsSrvName,
					MailSrvMod.MailSrvName,
					MailFoldersFsSrvMod.MailFoldersFsSrvName,
					MailFoldersSrvMod.MailFoldersSrvName,
					async (
						$timeout: angular.ITimeoutService,
						_cacheSrv: CacheSrvMod.Cache,
						_notificationSrv: NotificationSrvMod.Srv,
						_tagSrv: TagSrvMod.Srv,
						_contactSrv: ContactsAppSrvMod.Srv,
						_mailFsSrv: MailFsSrvMod.Srv,
						_mailSrv: MailSrvMod.Srv,
						_folderFsSrv: MailFoldersFsSrvMod.Srv,
						_mailFoldersSrv: MailFoldersSrvMod.Srv) => {
							try {
								// текущий пользователь приложения
								_cacheSrv.username = await w3n.mail.getUserId();
								// чтение записанных ранее notifications
								await _notificationSrv.readNotifications();
								// чтение списка тэгов
								await _tagSrv.readTagList();
								// список контактов и групп контактов приложения
								await _contactSrv.readPersonsMap();
								await _contactSrv.readGroupsMap();
								const supportPerson: client3N.PersonJSON = {
									personId: '0',
									nickName: 'Support',
									fullName: '3NSoft support',
									phone: '',
									notice: '',
									avatar: IMAGES.IMAGE_SUPPORT
								};
								await _contactSrv.createPresetPerson(supportPerson, 'support@3nweb.com', IMAGES.IMAGE_SUPPORT_MINI);
								// список почтовых папок
								await _folderFsSrv.readFolderList();
								// список сообщений
								await _mailFsSrv.readMsgList();
								// TO DO добавление списка сообщениями из Inbox
								await _mailSrv.refreshInbox();
								_mailSrv.checkSendingList();
								// список актиных чатов
								const chats = new Chats();
								_cacheSrv.chats.list = await chats.readChatList();
								$timeout(() => {
									_cacheSrv.chats.unreadChatsQuantity = _cacheSrv.chats.list.reduce((summ, chat) => {
										return summ + (chat.isRead ? 0 : 1)
									}, 0)
								})
								console.log(_cacheSrv.chats.list)
								console.log(_cacheSrv.folders.list);
							} catch (err) {
								logError(err);
							}
					}
				]
			}
		})
		// chat app
		.state('root.chat', {
			url: 'chat',
			template: `<chat-app></chat-app>`,
		})
		.state('root.chat.room', {
			url: '/room/{chatId}',
			template: `<chat-content chat-id="$ctrl.chatId">
			</chat-content>`,
			controller: ['$stateParams', CacheSrvMod.CacheSrvName, 'log', function ($stateParams: angular.ui.IStateParamsService, $bus: CacheSrvMod.Cache, log: client3N.ChatLog[])  {
				this.chatId = $stateParams.chatId;
				$bus.chats.logContent = log;
			}],
			controllerAs: '$ctrl',
			resolve: {
				log: ['$stateParams', '$q', ($stateParams: angular.ui.IStateParamsService, $q: angular.IQService) => {
					 const chats = new Chats()
					 return $q.when(chats.readLogChat($stateParams.chatId))
				}]
			}
		})
		// mail app
		.state('root.mail', {
			url: 'mail',
			template: `<mail-app></mail-app>`
		})
		.state('root.mail.folder', {
			url: '/folder/{folderId}',
			params: {
				msgId: null
			},
			template: `<mail-folder msg-list="$ctrl.folder" msg-sel="$ctrl.msg"></mail-folder>`,
			controller: [CacheSrvMod.CacheSrvName, 'data', function(_cacheSrv: CacheSrvMod.Cache, data: {folder: { [id: string]: client3N.MessageMapping}, msgId: string }) {
				this.folder = data.folder;
				this.msg = (!!data.msgId) ? _cacheSrv.messages.list[data.msgId] : null;
			}],
			controllerAs: '$ctrl',
			resolve: {
				data: ['$stateParams', CacheSrvMod.CacheSrvName, ($stateParams: angular.ui.IStateParamsService, _cacheSrv: CacheSrvMod.Cache) => {
					try {
						let result = {
							folder: <{ [id: string]: client3N.MessageMapping }>{},
							msgId: <string>($stateParams as any).msgId
						};
						const folderId: string = ($stateParams as any).folderId;
						_cacheSrv.folders.selectId = folderId;
						if (!!_cacheSrv.messages.list) {
							for (let id of Object.keys(_cacheSrv.messages.list)) {
								if (_cacheSrv.messages.list[id].folderId === folderId) {
									result.folder[id] = _cacheSrv.messages.list[id];
								}
							}
						}
						return result;
					} catch (err) {
						logError(err);
					}
				}]
			}
		})
		.state('root.mail.folder.msg', {
			url: '/msg/{id}',
			template: `<msg-showing msg-content="$ctrl.msgContent"></msg-showing>`,
			controller: ['data', function (data: client3N.MessageEditContent) {
				this.msgContent = data;
			}],
			controllerAs: '$ctrl',
			resolve: {
				data: ['$stateParams', CacheSrvMod.CacheSrvName, MailSrvMod.MailSrvName, MailFsSrvMod.MailFsSrvName, async ($stateParams: angular.ui.IStateParamsService, _cacheSrv: CacheSrvMod.Cache, _mailSrv: MailSrvMod.Srv, _mailFsSrv: MailFsSrvMod.Srv) => {
					try {
						const msgId = $stateParams.id;
						let msgJson: client3N.MessageJSON;
						if (_cacheSrv.messages.list[msgId].folderId !== CONST.SYS_MAIL_FOLDERS.inbox) {
							msgJson = await _mailFsSrv.readMsgData(msgId);
						} else {
							msgJson = await _mailSrv.readMsgDataFromInbox(msgId);
						}
						const msgEdit = MailTransform.msgJsonToEdit(_cacheSrv.contacts.list, msgJson);
						return msgEdit;
					} catch (err) {
						logError(err);
					}
				}]
			}
		})
		// contacts app
		.state('root.contacts', {
			url: 'contacts',
			params: {
				pId: null
			},
			template: `<contacts-app></contacts-app>`
		})
		.state('root.contacts.person', {
      url: '/person/{personId}',
      template: `<person data="$ctrl.contact"></person>`,
      controller: ['data', function (data: client3N.PersonJSON) {
        this.contact = data;
      }],
      controllerAs: '$ctrl',
      resolve: {
        data: ['$stateParams', ContactsAppSrvMod.ContactsAppSrvName, CacheSrvMod.CacheSrvName, async ($stateParams: angular.ui.IStateParamsService, _contactSrv: ContactsAppSrvMod.Srv, _cacheSrv: CacheSrvMod.Cache) => {
          try {
						let pId = ($stateParams as any).personId;
						_cacheSrv.contacts.select = pId;
            let personMap = _cacheSrv.contacts.list[pId];
            let person = <client3N.PersonJSON>null;
            person = await _contactSrv.readPersonData(pId);
            return person;
          } catch(err) {
            logError(err);
          }
        }]
      }
		})
		.state('root.groups', {
      	url: 'groups',
			template: `<groups-app></groups-app>`,
			params: {
				grId: null
			}
		})
		.state('root.groups.group', {
      url: '/group/{groupId}',
      template:`<group group="$ctrl.group"></group>`,
      controller: ['data', function(data: client3N.GroupJSON) {
        this.group = data;
      }],
      controllerAs: '$ctrl',
      resolve: {
        data: ['$stateParams', ContactsAppSrvMod.ContactsAppSrvName, CacheSrvMod.CacheSrvName, async ($stateParams: angular.ui.IStateParamsService, _contactSrv: ContactsAppSrvMod.Srv, _cacheSrv: CacheSrvMod.Cache) => {
          try {
            let grId = ($stateParams as any).groupId;
            let groupMap = _cacheSrv.groups.list[grId];
            let group = await _contactSrv.readGroupData(grId);
            return group;
          } catch (err) {
            logError(err);
          }
        }]
      }
		})
		// storage app
		.state('root.storage', {
			url: 'storage/{placeId}/{location}',
			template: `<storage-app></storage-app>`
		});


}
