import fs from 'fs';
import {promisify} from 'util';

// TODO - does node really require us to convert to Buffer? Can we avoid referencing Buffer?
import {toBuffer} from '@loaders.gl/core';

export function writeFile(filePath, arrayBufferOrString) {
  return promisify(fs.writeFile)(`${filePath}`, toBuffer(arrayBufferOrString), {flag: 'w'});
}

export function writeFileSync(filePath, arrayBufferOrString) {
  return fs.writeFileSync(`${filePath}`, toBuffer(arrayBufferOrString), {flag: 'w'});
}
