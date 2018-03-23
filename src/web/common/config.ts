/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. */

const APP_DEFAULT_PALETTE = {
	"background": "grey",
	"primary": "indigo",
	"accent": "amber",
	"warn": "red"
};

export function configApp($mdThemingProvider: angular.material.IThemingProvider, ngMdIconServiceProvider: any, ngQuillConfigProvider: any): void {

  /* add user theme */
  $mdThemingProvider.theme("myTheme")
    .primaryPalette(APP_DEFAULT_PALETTE.primary)
    .accentPalette(APP_DEFAULT_PALETTE.accent)
    .backgroundPalette(APP_DEFAULT_PALETTE.background)
    .warnPalette(APP_DEFAULT_PALETTE.warn);

  $mdThemingProvider.setDefaultTheme("myTheme");
	(<any>window).mdT = $mdThemingProvider;

	/* add user icons */
	ngMdIconServiceProvider.addShapes({
		'mail_outline': '<path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9' +
		' 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z"/>',
		'watch_later': '<path clip-path="url(#b)" d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5' +
		' 10-10S17.5 2 12 2zm4.2 14.2L11 13V7h1.5v5.2l4.5 2.7-.8 1.3z"/>',
		'subdirectory_arrow_right': '<path d="M19 15l-6 6-1.42-1.42L15.17 16H4V4h2v10h9.17l-3.59-3.58L13 9l6 6z"/>'
	});
	
	/* config Quill Editor */
  const toolbarOptions = [
    [{ 'font': [] }],
    [{ 'align': [] }],
    ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
    [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
    ['blockquote', 'code-block'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }]
  ];
  
  ngQuillConfigProvider.set(
    {
      modules: { 
        toolbar: toolbarOptions
      },
      theme: 'snow',
      placeholder: 'Type here ...'
    }
  ); 

}