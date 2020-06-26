/* global fetch */
import fs from 'fs';
import util from 'util';

/** @typedef {import('./filesystem').IFileSystem} IFileSystem */

/** @implements {IFileSystem} */
export default class NodeFileSystem {
  constructor(options = {}) {
    this._fetch = options.fetch || fetch;
  }

  // L1: fetch

  async fetch(path, options = {}) {
    // Falls back to handle https:/http:/data: etc fetches
    const fallbackFetch = options.fetch || this._fetch;
    return fallbackFetch(path, options);
  }

  // L2: stat

  async readdir(path = '.', options) {
    const readdir = util.promisify(fs.readdir);
    return await readdir(path, options);
  }

  async stat(path, options) {
    const stat = util.promisify(fs.stat);
    const info = await stat(path, options);
    return {size: Number(info.size), isDirectory: () => false, info};
  }

  // L3: Random access

  async open(path, flags, mode) {
    const open = util.promisify(fs.open);
    return await open(path, flags);
  }

  async close(fd) {
    const close = util.promisify(fs.close);
    return await close(fd);
  }

  async fstat(fd) {
    const fstat = util.promisify(fs.fstat);
    const info = await fstat(fd);
    return info;
  }

  async read(fd, {buffer = null, offset = 0, length = buffer.byteLength, position = null}) {
    const fsRead = util.promisify(fs.read);
    let totalBytesRead = 0;
    // Read in loop until we get required number of bytes
    while (totalBytesRead < length) {
      const {bytesRead} = await fsRead(
        fd,
        buffer,
        offset + totalBytesRead,
        length - totalBytesRead,
        position + totalBytesRead
      );
      totalBytesRead += bytesRead;
    }
    return {bytesRead: totalBytesRead, buffer};
  }
}
