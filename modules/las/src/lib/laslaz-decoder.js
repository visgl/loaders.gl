/*
  Modified from Uday Verma and Howard Butler's plasio
  https://github.com/verma/plasio/
  MIT License
*/

// laslaz.js - treat as compiled code
import getModule from '../libs/laz-perf';

let Module = null;

const POINT_FORMAT_READERS = {
  0: (dv) => {
    return {
      position: [dv.getInt32(0, true), dv.getInt32(4, true), dv.getInt32(8, true)],
      intensity: dv.getUint16(12, true),
      classification: dv.getUint8(15, true)
    };
  },
  1: (dv) => {
    return {
      position: [dv.getInt32(0, true), dv.getInt32(4, true), dv.getInt32(8, true)],
      intensity: dv.getUint16(12, true),
      classification: dv.getUint8(15, true)
    };
  },
  2: (dv) => {
    return {
      position: [dv.getInt32(0, true), dv.getInt32(4, true), dv.getInt32(8, true)],
      intensity: dv.getUint16(12, true),
      classification: dv.getUint8(15, true),
      color: [dv.getUint16(20, true), dv.getUint16(22, true), dv.getUint16(24, true)]
    };
  },
  3: (dv) => {
    return {
      position: [dv.getInt32(0, true), dv.getInt32(4, true), dv.getInt32(8, true)],
      intensity: dv.getUint16(12, true),
      classification: dv.getUint8(15, true),
      color: [dv.getUint16(28, true), dv.getUint16(30, true), dv.getUint16(32, true)]
    };
  }
};

function readAs(buf, Type, offset, count) {
  count = count === undefined || count === 0 ? 1 : count;
  const sub = buf.slice(offset, offset + Type.BYTES_PER_ELEMENT * count);

  const r = new Type(sub);
  if (count === 1) {
    return r[0];
  }

  const ret = [];
  for (let i = 0; i < count; i++) {
    ret.push(r[i]);
  }

  return ret;
}

function parseLASHeader(arraybuffer) {
  const o = {};

  o.pointsOffset = readAs(arraybuffer, Uint32Array, 32 * 3);
  o.pointsFormatId = readAs(arraybuffer, Uint8Array, 32 * 3 + 8);
  o.pointsStructSize = readAs(arraybuffer, Uint16Array, 32 * 3 + 8 + 1);
  o.pointsCount = readAs(arraybuffer, Uint32Array, 32 * 3 + 11);

  let start = 32 * 3 + 35;
  o.scale = readAs(arraybuffer, Float64Array, start, 3);
  start += 24; // 8*3
  o.offset = readAs(arraybuffer, Float64Array, start, 3);
  start += 24;

  const bounds = readAs(arraybuffer, Float64Array, start, 6);
  start += 48; // 8*6;
  o.maxs = [bounds[0], bounds[2], bounds[4]];
  o.mins = [bounds[1], bounds[3], bounds[5]];

  return o;
}

// LAS Loader
// Loads uncompressed files
//
class LASLoader {
  constructor(arraybuffer) {
    this.arraybuffer = arraybuffer;
  }

  open() {
    // nothing needs to be done to open this file
    //
    this.readOffset = 0;
    return true;
  }

  getHeader() {
    this.header = parseLASHeader(this.arraybuffer);
    return this.header;
  }

  readData(count, offset, skip) {
    const {header, arraybuffer} = this;
    if (!header) {
      throw new Error('Cannot start reading data till a header request is issued');
    }

    let {readOffset} = this;
    let start;

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

  close() {
    this.arraybuffer = null;
    return true;
  }
}

// LAZ Loader
// Uses NaCL module to load LAZ files
//
class LAZLoader {
  constructor(arraybuffer) {
    this.arraybuffer = arraybuffer;
    this.instance = null; // LASZip instance

    if (!Module) {
      // Avoid executing laz-perf on import
      Module = getModule();
    }
  }

  open() {
    try {
      const {arraybuffer} = this;
      this.instance = new Module.LASZip();
      const abInt = new Uint8Array(arraybuffer);
      const buf = Module._malloc(arraybuffer.byteLength);

      this.instance.arraybuffer = arraybuffer;
      this.instance.buf = buf;
      Module.HEAPU8.set(abInt, buf);
      this.instance.open(buf, arraybuffer.byteLength);

      this.instance.readOffset = 0;

      return true;
    } catch (e) {
      throw new Error(`Failed to open file: ${e.message}`);
    }
  }

