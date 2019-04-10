import { SYS_MAIL_FOLDERS  } from '../../../../common/const';

export function prepareFolderList(data: {[id: string]: client3N.MailFolder}): client3N.MailFolder[] {
  return Object.keys(data)
    .map(id => data[id])
    .sort((a: client3N.MailFolder, b: client3N.MailFolder) => Number(a.id) - Number(b.id))
    .filter(folder => Number(folder.id) >= Number(SYS_MAIL_FOLDERS.trash));
}
