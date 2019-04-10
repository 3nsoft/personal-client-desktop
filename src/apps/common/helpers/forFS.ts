/**
 * @params src {Web3N.ByteSource}
 * @params sink {Web3N.ByteSink}
 * @params bufSize {number} - опциональный параметр (размер буфера)
 * по умолчанию bufSize = 64K
 * @return {Promise<void>}
 */
export async function pipe(src: web3n.ByteSource, sink: web3n.ByteSink, bufSize = 64 * 1024): Promise<void> {
  let buf = await src.read(bufSize);
  while (buf) {
    await sink.write(buf);
    buf = await src.read(bufSize);
  }
  await sink.write(null);
}

/**
 * функция определения типа записанной на ФС сущности
 * @param fs {web3n.files.FS} - файловая система
 * @param folderPath {string} - имя папки
 * @param essenceName {string} - имя сущности в папке
 * @returns {'file' | 'folder' | 'link'}
 */
export async function whatIsIt(fs: web3n.files.FS, folderPath: string, essenceName: string): Promise<'file' | 'folder' | 'link'> {

  const list = await (fs as web3n.files.ReadonlyFS).listFolder(folderPath);
  console.log('list: ', list);
  for (const item of list) {
    if (item.name === essenceName) {
      return (item.isFolder) ? 'folder' : ((item.isFile) ? 'file' : 'link');
    }
  }
}
