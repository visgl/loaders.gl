/**
 * @license node-stream-zip | (c) 2020 Antelle | https://github.com/antelle/node-stream-zip/blob/master/LICENSE
 * Portions copyright https://github.com/cthackers/adm-zip | https://raw.githubusercontent.com/cthackers/adm-zip/master/LICENSE
 */

/* global Buffer */
import events from 'events';
import zlib from 'zlib';
import stream from 'stream';
import fs from 'fs';

import NodeFileSystem from '../filesystems/node-filesystem';
import FileWindow from '../filesystem-utils/file-window';

import FsRead from './fs-read';
import CrcVerify from './crc-verify';

const CONSTANTS = {
  /* The local file header */
  LOCHDR: 30, // LOC header size
  LOCSIG: 0x04034b50, // "PK\003\004"
  LOCVER: 4, // version needed to extract
  LOCFLG: 6, // general purpose bit flag
  LOCHOW: 8, // compression method
  LOCTIM: 10, // modification time (2 bytes time, 2 bytes date)
  LOCCRC: 14, // uncompressed file crc-32 value
  LOCSIZ: 18, // compressed size
  LOCLEN: 22, // uncompressed size
  LOCNAM: 26, // filename length
  LOCEXT: 28, // extra field length

  /* The Data descriptor */
  EXTSIG: 0x08074b50, // "PK\007\008"
  EXTHDR: 16, // EXT header size
  EXTCRC: 4, // uncompressed file crc-32 value
  EXTSIZ: 8, // compressed size
  EXTLEN: 12, // uncompressed size

  /* The central directory file header */
  CENHDR: 46, // CEN header size
  CENSIG: 0x02014b50, // "PK\001\002"
  CENVEM: 4, // version made by
  CENVER: 6, // version needed to extract
  CENFLG: 8, // encrypt, decrypt flags
  CENHOW: 10, // compression method
  CENTIM: 12, // modification time (2 bytes time, 2 bytes date)
  CENCRC: 16, // uncompressed file crc-32 value
  CENSIZ: 20, // compressed size
  CENLEN: 24, // uncompressed size
  CENNAM: 28, // filename length
  CENEXT: 30, // extra field length
  CENCOM: 32, // file comment length
  CENDSK: 34, // volume number start
  CENATT: 36, // internal file attributes
  CENATX: 38, // external file attributes (host system dependent)
  CENOFF: 42, // LOC header offset

  /* The entries in the end of central directory */
  ENDHDR: 22, // END header size
  ENDSIG: 0x06054b50, // "PK\005\006"
  ENDSIGFIRST: 0x50,
  ENDSUB: 8, // number of entries on this disk
  ENDTOT: 10, // total number of entries
  ENDSIZ: 12, // central directory size in bytes
  ENDOFF: 16, // offset of first CEN header
  ENDCOM: 20, // zip file comment length
  MAXFILECOMMENT: 0xffff,

  /* The entries in the end of ZIP64 central directory locator */
  ENDL64HDR: 20, // ZIP64 end of central directory locator header size
  ENDL64SIG: 0x07064b50, // ZIP64 end of central directory locator signature
  ENDL64SIGFIRST: 0x50,
  ENDL64OFS: 8, // ZIP64 end of central directory offset

  /* The entries in the end of ZIP64 central directory */
  END64HDR: 56, // ZIP64 end of central directory header size
  END64SIG: 0x06064b50, // ZIP64 end of central directory signature
  END64SIGFIRST: 0x50,
  END64SUB: 24, // number of entries on this disk
  END64TOT: 32, // total number of entries
  END64SIZ: 40,
  END64OFF: 48,

  /* Compression methods */
  STORED: 0, // no compression
  SHRUNK: 1, // shrunk
  REDUCED1: 2, // reduced with compression factor 1
  REDUCED2: 3, // reduced with compression factor 2
  REDUCED3: 4, // reduced with compression factor 3
  REDUCED4: 5, // reduced with compression factor 4
  IMPLODED: 6, // imploded
  // 7 reserved
  DEFLATED: 8, // deflated
  ENHANCED_DEFLATED: 9, // deflate64
  PKWARE: 10, // PKWare DCL imploded
  // 11 reserved
  BZIP2: 12, //  compressed using BZIP2
  // 13 reserved
  LZMA: 14, // LZMA
  // 15-17 reserved
  IBM_TERSE: 18, // compressed using IBM TERSE
  IBM_LZ77: 19, // IBM LZ77 z

  /* General purpose bit flag */
  FLG_ENC: 0, // encrypted file
  FLG_COMP1: 1, // compression option
  FLG_COMP2: 2, // compression option
  FLG_DESC: 4, // data descriptor
  FLG_ENH: 8, // enhanced deflation
  FLG_STR: 16, // strong encryption
  FLG_LNG: 1024, // language encoding
  FLG_MSK: 4096, // mask header values
  FLG_ENTRY_ENC: 1,

  /* 4.5 Extensible data fields */
  EF_ID: 0,
  EF_SIZE: 2,

  /* Header IDs */
  ID_ZIP64: 0x0001,
  ID_AVINFO: 0x0007,
  ID_PFS: 0x0008,
  ID_OS2: 0x0009,
  ID_NTFS: 0x000a,
  ID_OPENVMS: 0x000c,
  ID_UNIX: 0x000d,
  ID_FORK: 0x000e,
  ID_PATCH: 0x000f,
  ID_X509_PKCS7: 0x0014,
  ID_X509_CERTID_F: 0x0015,
  ID_X509_CERTID_C: 0x0016,
  ID_STRONGENC: 0x0017,
  ID_RECORD_MGT: 0x0018,
  ID_X509_PKCS7_RL: 0x0019,
  ID_IBM1: 0x0065,
  ID_IBM2: 0x0066,
  ID_POSZIP: 0x4690,

  EF_ZIP64_OR_32: 0xffffffff,
  EF_ZIP64_OR_16: 0xffff
};

