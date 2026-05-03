// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright (c) 2017 ironSource Ltd.
// Forked from https://github.com/kbajalc/parquets under MIT license

import {FileMetaData, PageHeader} from '../parquet-thrift/index';
import {Uint8ArrayCompactProtocol} from './uint8-array-compact-protocol';
import {Uint8ArrayCompactProtocolWriter} from './uint8-array-compact-protocol-writer';
import {Uint8ArrayTransport} from './uint8-array-transport';

/**
 * Helper function that serializes a thrift object into a buffer
 */
export function serializeThrift(obj: any): Uint8Array {
  const protocol = new Uint8ArrayCompactProtocolWriter();
  obj.write(protocol as any);
  return protocol.getBytes();
}

export function decodeThrift(obj: any, buf: Uint8Array, offset?: number) {
  if (!offset) {
    // tslint:disable-next-line:no-parameter-reassignment
    offset = 0;
  }

  const transport = new Uint8ArrayTransport(buf);
  transport.readPos = offset;
  const protocol = new Uint8ArrayCompactProtocol(transport);
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

export function decodeFileMetadata(buf: Uint8Array, offset?: number) {
  if (!offset) {
    // tslint:disable-next-line:no-parameter-reassignment
    offset = 0;
  }

  const transport = new Uint8ArrayTransport(buf);
  transport.readPos = offset;
  const protocol = new Uint8ArrayCompactProtocol(transport);
  const metadata = FileMetaData.read(protocol as any);
  return {length: transport.readPos - offset, metadata};
}

export function decodePageHeader(buf: Uint8Array, offset?: number) {
  if (!offset) {
    // tslint:disable-next-line:no-parameter-reassignment
    offset = 0;
  }

  const transport = new Uint8ArrayTransport(buf);
  transport.readPos = offset;
  const protocol = new Uint8ArrayCompactProtocol(transport);
  const pageHeader = PageHeader.read(protocol as any);
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
