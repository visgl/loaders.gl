/*
  Modified from Uday Verma and Howard Butler's plasio
  https://github.com/verma/plasio/
  MIT License
*/

// laslaz.js - treat as compiled code
/* eslint-disable */

var POINT_FORMAT_READERS = {
  0: function(dv) {
    return {
      position: [dv.getInt32(0, true), dv.getInt32(4, true), dv.getInt32(8, true)],
      intensity: dv.getUint16(12, true),
      classification: dv.getUint8(15, true)
    };
  },
  1: function(dv) {
    return {
      position: [dv.getInt32(0, true), dv.getInt32(4, true), dv.getInt32(8, true)],
      intensity: dv.getUint16(12, true),
      classification: dv.getUint8(15, true)
    };
  },
  2: function(dv) {
    return {
      position: [dv.getInt32(0, true), dv.getInt32(4, true), dv.getInt32(8, true)],
      intensity: dv.getUint16(12, true),
      classification: dv.getUint8(15, true),
      color: [dv.getUint16(20, true), dv.getUint16(22, true), dv.getUint16(24, true)]
    };
  },
  3: function(dv) {
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
  var sub = buf.slice(offset, offset + Type.BYTES_PER_ELEMENT * count);

  var r = new Type(sub);
  if (count === 1) return r[0];

  var ret = [];
  for (var i = 0; i < count; i++) {
    ret.push(r[i]);
  }

  return ret;
}

function parseLASHeader(arraybuffer) {
  var o = {};

  o.pointsOffset = readAs(arraybuffer, Uint32Array, 32 * 3);
  o.pointsFormatId = readAs(arraybuffer, Uint8Array, 32 * 3 + 8);
  o.pointsStructSize = readAs(arraybuffer, Uint16Array, 32 * 3 + 8 + 1);
  o.pointsCount = readAs(arraybuffer, Uint32Array, 32 * 3 + 11);

  var start = 32 * 3 + 35;
  o.scale = readAs(arraybuffer, Float64Array, start, 3);
  start += 24; // 8*3
  o.offset = readAs(arraybuffer, Float64Array, start, 3);
  start += 24;

  var bounds = readAs(arraybuffer, Float64Array, start, 6);
  start += 48; // 8*6;
  o.maxs = [bounds[0], bounds[2], bounds[4]];
  o.mins = [bounds[1], bounds[3], bounds[5]];

  return o;
}

var msgIndex = 0;
var waitHandlers = {};

// This method is scope-wide since the nacl module uses this fuction to notify
// us of events
export function handleMessage(message_event) {
  var msg = message_event.data;
  var resolver = waitHandlers[msg.id];
  delete waitHandlers[msg.id];

  // call the callback in a separate context, make sure we've cleaned our
  // state out before the callback is invoked since it may queue more doExchanges
  setTimeout(function() {
    if (msg.error) return resolver.reject(new Error(msg.message || 'Unknown Error'));

    if (msg.hasOwnProperty('count') && msg.hasOwnProperty('hasMoreData')) {
      return resolver.resolve({
        buffer: msg.result,
        count: msg.count,
        hasMoreData: msg.hasMoreData
      });
    }

    resolver.resolve(msg.result);
  }, 0);
}

function doDataExchange(cmd, callback) {
  cmd.id = msgIndex.toString();
  msgIndex++;

  var resolver = Promise.defer();
  waitHandlers[cmd.id] = resolver;

  nacl_module.postMessage(cmd);

  return resolver.promise.cancellable();
};

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
    return new Promise(function(res, rej) {
      setTimeout(res, 0);
    });
  }

  getHeader() {
    var o = this;

    return new Promise(function(res, rej) {
      setTimeout(function() {
        o.header = parseLASHeader(o.arraybuffer);
        res(o.header);
      }, 0);
    });
  }

  readData(count, offset, skip) {
    var o = this;

    return new Promise(function(res, rej) {
      setTimeout(function() {
        if (!o.header)
          return rej(new Error('Cannot start reading data till a header request is issued'));

        var start;
        if (skip <= 1) {
          count = Math.min(count, o.header.pointsCount - o.readOffset);
          start = o.header.pointsOffset + o.readOffset * o.header.pointsStructSize;
          var end = start + count * o.header.pointsStructSize;
          res({
            buffer: o.arraybuffer.slice(start, end),
            count: count,
            hasMoreData: o.readOffset + count < o.header.pointsCount
          });
          o.readOffset += count;
        } else {
          var pointsToRead = Math.min(count * skip, o.header.pointsCount - o.readOffset);
          var bufferSize = Math.ceil(pointsToRead / skip);
          var pointsRead = 0;

          var buf = new Uint8Array(bufferSize * o.header.pointsStructSize);
          for (var i = 0; i < pointsToRead; i++) {
            if (i % skip === 0) {
              start = o.header.pointsOffset + o.readOffset * o.header.pointsStructSize;
              var src = new Uint8Array(o.arraybuffer, start, o.header.pointsStructSize);

              buf.set(src, pointsRead * o.header.pointsStructSize);
              pointsRead++;
            }

            o.readOffset++;
          }

          res({
            buffer: buf.buffer,
            count: pointsRead,
            hasMoreData: o.readOffset < o.header.pointsCount
          });
        }
      }, 0);
    });
  }

  close() {
    var o = this;
    return new Promise(function(res, rej) {
      o.arraybuffer = null;
      setTimeout(res, 0);
    });
  }
}


