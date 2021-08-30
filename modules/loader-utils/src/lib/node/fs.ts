// fs wrapper (promisified fs + avoids bundling fs in browsers)
import fs from 'fs';
import {toArrayBuffer} from './buffer';
import {promisify} from './util';

export type {Stats} from 'fs';

/** Wrapper for Node.js fs method */
export const readdir = fs?.readdir ? promisify(fs.readdir) : error('fs.readdir');
/** Wrapper for Node.js fs method */
export const stat = fs?.stat ? promisify(fs.stat) : error('fs.stat');

/** Wrapper for Node.js fs method */
export const open = fs?.open ? promisify(fs.open) : error('fs.open');
/** Wrapper for Node.js fs method */
export const close = fs?.close ? promisify(fs.close) : error('fs.close');
/** Wrapper for Node.js fs method */
export const read = fs?.read ? promisify(fs.read) : error('fs.read');

/** Wrapper for Node.js fs method */
export const readFile = fs?.readFile ? promisify(fs.readFile) : error('fs.readFile');
/** Wrapper for Node.js fs method */
export const readFileSync = fs?.readFileSync ? fs.readFileSync : error('fs.readFileSync');
/** Wrapper for Node.js fs method */
export const writeFile = fs?.writeFile ? promisify(fs.writeFile) : error('fs.writeFile');
/** Wrapper for Node.js fs method */
export const writeFileSync = fs?.writeFileSync ? fs.writeFileSync : error('fs.writeFileSync');

export const isSupported = Boolean(fs);

export async function _readToArrayBuffer(fd: number, start: number, length: number) {
  const buffer = Buffer.alloc(length);
  const {bytesRead} = await read(fd, buffer, 0, length, start);
  if (bytesRead !== length) {
    throw new Error('fs.read failed');
  }
  return toArrayBuffer(buffer);
}

function error(fsFunction) {
  throw new Error(`${fsFunction} not available in browser`);
}
