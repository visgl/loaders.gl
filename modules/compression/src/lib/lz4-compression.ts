// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Copyright (c) 2012 Pierre Curto

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

/* eslint-disable complexity */
/* eslint-disable max-statements */

// LZ4
import {toArrayBuffer, registerJSModules, getJSModule} from '@loaders.gl/loader-utils';
import type {CompressionOptions} from './compression';
import {Compression} from './compression';

// import lz4js from 'lz4js'; // https://bundlephobia.com/package/lz4
const LZ4_MAGIC_NUMBER = 0x184d2204;

/**
 * LZ4 compression / decompression
 */
export class LZ4Compression extends Compression {
  readonly name: string = 'lz4';
  readonly extensions = ['lz4'];
  readonly contentEncodings = ['x-lz4'];
  readonly isSupported = true;
  readonly options: CompressionOptions;

  constructor(options: CompressionOptions) {
    super(options);
    this.options = options;

    registerJSModules(options?.modules);
  }

  async preload(modules: Record<string, any> = {}): Promise<void> {
    registerJSModules(modules);
  }

  compressSync(input: ArrayBuffer): ArrayBuffer {
    const lz4js = getJSModule('lz4js', this.name);
    const inputArray = new Uint8Array(input);
    return lz4js.compress(inputArray).buffer;
  }

  /**
   * Decompresses an ArrayBuffer containing an Lz4 frame. maxSize is optional; if not
   * provided, a maximum size will be determined by examining the data. The
   * returned ArrayBuffer will always be perfectly sized.
   * If data provided without magic number we will parse it as block
   */
  decompressSync(data: ArrayBuffer, maxSize?: number): ArrayBuffer {
    const lz4js = getJSModule('lz4js', this.name);
    try {
      const isMagicNumberExists = this.checkMagicNumber(data);
      const inputArray = new Uint8Array(data);

      if (isMagicNumberExists) {
        return lz4js.decompress(inputArray, maxSize).buffer;
      }

      if (!maxSize) {
        const error = new Error('Need to provide maxSize');
        throw this.improveError(error);
      }

      let uncompressed = new Uint8Array(maxSize);
      const uncompressedSize = this.decodeBlock(inputArray, uncompressed);
      uncompressed = uncompressed.slice(0, uncompressedSize);

      return toArrayBuffer(uncompressed);
    } catch (error) {
      throw this.improveError(error);
    }
  }

  /**
   * Decode lz4 file as block
   * Solution taken from here
   * https://github.com/pierrec/node-lz4/blob/0dac687262403fd34f905b963da7220692f2a4a1/lib/binding.js#L25
   * @param input
   * @param output
   * @param startIndex
   * @param endIndex
   */
  decodeBlock(
    data: Uint8Array,
    output: Uint8Array,
    startIndex?: number,
    endIndex?: number
  ): number {
    startIndex = startIndex || 0;
    endIndex = endIndex || data.length - startIndex;

    let uncompressedSize = 0;
    // Process each sequence in the incoming data
    for (let index = startIndex; index < endIndex; ) {
      const token = data[index++];

      // Literals
      let literalsLength = token >> 4;

      if (literalsLength > 0) {
        // length of literals
        let length = literalsLength + 240;

        while (length === 255) {
          length = data[index++];
          literalsLength += length;
        }

        // Copy the literals
        const end = index + literalsLength;

        while (index < end) {
          output[uncompressedSize++] = data[index++];
        }

        // End of buffer?
        if (index === endIndex) {
          return uncompressedSize;
        }
      }

      // Match copy
      // 2 bytes offset (little endian)
      const offset = data[index++] | (data[index++] << 8);

      // 0 is an invalid offset value
      if (offset === 0 || offset > uncompressedSize) {
        return -(index - 2);
      }

      // length of match copy
      let matchLength = token & 0xf;
      let length = matchLength + 240;

      while (length === 255) {
        length = data[index++];
        matchLength += length;
      }

      // Copy the match
      let pos = uncompressedSize - offset; // position of the match copy in the current output
      const end = uncompressedSize + matchLength + 4; // minmatch = 4

      while (uncompressedSize < end) {
        output[uncompressedSize++] = output[pos++];
      }
    }

    return uncompressedSize;
  }

  /**
   * Compare file magic with lz4 magic number
   * @param input
   */
  checkMagicNumber(data: ArrayBuffer): boolean {
    const magic = new Uint32Array(data.slice(0, 4));
    return magic[0] === LZ4_MAGIC_NUMBER;
  }
}
