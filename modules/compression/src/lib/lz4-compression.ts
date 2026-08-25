// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Forked code
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
import {
  toArrayBuffer,
  registerJSModules,
  getJSModule,
  getJSModuleOrNull
} from '@loaders.gl/loader-utils';
import type {CompressionOptions} from './compression';
import {Compression} from './compression';

// import lz4js from 'lz4js'; // https://bundlephobia.com/package/lz4
const LZ4_MAGIC_NUMBER = 0x184d2204;

/**
 * LZ4 compression / decompression
 * @deprecated Import a direction-specific LZ4 compressor or decompressor.
 */
export class LZ4Compression extends Compression {
  readonly name: string = 'lz4';
  readonly extensions = ['lz4'];
  readonly contentEncodings = ['x-lz4'];
  readonly isSupported = true;
  readonly options: CompressionOptions;

  constructor(options: CompressionOptions = {}) {
    super(options);
    this.options = options;

    registerJSModules(options?.modules);
  }

  async preload(modules: Record<string, any> = {}): Promise<void> {
    registerJSModules(modules);
    if (!getJSModuleOrNull('lz4js')) {
      const lz4 = await import('lz4js');
      registerJSModules({lz4js: lz4.default || lz4});
    }
  }

  compressSync(input: ArrayBuffer): ArrayBuffer {
    const lz4js = getJSModule('lz4js', this.name);
    const inputArray = new Uint8Array(input);
    return lz4js.compress(inputArray).buffer;
  }

  async compress(input: ArrayBuffer): Promise<ArrayBuffer> {
    await this.preload();
    return this.compressSync(input);
  }

  /**
   * Decompresses an ArrayBuffer containing an Lz4 frame. maxSize is optional; if not
   * provided, a maximum size will be determined by examining the data. The
   * returned ArrayBuffer will always be perfectly sized.
   * If data provided without magic number we will parse it as block
   */
  decompressSync(data: ArrayBuffer, maxSize?: number): ArrayBuffer {
    try {
      const isMagicNumberExists = this.checkMagicNumber(data);
      const inputArray = new Uint8Array(data);

      if (isMagicNumberExists) {
        const lz4js = getJSModule('lz4js', this.name);
        return lz4js.decompress(inputArray, maxSize).buffer;
      }

      if (!maxSize) {
        const error = new Error('Need to provide maxSize');
        throw this.improveError(error);
      }

      let uncompressed = new Uint8Array(maxSize);
      const hadoopSize = this.decodeHadoopBlocks(inputArray, uncompressed);
      if (hadoopSize !== null) {
        return toArrayBuffer(uncompressed.slice(0, hadoopSize));
      }
      const uncompressedSize = this.decodeBlock(inputArray, uncompressed);
      if (uncompressedSize < 0 || uncompressedSize > maxSize) {
        throw new Error(`Invalid LZ4 block at byte ${Math.abs(uncompressedSize)}`);
      }
      uncompressed = uncompressed.slice(0, uncompressedSize);

      return toArrayBuffer(uncompressed);
    } catch (error) {
      throw this.improveError(error);
    }
  }

  async decompress(data: ArrayBuffer, maxSize?: number): Promise<ArrayBuffer> {
    const isMagicNumberExists = this.checkMagicNumber(data);
    if (!isMagicNumberExists) {
      return this.decompressSync(data, maxSize);
    }
    await this.preload();
    return this.decompressSync(data, maxSize);
  }

  /**
   * Decodes the legacy Hadoop LZ4 block stream used by older Parquet writers.
   * Returns null when the input is not a valid Hadoop-framed stream.
   */
  decodeHadoopBlocks(data: Uint8Array, output: Uint8Array): number | null {
    let inputOffset = 0;
    let outputOffset = 0;

    while (inputOffset < data.length) {
      if (data.length - inputOffset < 8) {
        return null;
      }
      const uncompressedByteLength = readUInt32BE(data, inputOffset);
      const compressedByteLength = readUInt32BE(data, inputOffset + 4);
      inputOffset += 8;
      if (
        uncompressedByteLength === 0 ||
        compressedByteLength === 0 ||
        inputOffset + compressedByteLength > data.length ||
        outputOffset + uncompressedByteLength > output.length
      ) {
        return null;
      }

      const compressedBlock = data.subarray(inputOffset, inputOffset + compressedByteLength);
      const outputBlock = output.subarray(outputOffset, outputOffset + uncompressedByteLength);
      const decodedByteLength = this.decodeBlock(compressedBlock, outputBlock);
      if (decodedByteLength !== uncompressedByteLength) {
        return null;
      }
      inputOffset += compressedByteLength;
      outputOffset += uncompressedByteLength;
    }

    return outputOffset;
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

/** Reads one unsigned big-endian 32-bit Hadoop block length. */
function readUInt32BE(data: Uint8Array, offset: number): number {
  return new DataView(data.buffer, data.byteOffset, data.byteLength).getUint32(offset, false);
}
