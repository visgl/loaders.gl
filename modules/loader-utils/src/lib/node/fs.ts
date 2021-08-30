// fs wrapper (promisified fs + avoids bundling fs in browsers)
import fs from 'fs';
import {toArrayBuffer} from './buffer-utils.node';
import util from 'util';

const error = (fsFunction) => () => {
  throw new Error(`${fsFunction} not available in browser`);
};

export const isSupported = Boolean(fs);

export const open = fs?.open ? util.promisify(fs.open) : error('fs.open');
export const close = fs?.close ? util.promisify(fs.close) : error('fs.close');
export const read = fs?.read ? util.promisify(fs.read) : error('fs.read');

export const readFile = fs?.readFile ? util.promisify(fs.readFile) : error('fs.readFile');
export const readFileSync = fs?.readFileSync ? fs.readFileSync : error('fs.readFileSync');
export const writeFile = fs?.writeFile ? util.promisify(fs.writeFile) : error('fs.writeFile');
export const writeFileSync = fs?.writeFileSync ? fs.writeFileSync : error('fs.writeFileSync');

export async function _readToArrayBuffer(fd: number, start: number, length: number) {
  const buffer = Buffer.alloc(length);
  const {bytesRead} = await read(fd, buffer, 0, length, start);
  if (bytesRead !== length) {
    throw new Error('fs.read failed');
  }
  return toArrayBuffer(buffer);
}
