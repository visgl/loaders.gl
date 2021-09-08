// fs wrapper (promisified fs + avoids bundling fs in browsers)
import fs from 'fs';
import {toArrayBuffer} from './buffer';
import {promisify} from './util';

export type {Stats} from 'fs';

// paths

/** Wrapper for Node.js fs method */
export const readdir = promisify(fs.readdir);
/** Wrapper for Node.js fs method */
export const stat = promisify(fs.stat);

/** Wrapper for Node.js fs method */
export const readFile = promisify(fs.readFile);
/** Wrapper for Node.js fs method */
export const readFileSync = fs.readFileSync;
/** Wrapper for Node.js fs method */
export const writeFile = promisify(fs.writeFile);
/** Wrapper for Node.js fs method */
export const writeFileSync = fs.writeFileSync;

// file descriptors

/** Wrapper for Node.js fs method */
export const open = promisify(fs.open);
/** Wrapper for Node.js fs method */
export const close = promisify(fs.close);
/** Wrapper for Node.js fs method */
export const read = promisify(fs.read);
/** Wrapper for Node.js fs method */
export const fstat = promisify(fs.fstat);

export const isSupported = Boolean(fs);

export async function _readToArrayBuffer(fd: number, start: number, length: number) {
  const buffer = Buffer.alloc(length);
  const {bytesRead} = await read(fd, buffer, 0, length, start);
  if (bytesRead !== length) {
    throw new Error('fs.read failed');
  }
  return toArrayBuffer(buffer);
}
