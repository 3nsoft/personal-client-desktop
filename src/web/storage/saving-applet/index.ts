/*
 Copyright (C) 2018 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. */

import { SavingTask, SavingProcess } from "../common/saving-process";

(window as any).savingProc = (async (): Promise<SavingProcess> => {
	const task = await w3n.parent.getRemoteEventually<SavingTask>('savingTask');
	const proc = SavingProcess.start(task);
	proc.completion$
	.subscribe(undefined, undefined, () => w3n.closeSelf());
	return proc;
})();

// this test code uses angular, but it can be anything else
import * as SavingDisplayMod from './saving-display/saving-display';
SavingDisplayMod.addComponent(angular);

angular.module('storage.saving', [ SavingDisplayMod.ModuleName ]);