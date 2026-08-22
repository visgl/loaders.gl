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
 * Returns the generated TypeScript enum member for a Thrift value.
 * @param thriftEnum generated numeric enum object
 * @param value serialized enum value
 * @returns enum member name
 */
export function getThriftEnum(thriftEnum: object, value: number | string): string {
  const enumValues = thriftEnum as Record<string | number, number | string>;
  if (typeof value === 'number') {
    const enumName = enumValues[value];
    if (typeof enumName === 'string') {
      return enumName;
    }
  }

  for (const enumName in enumValues) {
    if (enumValues[enumName] === value) {
      return enumName;
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

/**
 * Finds the selected field path that contains a Parquet leaf path.
 * A selected parent includes all descendant leaves. MQTT-style `+` and `#` path wildcards are
 * retained for internal callers (`+` matches one segment and `#` matches all remaining segments).
 */
export function fieldIndexOf(arr: string[][], elem: string[]): number {
  for (let fieldIndex = 0; fieldIndex < arr.length; fieldIndex++) {
    const selectedPath = arr[fieldIndex];
    let matches = true;
    for (let pathIndex = 0; pathIndex < selectedPath.length; pathIndex++) {
      const selectedSegment = selectedPath[pathIndex];
      if (selectedSegment === '#') {
        return fieldIndex;
      }
      if (
        pathIndex >= elem.length ||
        (selectedSegment !== '+' && selectedSegment !== elem[pathIndex])
      ) {
        matches = false;
        break;
      }
    }
    if (matches) {
      return fieldIndex;
    }
  }
  return -1;
}
