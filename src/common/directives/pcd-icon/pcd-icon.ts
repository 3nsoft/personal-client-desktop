/* tslint:disable:max-line-length */
/* tslint:disable:no-string-literal */
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
import { IScope, IDirective, IAugmentedJQuery, IAngularStatic } from 'angular';
export const ModuleName = '3nClient.directive.pcd-icon';

const SHAPES: {[name: string]: string} = {
  'help': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/><path d="M0 0h24v24H0z" fill="none"/></svg>',
  'hexa': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><path fill-rule="evenodd" d="M31.589 28.783L20.41 35.335a4.755 4.755 0 0 1-4.821 0L4.41 28.783A4.912 4.912 0 0 1 2 24.544V11.438a4.91 4.91 0 0 1 2.41-4.239L15.589.647A4.756 4.756 0 0 1 17.86 0h.28a4.749 4.749 0 0 1 2.27.647l11.179 6.552A4.908 4.908 0 0 1 34 11.438v13.106a4.91 4.91 0 0 1-2.411 4.239z"/></svg>',
  'dode': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><path fill-rule="evenodd" d="M34 22.287v2.257a4.91 4.91 0 0 1-2.411 4.239l-2.024 1.186-.98 1.698a4.912 4.912 0 0 1-4.208 2.466l-1.937.012-2.03 1.19a4.755 4.755 0 0 1-4.821 0l-1.931-1.132-2.238.015a4.759 4.759 0 0 1-4.175-2.41l-1.163-2.045-1.672-.98A4.912 4.912 0 0 1 2 24.544v-1.961l-1.16-2.04a4.908 4.908 0 0 1 .031-4.876L2 13.713v-2.275a4.91 4.91 0 0 1 2.41-4.239l2.041-1.196.973-1.686a4.913 4.913 0 0 1 4.207-2.466l1.925-.012L15.589.647A4.756 4.756 0 0 1 17.86 0h.28a4.749 4.749 0 0 1 2.27.647l1.935 1.134 2.244-.015a4.76 4.76 0 0 1 4.175 2.411l1.166 2.05 1.659.972A4.908 4.908 0 0 1 34 11.438v1.948l1.169 2.055a4.908 4.908 0 0 1-.032 4.877L34 22.287z"/></svg>',
  'chat': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/><path d="M0 0h24v24H0z" fill="none"/></svg>',
  'mail_outline': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z"/><path fill="none" d="M0 0h24v24H0z"/></svg>',
  'group': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/><path d="M0 0h24v24H0z" fill="none"/></svg>',
  'flag': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/><path d="M0 0h24v24H0z" fill="none"/></svg>',
  'delete': '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/><path d="M0 0h24v24H0z" fill="none"/></svg>',
  'close': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/><path d="M0 0h24v24H0z" fill="none"/></svg>',
  'add': '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/><path d="M0 0h24v24H0z" fill="none"/></svg>',
  'more_vert': '<svg class="pcd-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/><path d="M0 0h24v24H0z" fill="none"/></svg>',
  'home': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/><path d="M0 0h24v24H0z" fill="none"/></svg>',
  'folder': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/><path d="M0 0h24v24H0z" fill="none"/></svg>',
  'attach_file': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/><path d="M0 0h24v24H0z" fill="none"/></svg>',
  'reply': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/><path d="M0 0h24v24H0z" fill="none"/></svg>',
  'reply_all': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M7 8V5l-7 7 7 7v-3l-4-4 4-4zm6 1V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/><path d="M0 0h24v24H0z" fill="none"/></svg>',
  'forward': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 8V4l8 8-8 8v-4H4V8z"/></svg>',
  'keyboard_arrow_down': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M7.41 7.84L12 12.42l4.59-4.58L18 9.25l-6 6-6-6z"/></svg>',
  'keyboard_arrow_up': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>',
  'send': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>',
  'move_to_inbox': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19 15h-4c0 1.66-1.35 3-3 3s-3-1.34-3-3H4.99V5H19v10zm0-12H4.99c-1.11 0-1.98.9-1.98 2L3 19c0 1.1.88 2 1.99 2H19c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/><path d="M16 10h-2V7h-4v3H8l4 4 4-4z"/></svg>',
  'check_box_outline': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/></svg>',
  'check_box': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2V5c0-1.1-.89-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
  'arrow_drop_down': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/><path d="M0 0h24v24H0z" fill="none"/></svg>',
  'select_all': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3 5h2V3c-1.1 0-2 .9-2 2z"/><path d="M3 13h2v-2H3v2z"/><path d="M7 21h2v-2H7v2z"/><path d="M3 9h2V7H3v2z"/><path d="M13 3h-2v2h2V3z"/><path d="M19 3v2h2c0-1.1-.9-2-2-2z"/><path d="M5 21v-2H3c0 1.1.9 2 2 2z"/><path d="M3 17h2v-2H3v2z"/><path d="M9 3H7v2h2V3z"/><path d="M11 21h2v-2h-2v2z"/><path d="M19 13h2v-2h-2v2z"/><path d="M19 21c1.1 0 2-.9 2-2h-2v2z"/><path d="M19 9h2V7h-2v2z"/><path d="M19 17h2v-2h-2v2z"/><path d="M15 21h2v-2h-2v2z"/><path d="M15 5h2V3h-2v2z"/><path d="M9 9h6v6H9V9zm-2 8h10V7H7v10z"/></svg>',
  'panorama_fish_eye': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>',
  'save_alt': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z"/><path fill="none" d="M0 0h24v24H0z"/></svg>',
  'attachment': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M7.5 18C4.46 18 2 15.54 2 12.5S4.46 7 7.5 7H18c2.21 0 4 1.79 4 4s-1.79 4-4 4H9.5C8.12 15 7 13.88 7 12.5S8.12 10 9.5 10H17v1.5H9.5c-.55 0-1 .45-1 1s.45 1 1 1H18c1.38 0 2.5-1.12 2.5-2.5S19.38 8.5 18 8.5H7.5c-2.21 0-4 1.79-4 4s1.79 4 4 4H17V18H7.5z"/></svg>',
  'lens': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>',
  'done': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>',
  'text_format': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M5 17v2h14v-2H5z"/><path d="M12 5.98L13.87 11h-3.74L12 5.98zM9.5 12.8h5l.9 2.2h2.1L12.75 4h-1.5L6.5 15h2.1l.9-2.2z"/></svg>',
  'perm_identity': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 4C9.79 4 8 5.79 8 8s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 1.9c1.16 0 2.1.94 2.1 2.1 0 1.16-.94 2.1-2.1 2.1-1.16 0-2.1-.94-2.1-2.1 0-1.16.94-2.1 2.1-2.1"/><path d="M12 13c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4zm0 1.9c2.97 0 6.1 1.46 6.1 2.1v1.1H5.9V17c0-.64 3.13-2.1 6.1-2.1"/></svg>',
  'done_all': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7z"/><path d="M22.24 5.59L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41z"/><path d="M.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z"/></svg>',
  'group_add': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M8 10H5V7H3v3H0v2h3v3h2v-3h3v-2z"/><path d="M18 11c1.66 0 2.99-1.34 2.99-3S19.66 5 18 5c-.32 0-.63.05-.91.14.57.81.9 1.79.9 2.86 0 1.07-.34 2.04-.9 2.86.28.09.59.14.91.14z"/><path d="M13 11c1.66 0 2.99-1.34 2.99-3S14.66 5 13 5c-1.66 0-3 1.34-3 3s1.34 3 3 3z"/><path d="M19.62 13.16c.83.73 1.38 1.66 1.38 2.84v2h3v-2c0-1.54-2.37-2.49-4.38-2.84z"/><path d="M13 13c-2 0-6 1-6 3v2h12v-2c0-2-4-3-6-3z"/></svg>',
  'insert_emoticon': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-.01-18C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2z"/><path d="M15.5 11c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5z"/><path d="M8.5 11c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11z"/><path d="M12 17.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>',
  'volume_off': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63z"/><path d="M19 12c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71z"/><path d="M4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3z"/><path d="M12 4L9.91 6.09 12 8.18V4z"/></svg>',
  'exit_to_app': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59z"/><path d="M19 3H5c-1.11 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/></svg>',
  'search': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>',
  'person_add': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z"/><path d="M6 10V7H4v3H1v2h3v3h2v-3h3v-2H6z"/><path d="M15 14c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>',
  'warning': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>',
  'people_outline': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M21.5 17.5H14v-1.25c0-.46-.2-.86-.52-1.22.88-.3 1.96-.53 3.02-.53 2.44 0 5 1.21 5 1.75v1.25zm-9 0h-10v-1.25c0-.54 2.56-1.75 5-1.75s5 1.21 5 1.75v1.25zm4-4.5c-1.2 0-3.07.34-4.5 1-1.43-.67-3.3-1-4.5-1C5.33 13 1 14.08 1 16.25V19h22v-2.75c0-2.17-4.33-3.25-6.5-3.25z"/><path d="M7.5 6.5c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 5.5c1.93 0 3.5-1.57 3.5-3.5S9.43 5 7.5 5 4 6.57 4 8.5 5.57 12 7.5 12z"/><path d="M16.5 6.5c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 5.5c1.93 0 3.5-1.57 3.5-3.5S18.43 5 16.5 5 13 6.57 13 8.5s1.57 3.5 3.5 3.5z"/></svg>',
  'folder_open': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/></svg>',
  'edit': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"/><path d="M20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>',
  'call_received': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M20 5.41L18.59 4 7 15.59V9H5v10h10v-2H8.41z"/></svg>',
  'call_made': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M9 5v2h6.59L4 18.59 5.41 20 17 8.41V15h2V5z"/></svg>',
  'expand_more': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/></svg>',
  'expand_less': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z"/></svg>',
  'format_color_text': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 20h24v4H0z"/><path d="M11 3L5.5 17h2.25l1.12-3h6.25l1.12 3h2.25L13 3h-2zm-1.38 9L12 5.67 14.38 12H9.62z"/></svg>',
  'file_download': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 20h24v4H0z"/><path d="M19 9h-4V3H9v6H5l7 7 7-7z"/><path d="M5 18v2h14v-2H5z"/></svg>',
  'file_upload': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 20h24v4H0z"/><path d="M9 16h6v-6h4l-7-7-7 7h4z"/><path d="M5 18h14v2H5z"/></svg>',
  'stop': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M6 6h12v12H6z"/></svg>',
};

