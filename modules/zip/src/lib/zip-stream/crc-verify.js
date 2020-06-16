/* global Buffer */
/* eslint-disable max-depth */

export default class CrcVerify {
  constructor(crc, size) {
    this.crc = crc;
    this.size = size;
    this.state = {
      crc: ~0,
      size: 0
    };
  }

  data(data) {
    const crcTable = CrcVerify.getCrcTable();
    let crc = this.state.crc;
    let off = 0;
    let len = data.length;
    while (--len >= 0) crc = crcTable[(crc ^ data[off++]) & 0xff] ^ (crc >>> 8);
    this.state.crc = crc;
    this.state.size += data.length;
    if (this.state.size >= this.size) {
      const buf = Buffer.alloc(4);
      buf.writeInt32LE(~this.state.crc & 0xffffffff, 0);
      crc = buf.readUInt32LE(0);
      if (crc !== this.crc) throw new Error('Invalid CRC');
      if (this.state.size !== this.size) throw new Error('Invalid size');
    }
  }

  static getCrcTable() {
    // @ts-ignore
    let crcTable = CrcVerify.crcTable;
    if (!crcTable) {
      // @ts-ignore
      CrcVerify.crcTable = crcTable = [];
      const b = Buffer.alloc(4);
      for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 8; --k >= 0; )
          if ((c & 1) !== 0) {
            c = 0xedb88320 ^ (c >>> 1);
          } else {
            c = c >>> 1;
          }
        if (c < 0) {
          b.writeInt32LE(c, 0);
          c = b.readUInt32LE(0);
        }
        crcTable[n] = c;
      }
    }
    return crcTable;
  }
}
