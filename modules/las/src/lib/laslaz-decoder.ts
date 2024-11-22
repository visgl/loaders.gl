// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/*
  Modified from Uday Verma and Howard Butler's plasio
  https://github.com/verma/plasio/
  MIT License
*/
// laslaz.js - treat as compiled code
import type {LASHeader} from './las-types';
import {WasmLasZipDecompressor} from './libs/laz_rs_wasm';

type LASReader = (dv: DataView) => {
  [LASAttribute: string]: number | number[];
};

type LASReaders = {
  [key: number]: LASReader;
};

type LASData = {
  buffer: ArrayBuffer;
  count: number;
  hasMoreData: boolean;
};

const POINT_FORMAT_READERS: LASReaders = {
  0: (dv) => {
    return {
      position: [dv.getInt32(0, true), dv.getInt32(4, true), dv.getInt32(8, true)],
      intensity: dv.getUint16(12, true),
      classification: dv.getUint8(15)
    };
  },
  1: (dv) => {
    return {
      position: [dv.getInt32(0, true), dv.getInt32(4, true), dv.getInt32(8, true)],
      intensity: dv.getUint16(12, true),
      classification: dv.getUint8(15)
    };
  },
  2: (dv) => {
    return {
      position: [dv.getInt32(0, true), dv.getInt32(4, true), dv.getInt32(8, true)],
      intensity: dv.getUint16(12, true),
      classification: dv.getUint8(15),
      color: [dv.getUint16(20, true), dv.getUint16(22, true), dv.getUint16(24, true)]
    };
  },
  3: (dv) => {
    return {
      position: [dv.getInt32(0, true), dv.getInt32(4, true), dv.getInt32(8, true)],
      intensity: dv.getUint16(12, true),
      classification: dv.getUint8(15),
      color: [dv.getUint16(28, true), dv.getUint16(30, true), dv.getUint16(32, true)]
    };
  }
};

/**
 * Reads incoming binary data depends on the Type parameter
 * @param buf
 * @param Type
 * @param offset
 * @param count
 * @returns number | number[] from incoming binary data
 */
function readAs(buf: ArrayBuffer, Type: any = {}, offset: number, count?: number) {
  count = count === undefined || count === 0 ? 1 : count;
  const sub = buf.slice(offset, offset + Type.BYTES_PER_ELEMENT * count);

  const r = new Type(sub);
  if (count === 1) {
    return r[0];
  }

  const ret: number[] = [];
  for (let i = 0; i < count; i++) {
    ret.push(r[i]);
  }

  return ret;
}

/**
 * Parsing of header's attributes
 * @param arraybuffer
 * @returns header as LASHeader
 */
function parseLASHeader(arraybuffer: ArrayBuffer): LASHeader {
  let start = 32 * 3 + 35;

  const o: Partial<LASHeader> = {
    pointsOffset: readAs(arraybuffer, Uint32Array, 32 * 3),
    pointsFormatId: readAs(arraybuffer, Uint8Array, 32 * 3 + 8),
    pointsStructSize: readAs(arraybuffer, Uint16Array, 32 * 3 + 8 + 1),
    pointsCount: readAs(arraybuffer, Uint32Array, 32 * 3 + 11),
    scale: readAs(arraybuffer, Float64Array, start, 3)
  };
  start += 24; // 8*3
  o.offset = readAs(arraybuffer, Float64Array, start, 3);
  start += 24;

  const bounds = readAs(arraybuffer, Float64Array, start, 6);
  start += 48; // 8*6;
  o.maxs = [bounds[0], bounds[2], bounds[4]];
  o.mins = [bounds[1], bounds[3], bounds[5]];

  return o as LASHeader;
}

// LAS Loader
// Loads uncompressed files
//
class LASLoader {
  arraybuffer: ArrayBuffer;
  readOffset: number = 0;
  header: LASHeader = {
    pointsOffset: 0,
    pointsFormatId: 0,
    pointsStructSize: 0,
    pointsCount: 0,
    scale: [0, 0, 0],
    offset: [0, 0, 0],
    maxs: [0],
    mins: [0],
    totalToRead: 0,
    totalRead: 0,
    versionAsString: '',
    isCompressed: true
  };

  constructor(arraybuffer: ArrayBuffer) {
    this.arraybuffer = arraybuffer;
  }

