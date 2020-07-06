import fs from 'fs';
import {promisify} from 'util';
import {toBuffer} from '@loaders.gl/loader-utils';

export function writeFile(filePath, arrayBufferOrString, options) {
  return promisify(fs.writeFile)(`${filePath}`, toBuffer(arrayBufferOrString), {flag: 'w'});
}

export function writeFileSync(filePath, arrayBufferOrString, options) {
  return fs.writeFileSync(`${filePath}`, toBuffer(arrayBufferOrString), {flag: 'w'});
}