// UTILS

function toBits(dec, size) {
  let b = (dec >>> 0).toString(2);
  while (b.length < size) b = `0${b}`;
  return b.split('');
}

function parseZipTime(timebytes, datebytes) {
  const timebits = toBits(timebytes, 16);
  const datebits = toBits(datebytes, 16);

  const mt = {
    h: parseInt(timebits.slice(0, 5).join(''), 2),
    m: parseInt(timebits.slice(5, 11).join(''), 2),
    s: parseInt(timebits.slice(11, 16).join(''), 2) * 2,
    Y: parseInt(datebits.slice(0, 7).join(''), 2) + 1980,
    M: parseInt(datebits.slice(7, 11).join(''), 2),
    D: parseInt(datebits.slice(11, 16).join(''), 2)
  };
  const dateString = `${[mt.Y, mt.M, mt.D].join('-')} ${[mt.h, mt.m, mt.s].join(':')} GMT+0`;
  return new Date(dateString).getTime();
}

const Util = {
  readUInt64LE(buffer, offset) {
    return buffer.readUInt32LE(offset + 4) * 0x0000000100000000 + buffer.readUInt32LE(offset);
  }
};

class CentralDirectoryHeader {
  read(data) {
    if (data.length !== CONSTANTS.ENDHDR || data.readUInt32LE(0) !== CONSTANTS.ENDSIG)
      throw new Error('Invalid central directory');
    // number of entries on this volume
    this.volumeEntries = data.readUInt16LE(CONSTANTS.ENDSUB);
    // total number of entries
    this.totalEntries = data.readUInt16LE(CONSTANTS.ENDTOT);
    // central directory size in bytes
    this.size = data.readUInt32LE(CONSTANTS.ENDSIZ);
    // offset of first CEN header
    this.offset = data.readUInt32LE(CONSTANTS.ENDOFF);
    // zip file comment length
    this.commentLength = data.readUInt16LE(CONSTANTS.ENDCOM);
  }
}

class CentralDirectoryLoc64Header {
  read(data) {
    if (data.length !== CONSTANTS.ENDL64HDR || data.readUInt32LE(0) !== CONSTANTS.ENDL64SIG)
      throw new Error('Invalid zip64 central directory locator');
    // ZIP64 EOCD header offset
    this.headerOffset = Util.readUInt64LE(data, CONSTANTS.ENDSUB);
  }
}

