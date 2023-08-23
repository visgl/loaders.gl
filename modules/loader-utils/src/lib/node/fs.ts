// fs wrapper (promisified fs + avoids bundling fs in browsers)
import fs from 'fs';
import {toArrayBuffer} from './buffer';
import {promisify2, promisify3} from './promisify';

export type {Stats, WriteStream} from 'fs';

/** Wrapper for Node.js fs method */
export const readdir: any = promisify2(fs.readdir);
/** Wrapper for Node.js fs method */
export const stat: any = promisify2(fs.stat);

/** Wrapper for Node.js fs method */
export const readFile: any = fs.readFile;
/** Wrapper for Node.js fs method */
export const readFileSync = fs.readFileSync;
/** Wrapper for Node.js fs method */
export const writeFile: any = promisify3(fs.writeFile);
/** Wrapper for Node.js fs method */
export const writeFileSync = fs.writeFileSync;

// file descriptors

/** Wrapper for Node.js fs method */
export const open: any = fs.open;
/** Wrapper for Node.js fs method */
export const close = (fd: number) =>
  new Promise<void>((resolve, reject) => fs.close(fd, (err) => (err ? reject(err) : resolve())));
/** Wrapper for Node.js fs method */
export const read: any = fs.read;
/** Wrapper for Node.js fs method */
export const fstat: any = fs.fstat;

export const createWriteStream = fs.createWriteStream;

export const isSupported = Boolean(fs);

export async function _readToArrayBuffer(fd: number, start: number, length: number) {
  const buffer = Buffer.alloc(length);
  const {bytesRead} = await read(fd, buffer, 0, length, start);
  if (bytesRead !== length) {
    throw new Error('fs.read failed');
  }
  return toArrayBuffer(buffer);
}