class PcdIconDirective implements IDirective {

  restrict = 'E';

  static instance(): IDirective {
    return new PcdIconDirective();
  }

  link(scope: IScope, element: IAugmentedJQuery, attrs: any) {
    console.debug(scope); // tslint:disable-line
    const size: string = attrs['size'] === undefined ? '24' : attrs['size'];
    let shape: string = this.getShape(attrs['icon']);
    let iconColor: string = attrs['color'] === undefined ? '#000000' : attrs['color'];
    this.createIcon(element, shape, iconColor, size);

    attrs.$observe('icon', (newIcon: string) => {
      shape = this.getShape(newIcon);
      this.createIcon(element, shape, iconColor, size);
    });

    attrs.$observe('color', (newColor: string) => {
      iconColor = newColor === undefined ? '#000000' : newColor;
      this.createIcon(element, shape, iconColor, size);
    });
  }

  private createIcon(
    element: IAugmentedJQuery,
    shape: string,
    color: string,
    size: string,
  ): void {
    const newShape = shape.replace('<svg ', `<svg width="${size}" height="${size}" fill="${color}" `);
    const htmlElement = element.html(newShape);
    htmlElement[0].style.width = `${size}px`;
    htmlElement[0].style.height = `${size}px`;
  }

  private getShape(icon: string): string {
    if (Object.keys(SHAPES).includes(icon)) {
      return SHAPES[icon];
    }
    console.error(`The icon with name "${icon}" is absent!`);
    return SHAPES['help'];
  }

}

export function addDirective(angular: IAngularStatic): void {
  const mod = angular.module(ModuleName, []);
  mod.directive('pcdIcon', PcdIconDirective.instance);
}
