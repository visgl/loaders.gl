// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// This file is derived from the tar-js code base under MIT license
// See https://github.com/beatgammit/tar-js/blob/master/LICENSE
/*
 * tar-js
 * MIT (c) 2011 T. Jameson Little
 */

import {clean, pad, stringToUint8} from './utils';
import {format} from './header';
import type {TarBlocks, TarOptions, TarChunks, TarChunk} from './types';

let blockSize: number;
let headerLength: number;
let inputLength: number;

const recordSize = 512;

class Tar {
  written: number;
  out: Uint8Array;
  blocks: TarBlocks = [];
  length: number;

  /**
   * @param [recordsPerBlock]
   */
  constructor(recordsPerBlock: number | undefined) {
    this.written = 0;
    blockSize = (recordsPerBlock || 20) * recordSize;
    this.out = clean(blockSize);

    this.blocks = [];
    this.length = 0;
    this.save = this.save.bind(this);
    this.clear = this.clear.bind(this);
    this.append = this.append.bind(this);
  }

  /**
   * Append a file to the tar archive
   * @param filepath
   * @param input
   * @param [opts]
   */
  // eslint-disable-next-line complexity
  append(filepath: string, input: string | Uint8Array, opts?: TarOptions | undefined) {
    let checksum: string | any;

    if (typeof input === 'string') {
      input = stringToUint8(input);
    } else if (input.constructor && input.constructor !== Uint8Array.prototype.constructor) {
      // @ts-ignore
      const errorInputMatch = /function\s*([$A-Za-z_][0-9A-Za-z_]*)\s*\(/.exec(
        input.constructor.toString()
      );
      const errorInput = errorInputMatch && errorInputMatch[1];
      const errorMessage = `Invalid input type. You gave me: ${errorInput}`;
      throw errorMessage;
    }

    opts = opts || {};

    const mode = opts.mode || parseInt('777', 8) & 0xfff;
    const mtime = opts.mtime || Math.floor(Number(new Date()) / 1000);
    const uid = opts.uid || 0;
    const gid = opts.gid || 0;

    const data: Record<string, string> = {
      fileName: filepath,
      fileMode: pad(mode, 7),
      uid: pad(uid, 7),
      gid: pad(gid, 7),
      fileSize: pad(input.length, 11),
      mtime: pad(mtime, 11),
      checksum: '        ',
      // 0 = just a file
      type: '0',
      ustar: 'ustar  ',
      owner: opts.owner || '',
      group: opts.group || ''
    };

    // calculate the checksum
    checksum = 0;
    Object.keys(data).forEach((key) => {
      let i: number;
      const value = data[key];
      let length: number;

      for (i = 0, length = value.length; i < length; i += 1) {
        checksum += value.charCodeAt(i);
      }
    });

    data.checksum = `${pad(checksum, 6)}\u0000 `;

    const headerArr = format(data);

    headerLength = Math.ceil(headerArr.length / recordSize) * recordSize;
    inputLength = Math.ceil(input.length / recordSize) * recordSize;

    this.blocks.push({
      header: headerArr,
      input,
      headerLength,
      inputLength
    });
  }
  /**
   * Compiling data to a Blob object
   * @returns {Blob}
   */
  save(): Blob {
    const buffers: any = [];
    const chunks = new Array<TarChunks>();
    let length = 0;
    const max = Math.pow(2, 20);

    let chunk = new Array<TarChunk>();
    this.blocks.forEach((b: any = []) => {
      if (length + b.headerLength + b.inputLength > max) {
        chunks.push({blocks: chunk, length});
        chunk = [];
        length = 0;
      }
      chunk.push(b);
      length += b.headerLength + b.inputLength;
    });
    chunks.push({blocks: chunk, length});

    chunks.forEach((c: any = []) => {
      const buffer = new Uint8Array(c.length);
      let written = 0;
      c.blocks.forEach((b: any = []) => {
        buffer.set(b.header, written);
        written += b.headerLength;
        buffer.set(b.input, written);
        written += b.inputLength;
      });
      buffers.push(buffer);
    });

    buffers.push(new Uint8Array(2 * recordSize));

    return new Blob(buffers, {type: 'octet/stream'});
  }
  /**
   * Clear the data by its blocksize
   */
  clear() {
    this.written = 0;
    this.out = clean(blockSize);
  }
}

export default Tar;
