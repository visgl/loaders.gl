import {promises as fs} from 'fs';
import {join} from 'path';

export default async function(path, data, fileName = 'index.json') {
  await fs.mkdir(path, {recursive: true});
  const nodeFiles = join(path, fileName);
  try {
    await fs.writeFile(nodeFiles, data);
  } catch (err) {
    throw err;
  }
  console.log(`${nodeFiles} saved.`); // eslint-disable-line
}