  getHeader() {
    if (!this.instance) {
      throw new Error('You need to open the file before trying to read header');
    }

    try {
      const header = parseLASHeader(this.instance.arraybuffer);
      header.pointsFormatId &= 0x3f;
      this.header = header;
      return header;
    } catch (e) {
      throw new Error(`Failed to get header: ${e.message}`);
    }
  }

  readData(count, offset, skip) {
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
      const pointsToRead = Math.min(count * skip, header.pointsCount - instance.readOffset);
      const bufferSize = Math.ceil(pointsToRead / skip);
      let pointsRead = 0;

      const thisBuf = new Uint8Array(bufferSize * header.pointsStructSize);
      const bufRead = Module._malloc(header.pointsStructSize);
      for (let i = 0; i < pointsToRead; i++) {
        instance.getPoint(bufRead);

        if (i % skip === 0) {
          const a = new Uint8Array(Module.HEAPU8.buffer, bufRead, header.pointsStructSize);
          thisBuf.set(a, pointsRead * header.pointsStructSize);
          pointsRead++;
        }

        instance.readOffset++;
      }

      return {
        buffer: thisBuf.buffer,
        count: pointsRead,
        hasMoreData: instance.readOffset < header.pointsCount
      };
    } catch (e) {
      throw new Error(`Failed to read data: ${e.message}`);
    }
  }

  close() {
    try {
      if (this.instance !== null) {
        this.instance.delete();
        this.instance = null;
      }
      return true;
    } catch (e) {
      throw new Error(`Failed to close file: ${e.message}`);
    }
  }
}

// Helper class: Decodes LAS records into points
//
class LASDecoder {
  constructor(buffer, len, header) {
    this.arrayb = buffer;
    this.decoder = POINT_FORMAT_READERS[header.pointsFormatId];
    this.pointsCount = len;
    this.pointSize = header.pointsStructSize;
    this.scale = header.scale;
    this.offset = header.offset;
    this.mins = header.mins;
    this.maxs = header.maxs;
  }

  getPoint(index) {
    if (index < 0 || index >= this.pointsCount) {
      throw new Error('Point index out of range');
    }

    const dv = new DataView(this.arrayb, index * this.pointSize, this.pointSize);
    return this.decoder(dv);
  }
}

// A single consistent interface for loading LAS/LAZ files
export class LASFile {
  constructor(arraybuffer) {
    this.arraybuffer = arraybuffer;

    if (this.determineVersion() > 13) {
      throw new Error('Only file versions <= 1.3 are supported at this time');
    }

    this.determineFormat();
    if (POINT_FORMAT_READERS[this.formatId] === undefined) {
      throw new Error('The point format ID is not supported');
    }

    this.loader = this.isCompressed
      ? new LAZLoader(this.arraybuffer)
      : new LASLoader(this.arraybuffer);
  }

  determineFormat() {
    const formatId = readAs(this.arraybuffer, Uint8Array, 32 * 3 + 8);
    const bit7 = (formatId & 0x80) >> 7;
    const bit6 = (formatId & 0x40) >> 6;

    if (bit7 === 1 && bit6 === 1) {
      throw new Error('Old style compression not supported');
    }

    this.formatId = formatId & 0x3f;
    this.isCompressed = bit7 === 1 || bit6 === 1;
  }

  determineVersion() {
    const ver = new Int8Array(this.arraybuffer, 24, 2);
    this.version = ver[0] * 10 + ver[1];
    this.versionAsString = `${ver[0]}.${ver[1]}`;
    return this.version;
  }

  open() {
    if (this.loader.open()) {
      this.isOpen = true;
    }
  }

  getHeader() {
    return this.loader.getHeader();
  }

  readData(count, start, skip) {
    return this.loader.readData(count, start, skip);
  }

  close() {
    if (this.loader.close()) {
      this.isOpen = false;
    }
  }

  getUnpacker() {
    return LASDecoder;
  }
}

export const LASModuleWasLoaded = false;

/* eslint no-use-before-define: 2 */