class CentralDirectoryZip64Header {
  read(data) {
    if (data.length !== CONSTANTS.END64HDR || data.readUInt32LE(0) !== CONSTANTS.END64SIG)
      throw new Error('Invalid central directory');
    // number of entries on this volume
    this.volumeEntries = Util.readUInt64LE(data, CONSTANTS.END64SUB);
    // total number of entries
    this.totalEntries = Util.readUInt64LE(data, CONSTANTS.END64TOT);
    // central directory size in bytes
    this.size = Util.readUInt64LE(data, CONSTANTS.END64SIZ);
    // offset of first CEN header
    this.offset = Util.readUInt64LE(data, CONSTANTS.END64OFF);
  }
}

class ZipEntry {
  get encrypted() {
    return (this.flags & CONSTANTS.FLG_ENTRY_ENC) === CONSTANTS.FLG_ENTRY_ENC;
  }

  get isFile() {
    return !this.isDirectory;
  }

  readHeader(data, offset) {
    // data should be 46 bytes and start with "PK 01 02"
    if (data.length < offset + CONSTANTS.CENHDR || data.readUInt32LE(offset) !== CONSTANTS.CENSIG) {
      throw new Error('Invalid entry header');
    }
    // version made by
    this.verMade = data.readUInt16LE(offset + CONSTANTS.CENVEM);
    // version needed to extract
    this.version = data.readUInt16LE(offset + CONSTANTS.CENVER);
    // encrypt, decrypt flags
    this.flags = data.readUInt16LE(offset + CONSTANTS.CENFLG);
    // compression method
    this.method = data.readUInt16LE(offset + CONSTANTS.CENHOW);
    // modification time (2 bytes time, 2 bytes date)
    const timebytes = data.readUInt16LE(offset + CONSTANTS.CENTIM);
    const datebytes = data.readUInt16LE(offset + CONSTANTS.CENTIM + 2);
    this.time = parseZipTime(timebytes, datebytes);

    // uncompressed file crc-32 value
    this.crc = data.readUInt32LE(offset + CONSTANTS.CENCRC);
    // compressed size
    this.compressedSize = data.readUInt32LE(offset + CONSTANTS.CENSIZ);
    // uncompressed size
    this.size = data.readUInt32LE(offset + CONSTANTS.CENLEN);
    // filename length
    this.fnameLen = data.readUInt16LE(offset + CONSTANTS.CENNAM);
    // extra field length
    this.extraLen = data.readUInt16LE(offset + CONSTANTS.CENEXT);
    // file comment length
    this.comLen = data.readUInt16LE(offset + CONSTANTS.CENCOM);
    // volume number start
    this.diskStart = data.readUInt16LE(offset + CONSTANTS.CENDSK);
    // internal file attributes
    this.inattr = data.readUInt16LE(offset + CONSTANTS.CENATT);
    // external file attributes
    this.attr = data.readUInt32LE(offset + CONSTANTS.CENATX);
    // LOC header offset
    this.offset = data.readUInt32LE(offset + CONSTANTS.CENOFF);
  }

  readDataHeader(data) {
    // 30 bytes and should start with "PK\003\004"
    if (data.readUInt32LE(0) !== CONSTANTS.LOCSIG) {
      throw new Error('Invalid local header');
    }
    // version needed to extract
    this.version = data.readUInt16LE(CONSTANTS.LOCVER);
    // general purpose bit flag
    this.flags = data.readUInt16LE(CONSTANTS.LOCFLG);
    // compression method
    this.method = data.readUInt16LE(CONSTANTS.LOCHOW);
    // modification time (2 bytes time ; 2 bytes date)
    const timebytes = data.readUInt16LE(CONSTANTS.LOCTIM);
    const datebytes = data.readUInt16LE(CONSTANTS.LOCTIM + 2);
    this.time = parseZipTime(timebytes, datebytes);

    // uncompressed file crc-32 value
    this.crc = data.readUInt32LE(CONSTANTS.LOCCRC) || this.crc;
    // compressed size
    const compressedSize = data.readUInt32LE(CONSTANTS.LOCSIZ);
    if (compressedSize && compressedSize !== CONSTANTS.EF_ZIP64_OR_32) {
      this.compressedSize = compressedSize;
    }
    // uncompressed size
    const size = data.readUInt32LE(CONSTANTS.LOCLEN);
    if (size && size !== CONSTANTS.EF_ZIP64_OR_32) {
      this.size = size;
    }
    // filename length
    this.fnameLen = data.readUInt16LE(CONSTANTS.LOCNAM);
    // extra field length
    this.extraLen = data.readUInt16LE(CONSTANTS.LOCEXT);
  }