  /**
   * @returns boolean
   */
  open() {
    // Nothing needs to be done to open this
    return true;
  }
  /**
   * Parsing of incoming binary
   * @returns LASHeader
   */
  getHeader() {
    this.header = parseLASHeader(this.arraybuffer);
    return this.header;
  }

  /**
   * Reading data
   * @param count
   * @param skip
   * @returns new ArrayBuffer, count, hasMoreData
   */
  readData(count: number, skip: number) {
    const {header, arraybuffer} = this;
    if (!header) {
      throw new Error('Cannot start reading data till a header request is issued');
    }

    let {readOffset} = this;
    let start: number;

    if (skip <= 1) {
      count = Math.min(count, header.pointsCount - readOffset);
      start = header.pointsOffset + readOffset * header.pointsStructSize;
      const end = start + count * header.pointsStructSize;
      readOffset += count;
      this.readOffset = readOffset;
      return {
        buffer: arraybuffer.slice(start, end),
        count,
        hasMoreData: readOffset < header.pointsCount
      };
    }

    const pointsToRead = Math.min(count * skip, header.pointsCount - readOffset);
    const bufferSize = Math.ceil(pointsToRead / skip);
    let pointsRead = 0;

    const buf = new Uint8Array(bufferSize * header.pointsStructSize);
    for (let i = 0; i < pointsToRead; i++) {
      if (i % skip === 0) {
        start = header.pointsOffset + readOffset * header.pointsStructSize;
        const src = new Uint8Array(arraybuffer, start, header.pointsStructSize);

        buf.set(src, pointsRead * header.pointsStructSize);
        pointsRead++;
      }

      readOffset++;
    }
    this.readOffset = readOffset;

    return {
      buffer: buf.buffer,
      count: pointsRead,
      hasMoreData: readOffset < header.pointsCount
    };
  }
  /**
   * Method which brings data to null to close the file
   * @returns
   */
  close() {
    // @ts-ignore Possibly null
    this.arraybuffer = null;
    return true;
  }
}

/**
 * LAZ Loader
 * Uses NaCL module to load LAZ files
 */
class LAZLoader {
  arraybuffer: ArrayBuffer;
  readOffset: number = 0;
  instance: WasmLasZipDecompressor | null = null;
  header: LASHeader | null = null;

  constructor(arraybuffer: ArrayBuffer) {
    this.arraybuffer = arraybuffer;
  }

  /**
   * Opens the file
   * @returns boolean
   */
  open(): boolean {
    try {
      const {arraybuffer} = this;
      const abInt = new Uint8Array(arraybuffer);
      this.instance = new WasmLasZipDecompressor(abInt);

      return true;
    } catch (error) {
      throw new Error(`Failed to open file: ${(error as Error).message}`);
    }
  }

  getHeader(): LASHeader {
    if (!this.instance) {
      throw new Error('You need to open the file before trying to read header');
    }

    try {
      const header = parseLASHeader(this.arraybuffer);
      header.pointsFormatId &= 0x3f;
      this.header = header;
      return header;
    } catch (error) {
      throw new Error(`Failed to get header: ${(error as Error).message}`);
    }
  }
  /**
   * @param count
   * @param offset
   * @param skip
   * @returns LASData
   */
  readData(count: number, skip: number): LASData {
    // TODO: We ignore offset here completely :-/
    if (!this.instance) {
      throw new Error('You need to open the file before trying to read stuff');
    }

    const {header, instance} = this;

    if (!header) {
      throw new Error(
        'You need to query header before reading, I maintain state that way, sorry :('
      );
    }

    try {
      const pointsToRead = Math.min(count * skip, header.pointsCount - this.readOffset);
      const bufferSize = Math.ceil(pointsToRead / skip);
      let pointsRead = 0;

      const buf = new Uint8Array(bufferSize * header.pointsStructSize);

      const bufRead = new Uint8Array(header.pointsStructSize);
      for (let i = 0; i < pointsToRead; i++) {
        instance.decompress_many(bufRead);

        if (i % skip === 0) {
          buf.set(bufRead, pointsRead * header.pointsStructSize);
          pointsRead++;
        }

        this.readOffset++;
      }
      return {
        buffer: buf.buffer,
        count: pointsRead,
        hasMoreData: this.readOffset < header.pointsCount
      };
    } catch (error) {
      throw new Error(`Failed to read data: ${(error as Error).message}`);
    }
  }

