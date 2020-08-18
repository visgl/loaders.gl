import {promises as fs} from 'fs';
import {join} from 'path';
import {compressFile} from './compress-util';

export default async function(path, data, slpk = false, fileName = 'index.json') {
  await fs.mkdir(path, {recursive: true});
  const pathFile = join(path, fileName);
  try {
    await fs.writeFile(pathFile, data);
  } catch (err) {
    throw err;
  }
  console.log(`${pathFile} saved.`); // eslint-disable-line
  if (slpk) {
    return await compressFile(pathFile);
  }
  return pathFile;
}