  read(data, offset) {
    this.name = data.slice(offset, (offset += this.fnameLen)).toString();
    const lastChar = data[offset - 1];
    this.isDirectory = lastChar === 47 || lastChar === 92;

    if (this.extraLen) {
      this.readExtra(data, offset);
      offset += this.extraLen;
    }
    this.comment = this.comLen ? data.slice(offset, offset + this.comLen).toString() : null;
  }

  validateName() {
    if (/\\|^\w+:|^\/|(^|\/)\.\.(\/|$)/.test(this.name)) {
      throw new Error(`Malicious entry: ${this.name}`);
    }
  }

  readExtra(data, offset) {
    let signature;
    let size;
    const maxPos = offset + this.extraLen;
    while (offset < maxPos) {
      signature = data.readUInt16LE(offset);
      offset += 2;
      size = data.readUInt16LE(offset);
      offset += 2;
      if (CONSTANTS.ID_ZIP64 === signature) {
        this.parseZip64Extra(data, offset, size);
      }
      offset += size;
    }
  }

  parseZip64Extra(data, offset, length) {
    if (length >= 8 && this.size === CONSTANTS.EF_ZIP64_OR_32) {
      this.size = Util.readUInt64LE(data, offset);
      offset += 8;
      length -= 8;
    }
    if (length >= 8 && this.compressedSize === CONSTANTS.EF_ZIP64_OR_32) {
      this.compressedSize = Util.readUInt64LE(data, offset);
      offset += 8;
      length -= 8;
    }
    if (length >= 8 && this.offset === CONSTANTS.EF_ZIP64_OR_32) {
      this.offset = Util.readUInt64LE(data, offset);
      offset += 8;
      length -= 8;
    }
    if (length >= 4 && this.diskStart === CONSTANTS.EF_ZIP64_OR_16) {
      this.diskStart = data.readUInt32LE(offset);
      // offset += 4; length -= 4;
    }
  }
}

class EntryDataReaderStream extends stream.Readable {
  constructor(fd, offset, length) {
    super();
    this.fd = fd;
    this.offset = offset;
    this.length = length;
    this.pos = 0;
    this.readCallback = this.readCallback.bind(this);
  }

  _read(n) {
    const buffer = Buffer.alloc(Math.min(n, this.length - this.pos));
    if (buffer.length) {
      fs.read(this.fd, buffer, 0, buffer.length, this.offset + this.pos, this.readCallback);
    } else {
      this.push(null);
    }
  }

  readCallback(err, bytesRead, buffer) {
    this.pos += bytesRead;
    if (err) {
      this.emit('error', err);
      this.push(null);
    } else if (!bytesRead) {
      this.push(null);
    } else {
      if (bytesRead !== buffer.length) buffer = buffer.slice(0, bytesRead);
      this.push(buffer);
    }
  }
}

class EntryVerifyStream extends stream.Transform {
  constructor(baseStm, crc, size) {
    super();
    this.verify = new CrcVerify(crc, size);
    baseStm.on('error', e => {
      this.emit('error', e);
    });
  }

  _transform(data, encoding, callback) {
    let err;
    try {
      this.verify.data(data);
    } catch (e) {
      err = e;
    }
    callback(err, data);
  }
}

export default class ZipReadableFilesystem extends events.EventEmitter {
  static setFs(customFs) {
    this.fs = customFs;
  }

  constructor(path, config = {}) {
    super();

    this.fd = undefined;
    this.fileSize = undefined;
    this.chunkSize = undefined;
    this.op = undefined;
    this.centralDirectory = undefined;
    this.comment = undefined;
    this.closed = false;
    this.fileName = path;

    this.config = config;
    this.entriesCount = undefined;
    this._entries = {};

    this.fs = new NodeFileSystem();

    this.entriesPromise = this.open();

    Object.seal(this);
  }