  /**
   * Deletes the instance
   * @returns boolean
   */
  close(): boolean {
    try {
      if (this.instance !== null) {
        this.instance.free();
      }
      return true;
    } catch (error) {
      throw new Error(`Failed to close file: ${(error as Error).message}`);
    }
  }
}

/**
 * Helper class: Decodes LAS records into points
 */
class LASDecoder {
  arrayb: ArrayBuffer;
  decoder: (dv: DataView) => {};
  pointsCount: number;
  pointSize: number;
  scale: [number, number, number];
  offset?: [number, number, number];
  mins?: number[];
  maxs?: number[];

  constructor(buffer: ArrayBuffer, len: number, header: LASHeader) {
    this.arrayb = buffer;
    this.decoder = POINT_FORMAT_READERS[header.pointsFormatId];
    this.pointsCount = len;
    this.pointSize = header.pointsStructSize;
    this.scale = header.scale;
    this.offset = header.offset;
    this.mins = header.mins;
    this.maxs = header.maxs;
  }

  /**
   * Decodes data depends on this point size
   * @param index
   * @returns New object
   */
  getPoint(index: number): {} {
    if (index < 0 || index >= this.pointsCount) {
      throw new Error('Point index out of range');
    }

    const dv = new DataView(this.arrayb, index * this.pointSize, this.pointSize);
    return this.decoder(dv);
  }
}

/**
 * A single consistent interface for loading LAS/LAZ files
 */
export class LASFile {
  arraybuffer: ArrayBuffer;
  formatId: number = 0;
  loader: LASLoader | LAZLoader;
  isCompressed: boolean = true;
  isOpen: boolean = false;
  version: number = 0;
  versionAsString: string = '';

  constructor(arraybuffer: ArrayBuffer) {
    this.arraybuffer = arraybuffer;

    const signature = readAs(arraybuffer, Uint8Array, 0, 4);
    const check = String.fromCharCode(...signature);
    if (check !== 'LASF') {
      throw new Error('Invalid LAS file');
    }

    if (this.determineVersion() > 14) {
      throw new Error('Only file versions <= 1.4 are supported at this time');
    }

    this.determineFormat();
    if (POINT_FORMAT_READERS[this.formatId] === undefined) {
      throw new Error('The point format ID is not supported');
    }

    this.loader = this.isCompressed
      ? new LAZLoader(this.arraybuffer)
      : new LASLoader(this.arraybuffer);
  }

  /**
   * Determines format in parameters of LASHeader
   */
  determineFormat(): void {
    const formatId = readAs(this.arraybuffer, Uint8Array, 32 * 3 + 8);
    const bit7 = (formatId & 0x80) >> 7;
    const bit6 = (formatId & 0x40) >> 6;

    if (bit7 === 1 && bit6 === 1) {
      throw new Error('Old style compression not supported');
    }

    this.formatId = formatId & 0x3f;
    this.isCompressed = bit7 === 1 || bit6 === 1;
  }

  /**
   * Determines version
   * @returns version
   */
  determineVersion(): number {
    const ver = new Uint8Array(this.arraybuffer, 24, 2);
    this.version = ver[0] * 10 + ver[1];
    this.versionAsString = `${ver[0]}.${ver[1]}`;
    return this.version;
  }

  /**
   * Reads if the file is open
   * @returns boolean
   */
  open(): void {
    if (this.loader.open()) {
      this.isOpen = true;
    }
  }
  /**
   * Gets the header
   * @returns Header
   */
  getHeader(): LASHeader {
    return this.loader.getHeader();
  }

  /**
   * @param count
   * @param start
   * @param skip
   * @returns Data
   */
  readData(count: number, _start: number, skip: number): LASData {
    return this.loader.readData(count, skip);
  }

  /**
   * Closes the file
   */
  close(): void {
    if (this.loader.close()) {
      this.isOpen = false;
    }
  }
  /**
   */
  getUnpacker(): typeof LASDecoder {
    return LASDecoder;
  }
}

export const LASModuleWasLoaded = false;

/* eslint no-use-before-define: 2 */
