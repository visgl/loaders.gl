/* eslint-disable */
/*
  Modified from Uday Verma and Howard Butler's plasio
  https://github.com/verma/plasio/
  MIT License
*/

import Module from './laz-perf';

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

export default class LAZParser {
  constructor({
    onProgress
  } = {}) {
    this.onProgress = onProgress;
    this.instance = null; // laz-perf this.instance
  }

  handleEvent(msg) {
    switch (msg.type) {
      case 'open':
        try {
          this.instance = new Module.LASZip();
          var abInt = new Uint8Array(msg.arraybuffer);
          var buf = Module._malloc(msg.arraybuffer.byteLength);

          this.instance.arraybuffer = msg.arraybuffer;
          this.instance.buf = buf;
          Module.HEAPU8.set(abInt, buf);
          this.instance.open(buf, msg.arraybuffer.byteLength);

          this.instance.readOffset = 0;

          this.onProgress({type: 'open', status: 1});
        } catch (e) {
          this.onProgress({type: 'open', status: 0, details: e});
        }
        break;

      case 'header':
        if (!this.instance) throw new Error('You need to open the file before trying to read header');

        var header = parseLASHeader(this.instance.arraybuffer);
        header.pointsFormatId &= 0x3f;
        this.instance.header = header;
        this.onProgress({type: 'header', status: 1, header: header});
        break;

      case 'read':
        if (!this.instance) throw new Error('You need to open the file before trying to read stuff');

        var start = msg.start,
          count = msg.count,
          skip = msg.skip;
        var o = this.instance;

        if (!o.header)
          throw new Error(
            'You need to query header before reading, I maintain state that way, sorry :('
          );

        var pointsToRead = Math.min(count * skip, o.header.pointsCount - o.readOffset);
        var bufferSize = Math.ceil(pointsToRead / skip);
        var pointsRead = 0;

        var this_buf = new Uint8Array(bufferSize * o.header.pointsStructSize);
        var buf_read = Module._malloc(o.header.pointsStructSize);
        for (var i = 0; i < pointsToRead; i++) {
          o.getPoint(buf_read);

          if (i % skip === 0) {
            var a = new Uint8Array(Module.HEAPU8.buffer, buf_read, o.header.pointsStructSize);
            this_buf.set(a, pointsRead * o.header.pointsStructSize, o.header.pointsStructSize);
            pointsRead++;
          }

          o.readOffset++;
        }

        this.onProgress({
          type: 'header',
          status: 1,
          buffer: this_buf.buffer,
          count: pointsRead,
          hasMoreData: o.readOffset < o.header.pointsCount
        });

        break;

      case 'close':
        if (this.instance !== null) {
          this.instance.delete();
          this.instance = null;
        }
        this.onProgress({type: 'close', status: 1});
        break;
    }
  }

  parse(data) {
    try {
      this.handleEvent(data);
    } catch (e) {
      this.onProgress({type: event.data.type, status: 0, details: e});
    }
  };
}