  async open() {
    if (this.entriesPromise) {
      return await this.entriesPromise;
    }

    this.fd = await this.fs.open(this.fileName, 'r');
    const stat = await this.fs.fstat(this.fd);

    this.fileSize = stat.size;
    this.chunkSize = this.config.chunkSize || Math.round(this.fileSize / 1000);
    this.chunkSize = Math.max(
      Math.min(this.chunkSize, Math.min(128 * 1024, this.fileSize)),
      Math.min(1024, this.fileSize)
    );

    await this._readCentralDirectory();
    return this._entries;
  }

  async close() {
    if (this.closed || !this.fd) {
      this.closed = true;
    } else {
      this.closed = true;
      await this.fs.close(this.fd);
    }
  }

  async deviceInfo() {
    await this.entriesPromise;
    return {
      comment: this.comment
    };
  }

  async readdir(path = '') {
    const entries = await this.entriesPromise;
    // TODO - handle '.' and complete directories
    return Object.keys(entries).filter(filename => filename.startsWith(path));
  }

  async entry(name) {
    const entries = await this.entriesPromise;
    return entries[name];
  }

  async entries() {
    const entries = await this.entriesPromise;
    return entries;
  }

  async stream(entry) {
    entry = await this._openEntry(entry);
    const offset = this.dataOffset(entry);

    let entryStream = new EntryDataReaderStream(this.fd, offset, entry.compressedSize);

    switch (entry.method) {
      case CONSTANTS.STORED:
      case CONSTANTS.DEFLATED:
        // @ts-ignore
        entryStream = entryStream.pipe(zlib.createInflateRaw());
        break;
      default:
        throw new Error(`Unknown compression method: ${entry.method}`);
    }

    if (this.canVerifyCrc(entry)) {
      // @ts-ignore
      entryStream = entryStream.pipe(new EntryVerifyStream(entryStream, entry.crc, entry.size));
    }

    return entryStream;
  }

  async readFile(path) {
    return await this.entryData(path);
  }

  async entryData(entry) {
    entry = await this._openEntry(entry);

    let data = Buffer.alloc(entry.compressedSize);
    const fsRead = new FsRead(this.fd, data, 0, entry.compressedSize, this.dataOffset(entry));
    await fsRead.read();

    switch (entry.method) {
      case CONSTANTS.STORED:
        break;
      case CONSTANTS.DEFLATED:
      case CONSTANTS.ENHANCED_DEFLATED:
        data = zlib.inflateRawSync(data);
        break;
      default:
        throw new Error(`Unknown compression method: ${entry.method}`);
    }

    if (data.length !== entry.size) {
      throw new Error('Invalid size');
    }

    if (this.canVerifyCrc(entry)) {
      const verify = new CrcVerify(entry.crc, entry.size);
      verify.data(data);
    }

    return data;
  }

  // INTERNAL

  async _openEntry(entry) {
    const entries = await this.entriesPromise;

    if (typeof entry === 'string') {
      entry = entries[entry];
      if (!entry) {
        throw new Error('Entry not found');
      }
    }

    if (!entry.isFile) {
      throw new Error('Entry is not file');
    }

    if (!this.fd) {
      throw new Error('Archive closed');
    }

    const buffer = Buffer.alloc(CONSTANTS.LOCHDR);
    const fsRead = new FsRead(this.fd, buffer, 0, buffer.length, entry.offset);
    await fsRead.read();

    entry.readDataHeader(buffer);
    if (entry.encrypted) {
      throw new Error('Entry encrypted');
    }

    return entry;
  }

  async _readUntilFound(bytesRead) {
    if (!bytesRead) {
      throw new Error('Archive read error');
    }

    let done = false;
    while (!done) {
      const buffer = this.op.win.buffer;
      const minPos = this.op.minPos;
      let pos = this.op.lastPos;
      let bufferPosition = pos - this.op.win.position;
      while (--pos >= minPos && --bufferPosition >= 0) {
        if (buffer.length - bufferPosition >= 4 && buffer[bufferPosition] === this.op.firstByte) {
          // quick check first signature byte
          // eslint-disable-next-line max-depth
          if (buffer.readUInt32LE(bufferPosition) === this.op.sig) {
            this.op.lastBufferPosition = bufferPosition;
            this.op.lastBytesRead = bytesRead;
            return;
          }
        }
      }

      if (pos === minPos) {
        throw new Error('Bad archive');
      }

      this.op.lastPos = pos + 1;
      this.op.chunkSize *= 2;
      if (pos <= minPos) {
        throw new Error('Bad archive');
      }

      const expandLength = Math.min(this.op.chunkSize, pos - minPos);
      await this.op.win.expandLeft(expandLength);
    }
  }

