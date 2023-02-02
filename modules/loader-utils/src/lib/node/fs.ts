// fs wrapper (promisified fs + avoids bundling fs in browsers)
import fs from 'fs';
import {toArrayBuffer} from './buffer';
import {promisify2, promisify3} from './promisify';

export type {Stats, ReadStream, WriteStream} from 'fs';

export let readdir;
/** Wrapper for Node.js fs method */
export let stat;
export let statSync: typeof fs.statSync;

/** Wrapper for Node.js fs method */
export let readFile;
/** Wrapper for Node.js fs method */
export let readFileSync: typeof fs.readFileSync;
/** Wrapper for Node.js fs method */
export let writeFile;
/** Wrapper for Node.js fs method */
export let writeFileSync: typeof fs.writeFileSync;

// file descriptors

/** Wrapper for Node.js fs method */
export let open;
/** Wrapper for Node.js fs method */
export let close: (fd: number) => Promise<void>;
/** Wrapper for Node.js fs method */
export let read;
/** Wrapper for Node.js fs method */
export let fstat;

export let createReadStream: typeof fs.createReadStream;
export let createWriteStream: typeof fs.createWriteStream;

export let isSupported = Boolean(fs);

// paths

try {
  /** Wrapper for Node.js fs method */
  readdir = promisify2(fs.readdir);
  /** Wrapper for Node.js fs method */
  stat = promisify2(fs.stat);
  statSync = fs.statSync;

  /** Wrapper for Node.js fs method */
  readFile = fs.readFile;
  /** Wrapper for Node.js fs method */
  readFileSync = fs.readFileSync;
  /** Wrapper for Node.js fs method */
  writeFile = promisify3(fs.writeFile);
  /** Wrapper for Node.js fs method */
  writeFileSync = fs.writeFileSync;

  // file descriptors

  /** Wrapper for Node.js fs method */
  open = fs.open;
  /** Wrapper for Node.js fs method */
  close = (fd: number) =>
    new Promise((resolve, reject) => fs.close(fd, (err) => (err ? reject(err) : resolve())));
  /** Wrapper for Node.js fs method */
  read = fs.read;
  /** Wrapper for Node.js fs method */
  fstat = fs.fstat;

  createReadStream = fs.createReadStream;
  createWriteStream = fs.createWriteStream;

  isSupported = Boolean(fs);
} catch {
  // ignore
}

export async function _readToArrayBuffer(fd: number, start: number, length: number) {
  const buffer = Buffer.alloc(length);
  const {bytesRead} = await read(fd, buffer, 0, length, start);
  if (bytesRead !== length) {
    throw new Error('fs.read failed');
  }
  return toArrayBuffer(buffer);
}
