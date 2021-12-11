// fs wrapper (promisified fs + avoids bundling fs in browsers)
import fs from 'fs';
import {toArrayBuffer} from './buffer';
import {promisify} from './util';

export type {Stats} from 'fs';

export let readdir;
/** Wrapper for Node.js fs method */
export let stat;

/** Wrapper for Node.js fs method */
export let readFile;
/** Wrapper for Node.js fs method */
export let readFileSync;
/** Wrapper for Node.js fs method */
export let writeFile;
/** Wrapper for Node.js fs method */
export let writeFileSync;

// file descriptors

/** Wrapper for Node.js fs method */
export let open;
/** Wrapper for Node.js fs method */
export let close;
/** Wrapper for Node.js fs method */
export let read;
/** Wrapper for Node.js fs method */
export let fstat;

export let isSupported = Boolean(fs);

// paths

try {
  /** Wrapper for Node.js fs method */
  readdir = promisify(fs.readdir);
  /** Wrapper for Node.js fs method */
  stat = promisify(fs.stat);

  /** Wrapper for Node.js fs method */
  readFile = promisify(fs.readFile);
  /** Wrapper for Node.js fs method */
  readFileSync = fs.readFileSync;
  /** Wrapper for Node.js fs method */
  writeFile = promisify(fs.writeFile);
  /** Wrapper for Node.js fs method */
  writeFileSync = fs.writeFileSync;

  // file descriptors

  /** Wrapper for Node.js fs method */
  open = promisify(fs.open);
  /** Wrapper for Node.js fs method */
  close = promisify(fs.close);
  /** Wrapper for Node.js fs method */
  read = promisify(fs.read);
  /** Wrapper for Node.js fs method */
  fstat = promisify(fs.fstat);

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