  /*
  async _readUntilFoundCallback(err, bytesRead) {
		if (err || !bytesRead)
			return this.emit('error', err || 'Archive read error');
		var
			buffer = this.op.win.buffer,
			pos = this.op.lastPos,
			bufferPosition = pos - this.op.win.position,
			minPos = this.op.minPos;
		while (--pos >= minPos && --bufferPosition >= 0) {
			if (buffer.length - bufferPosition >= 4 &&
				buffer[bufferPosition] === this.op.firstByte) { // quick check first signature byte
				if (buffer.readUInt32LE(bufferPosition) === this.op.sig) {
					this.op.lastBufferPosition = bufferPosition;
					this.op.lastBytesRead = bytesRead;
					this.op.complete();
					return;
				}
			}
		}
		if (pos === minPos) {
			throw new Error('Bad archive');
		}
		this.op.lastPos = pos + 1;
		this.op.chunkSize *= 2;
		if (pos <= minPos) {
			throw new Error('Bad archive');
		}
		var expandLength = Math.min(this.op.chunkSize, pos - minPos);
		await this.op.win.expandLeft(expandLength);
		this._readUntilFoundCallback();
	}
	*/

  async _readCentralDirectory() {
    const totalReadLength = Math.min(CONSTANTS.ENDHDR + CONSTANTS.MAXFILECOMMENT, this.fileSize);
    this.op = {
      win: new FileWindow(this.fd),
      totalReadLength,
      minPos: this.fileSize - totalReadLength,
      lastPos: this.fileSize,
      chunkSize: Math.min(1024, this.chunkSize),
      firstByte: CONSTANTS.ENDSIGFIRST,
      sig: CONSTANTS.ENDSIG
    };
    const bytesRead = await this.op.win.read(this.fileSize - this.op.chunkSize, this.op.chunkSize);
    await this._readUntilFound(bytesRead);

    const buffer = this.op.win.buffer;
    const pos = this.op.lastBufferPosition;

    this.centralDirectory = new CentralDirectoryHeader();
    this.centralDirectory.read(buffer.slice(pos, pos + CONSTANTS.ENDHDR));
    this.centralDirectory.headerOffset = this.op.win.position + pos;
    if (this.centralDirectory.commentLength) {
      this.comment = buffer
        .slice(pos + CONSTANTS.ENDHDR, pos + CONSTANTS.ENDHDR + this.centralDirectory.commentLength)
        .toString();
    } else {
      this.comment = null;
    }

    this.entriesCount = this.centralDirectory.volumeEntries;
    this.centralDirectory = this.centralDirectory;
    if (
      (this.centralDirectory.volumeEntries === CONSTANTS.EF_ZIP64_OR_16 &&
        this.centralDirectory.totalEntries === CONSTANTS.EF_ZIP64_OR_16) ||
      this.centralDirectory.size === CONSTANTS.EF_ZIP64_OR_32 ||
      this.centralDirectory.offset === CONSTANTS.EF_ZIP64_OR_32
    ) {
      await this._readZip64CentralDirectoryLocator();
    } else {
      this.op = {};
      await this._readEntries();
    }
  }

  async _readZip64CentralDirectoryLocator() {
    const length = CONSTANTS.ENDL64HDR;
    if (this.op.lastBufferPosition > length) {
      this.op.lastBufferPosition -= length;
      // this._readZip64CentralDirectoryLocatorComplete();
    } else {
      this.op = {
        win: this.op.win,
        totalReadLength: length,
        minPos: this.op.win.position - length,
        lastPos: this.op.win.position,
        chunkSize: this.op.chunkSize,
        firstByte: CONSTANTS.ENDL64SIGFIRST,
        sig: CONSTANTS.ENDL64SIG
        // complete: this._readZip64CentralDirectoryLocatorComplete.bind(this)
      };
      const bytesRead = await this.op.win.read(
        this.op.lastPos - this.op.chunkSize,
        this.op.chunkSize
      );
      await this._readUntilFound(bytesRead);
    }
    await this._readZip64CentralDirectoryLocatorComplete();
  }

