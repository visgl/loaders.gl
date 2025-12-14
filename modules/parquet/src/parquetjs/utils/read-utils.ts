// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright (c) 2017 ironSource Ltd.
// Forked from https://github.com/kbajalc/parquets under MIT license

import {
  TBufferedTransport,
  TCompactProtocol,
  TFramedTransport,
  FileMetaData,
  PageHeader
} from '../parquet-thrift/index';

class UFramedTransport extends TFramedTransport {
  public readPos: number = 0;
}

/**
 * Helper function that serializes a thrift object into a buffer
 */
export function serializeThrift(obj: any): Uint8Array {
  const output: Buffer[] = [];

  const transport = new TBufferedTransport(undefined, (buf?: Buffer) => {
    const fallbackBuffers = (transport as any).outBuffers as Buffer[] | undefined;
    const payload = buf ?? (fallbackBuffers?.length ? Buffer.concat(fallbackBuffers) : undefined);

    if (!payload) {
      return;
    }
    output.push(toBuffer(payload));
  });

  const protocol = new TCompactProtocol(transport);
  obj.write(protocol);
  transport.flush();

  const combinedBuffer = Buffer.concat(output);
  return new Uint8Array(combinedBuffer.buffer, combinedBuffer.byteOffset, combinedBuffer.byteLength);
}

export function decodeThrift(obj: any, buffer: ArrayBuffer | Uint8Array, offset = 0) {
  const transport = new UFramedTransport(toBuffer(buffer));
  transport.readPos = offset;
  const protocol = new TCompactProtocol(transport);
  obj.read(protocol);
  return transport.readPos - offset;
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

export function decodeFileMetadata(buffer: ArrayBuffer | Uint8Array, offset = 0) {
  const transport = new UFramedTransport(toBuffer(buffer));
  transport.readPos = offset;
  const protocol = new TCompactProtocol(transport);
  const metadata = FileMetaData.read(protocol);
  return {length: transport.readPos - offset, metadata};
}

export function decodePageHeader(buffer: ArrayBuffer | Uint8Array, offset = 0) {
  const transport = new UFramedTransport(toBuffer(buffer));
  transport.readPos = offset;
  const protocol = new TCompactProtocol(transport);
  const pageHeader = PageHeader.read(protocol);
  return {length: transport.readPos - offset, pageHeader};
}

function toBuffer(data: ArrayBuffer | Uint8Array): Buffer {
  if (Buffer.isBuffer(data)) {
    return data;
  }
  if (data instanceof ArrayBuffer) {
    return Buffer.from(data);
  }
  return Buffer.from(data.buffer, data.byteOffset, data.byteLength);
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
