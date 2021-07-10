// Forked from https://github.com/kbajalc/parquets under MIT license (Copyright (c) 2017 ironSource Ltd.)
import fs from 'fs';
import {TBufferedTransport, TCompactProtocol, TFramedTransport} from 'thrift';
import {FileMetaData, PageHeader} from './parquet-thrift';
import {Writable} from 'stream';

export interface WriteStreamOptions {
  flags?: string;
  encoding?: string;
  fd?: number;
  mode?: number;
  autoClose?: boolean;
  start?: number;
}

class UFramedTransport extends TFramedTransport {
  public readPos: number = 0;
}

/**
 * Helper function that serializes a thrift object into a buffer
 */
export function serializeThrift(obj: any): Buffer {
  const output: Buffer[] = [];

  const transport = new TBufferedTransport(undefined, (buf) => {
    output.push(buf as Buffer);
  });

  const protocol = new TCompactProtocol(transport);
  obj.write(protocol);
  transport.flush();

  return Buffer.concat(output);
}

export function decodeThrift(obj: any, buf: Buffer, offset?: number) {
  if (!offset) {
    // tslint:disable-next-line:no-parameter-reassignment
    offset = 0;
  }

  const transport = new UFramedTransport(buf);
  transport.readPos = offset;
  const protocol = new TCompactProtocol(transport);
  obj.read(protocol);
  return transport.readPos - offset;
}

export function decodeFileMetadata(buf: Buffer, offset?: number) {
  if (!offset) {
    // tslint:disable-next-line:no-parameter-reassignment
    offset = 0;
  }

  const transport = new UFramedTransport(buf);
  transport.readPos = offset;
  const protocol = new TCompactProtocol(transport);
  const metadata = FileMetaData.read(protocol);
  return {length: transport.readPos - offset, metadata};
}

export function decodePageHeader(buf: Buffer, offset?: number) {
  if (!offset) {
    // tslint:disable-next-line:no-parameter-reassignment
    offset = 0;
  }

  const transport = new UFramedTransport(buf);
  transport.readPos = offset;
  const protocol = new TCompactProtocol(transport);
  const pageHeader = PageHeader.read(protocol);
  return {length: transport.readPos - offset, pageHeader};
}

/**
 * Get the number of bits required to store a given value
 */
export function getBitWidth(val: number): number {
  if (val === 0) {
    return 0;
    // tslint:disable-next-line:no-else-after-return
  }
  return Math.ceil(Math.log2(val + 1));
}

/**
 * FIXME not ideal that this is linear
 */
export function getThriftEnum(klass: any, value: number | string): string {
  for (const k in klass) {
    if (klass[k] === value) {
      return k;
    }
  }
  throw new Error('Invalid ENUM value');
}

export function fopen(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    fs.open(filePath, 'r', (err, fd) => {
      if (err) {
        reject(err);
      } else {
        resolve(fd);
      }
    });
  });
}

export function fstat(filePath: string): Promise<fs.Stats> {
  return new Promise((resolve, reject) => {
    fs.stat(filePath, (err, stat) => {
      if (err) {
        reject(err);
      } else {
        resolve(stat);
      }
    });
  });
}

export function fread(fd: number, position: number, length: number): Promise<Buffer> {
  const buffer = Buffer.alloc(length);
  return new Promise((resolve, reject) => {
    fs.read(fd, buffer, 0, length, position, (err, bytesRead, buf) => {
      if (err || bytesRead !== length) {
        reject(err || Error('read failed'));
      } else {
        resolve(buf);
      }
    });
  });
}

export function fclose(fd: number): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.close(fd, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

export function oswrite(os: Writable, buf: Buffer): Promise<void> {
  return new Promise((resolve, reject) => {
    os.write(buf, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

export function osclose(os: Writable): Promise<void> {
  return new Promise((resolve, reject) => {
    (os as any).close((err: any) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

export function osopen(path: string, opts?: WriteStreamOptions): Promise<fs.WriteStream> {
  return new Promise((resolve, reject) => {
    const outputStream = fs.createWriteStream(path, opts as any);
    outputStream.once('open', (fd) => resolve(outputStream));
    outputStream.once('error', (err) => reject(err));
  });
}

// Supports MQTT path wildcards
// + all immediate children
// # all descendents
export function fieldIndexOf(arr: string[][], elem: string[]): number {
  for (let j = 0; j < arr.length; j++) {
    if (arr[j].length > elem.length) {
      continue; // eslint-disable-line no-continue
    }
    let m = true;
    for (let i = 0; i < elem.length; i++) {
      if (arr[j][i] === elem[i] || arr[j][i] === '+' || arr[j][i] === '#') {
        continue; // eslint-disable-line no-continue
      }
      if (i >= arr[j].length && arr[j][arr[j].length - 1] === '#') {
        continue; // eslint-disable-line no-continue
      }
      m = false;
      break;
    }
    if (m) return j;
  }
  return -1;
}

export function load(name: string): any {
  return (module || (global as any)).require(name);
}