  async _readZip64CentralDirectoryLocatorComplete() {
    const buffer = this.op.win.buffer;
    const locHeader = new CentralDirectoryLoc64Header();
    locHeader.read(
      buffer.slice(this.op.lastBufferPosition, this.op.lastBufferPosition + CONSTANTS.ENDL64HDR)
    );
    const readLength = this.fileSize - locHeader.headerOffset;
    this.op = {
      win: this.op.win,
      totalReadLength: readLength,
      minPos: locHeader.headerOffset,
      lastPos: this.op.lastPos,
      chunkSize: this.op.chunkSize,
      firstByte: CONSTANTS.END64SIGFIRST,
      sig: CONSTANTS.END64SIG
      // complete: this._readZip64CentralDirectoryComplete.bind(this)
    };
    const bytesRead = await this.op.win.read(this.fileSize - this.op.chunkSize, this.op.chunkSize);
    await this._readUntilFound(bytesRead);
    await this._readZip64CentralDirectoryComplete();
  }

  async _readZip64CentralDirectoryComplete() {
    const buffer = this.op.win.buffer;
    const zip64cd = new CentralDirectoryZip64Header();
    zip64cd.read(
      buffer.slice(this.op.lastBufferPosition, this.op.lastBufferPosition + CONSTANTS.END64HDR)
    );
    this.centralDirectory.volumeEntries = zip64cd.volumeEntries;
    this.centralDirectory.totalEntries = zip64cd.totalEntries;
    this.centralDirectory.size = zip64cd.size;
    this.centralDirectory.offset = zip64cd.offset;
    this.entriesCount = zip64cd.volumeEntries;
    this.op = {};

    await this._readEntries();
  }

  // eslint-disable-next-line max-statements
  async _readEntries() {
    this.op = {
      win: new FileWindow(this.fd),
      pos: this.centralDirectory.offset,
      chunkSize: this.chunkSize,
      entriesLeft: this.centralDirectory.volumeEntries
    };

    const bytesRead = await this.op.win.read(
      this.op.pos,
      Math.min(this.chunkSize, this.fileSize - this.op.pos)
    );
    if (!bytesRead) {
      throw new Error('Entries read error');
    }

    while (this.op.entriesLeft > 0) {
      const buffer = this.op.win.buffer;
      const bufferLength = buffer.length;
      let bufferPos = this.op.pos - this.op.win.position;
      let entry = this.op.entry;

      if (!entry) {
        entry = new ZipEntry();
        entry.readHeader(buffer, bufferPos);
        entry.headerOffset = this.op.win.position + bufferPos;
        this.op.entry = entry;
        this.op.pos += CONSTANTS.CENHDR;
        bufferPos += CONSTANTS.CENHDR;
      }
      const entryHeaderSize = entry.fnameLen + entry.extraLen + entry.comLen;
      const advanceBytes = entryHeaderSize + (this.op.entriesLeft > 1 ? CONSTANTS.CENHDR : 0);
      if (bufferLength - bufferPos < advanceBytes) {
        await this.op.win.moveRight(this.chunkSize, bufferPos);
        this._readEntries();
        this.op.move = true;
        return this._entries;
      }
      entry.read(buffer, bufferPos);
      if (!this.config.skipEntryNameValidation) {
        entry.validateName();
      }

      // Top off the entries map
      this._entries[entry.name] = entry;

      this.op.entry = entry = null;
      this.op.entriesLeft--;
      this.op.pos += entryHeaderSize;
      bufferPos += entryHeaderSize;
    }

    return this._entries;
  }

  // PRIVATE METHODS

  dataOffset(entry) {
    return entry.offset + CONSTANTS.LOCHDR + entry.fnameLen + entry.extraLen;
  }

  canVerifyCrc(entry) {
    // if bit 3 (0x08) of the general-purpose flags field is set, then the CRC-32 and file sizes are not known when the header is written
    return (entry.flags & 0x8) !== 0x8;
  }
}
