// fs wrapper (promisified fs + avoids bundling fs in browsers)
import fs from 'fs';
import {toArrayBuffer} from '@loaders.gl/loader-utils';
import {promisify} from 'util';

const error = (fsFunction) => {
  throw new Error(`${fsFunction} not available in browser`);
};

export const isSupported = Boolean(fs);

export const open = fs ? promisify(fs.open) : error('fs.open');
export const close = fs ? promisify(fs.close) : error('fs.close');
export const read = fs ? promisify(fs.read) : error('fs.read');

export const readFile = fs ? promisify(fs.readFile) : error('fs.readFile');
export const readFileSync = fs ? fs.readFileSync : error('fs.readFileSync');
export const writeFile = fs ? promisify(fs.writeFile) : error('fs.writeFile');
export const writeFileSync = fs ? fs.writeFileSync : error('fs.writeFileSync');

export async function _readToArrayBuffer(fd: number, start: number, length: number) {
  const buffer = Buffer.alloc(length);
  const {bytesRead} = await read(fd, buffer, 0, length, start);
  if (bytesRead !== length) {
    throw new Error('fs.read failed');
  }
  return toArrayBuffer(buffer);
}

export default {
  isSupported,
  open,
  close,
  read,
  readFile,
  readFileSync,
  writeFile,
  writeFileSync,

  _readToArrayBuffer
};