// LAZ Loader
// Uses NaCL module to load LAZ files
//
class LAZLoader {
  constructor(arraybuffer) {
    this.arraybuffer = arraybuffer;
    this.ww = new Worker(`workers/laz-loader-worker.js`);

    this.nextCB = null;
    var o = this;

    this.ww.onmessage = function(e) {
      if (o.nextCB !== null) {
        o.nextCB(e.data);
        o.nextCB = null;
      }
    };

    this.dorr = function(req, cb) {
      o.nextCB = cb;
      o.ww.postMessage(req);
    };
  }

  open() {
    // nothing needs to be done to open this file
    //
    var o = this;
    return new Promise(function(res, rej) {
      o.dorr({type: 'open', arraybuffer: o.arraybuffer}, function(r) {
        if (r.status !== 1) return rej(new Error('Failed to open file'));

        res(true);
      });
    });
  }

  getHeader() {
    var o = this;

    return new Promise(function(res, rej) {
      o.dorr({type: 'header'}, function(r) {
        if (r.status !== 1) return rej(new Error('Failed to get header'));

        res(r.header);
      });
    });
  }

  readData(count, offset, skip) {
    var o = this;

    return new Promise(function(res, rej) {
      o.dorr({type: 'read', count: count, offset: offset, skip: skip}, function(r) {
        if (r.status !== 1) return rej(new Error('Failed to read data'));
        res({
          buffer: r.buffer,
          count: r.count,
          hasMoreData: r.hasMoreData
        });
      });
    });
  }

  close() {
    var o = this;

    return new Promise(function(res, rej) {
      o.dorr({type: 'close'}, function(r) {
        if (r.status !== 1) return rej(new Error('Failed to close file'));

        res(true);
      });
    });
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
    if (index < 0 || index >= this.pointsCount) throw new Error('Point index out of range');

    var dv = new DataView(this.arrayb, index * this.pointSize, this.pointSize);
    return this.decoder(dv);
  }
}


// A single consistent interface for loading LAS/LAZ files
export class LASFile {
 constructor(arraybuffer) {
    this.arraybuffer = arraybuffer;

    this.determineVersion();
    if (this.version > 13) throw new Error('Only file versions <= 1.3 are supported at this time');

    this.determineFormat();
    if (POINT_FORMAT_READERS[this.formatId] === undefined)
      throw new Error('The point format ID is not supported');

    this.loader = this.isCompressed
      ? new LAZLoader(this.arraybuffer)
      : new LASLoader(this.arraybuffer);
  }

  determineFormat() {
    var formatId = readAs(this.arraybuffer, Uint8Array, 32 * 3 + 8);
    var bit_7 = (formatId & 0x80) >> 7;
    var bit_6 = (formatId & 0x40) >> 6;

    if (bit_7 === 1 && bit_6 === 1) throw new Error('Old style compression not supported');

    this.formatId = formatId & 0x3f;
    this.isCompressed = bit_7 === 1 || bit_6 === 1;
  }

  determineVersion() {
    var ver = new Int8Array(this.arraybuffer, 24, 2);
    this.version = ver[0] * 10 + ver[1];
    this.versionAsString = ver[0] + '.' + ver[1];
  }

  open() {
    return this.loader.open();
  }

  getHeader() {
    return this.loader.getHeader();
  }

  readData(count, start, skip) {
    return this.loader.readData(count, start, skip);
  }

  close() {
    return this.loader.close();
  }

  getUnpacker() {
    return LASDecoder;
  }
}

export const LASModuleWasLoaded = false;

/* eslint no-use-before-define: 2 */
