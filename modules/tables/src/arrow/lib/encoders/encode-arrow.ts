// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {AnyArrayType, VECTOR_TYPES} from '../types';
import {ensureArrayBuffer} from '@loaders.gl/core/loader-utils';
import {
  registerArrowCompressionEncoderSync,
  type ArrowIPCCompression
} from '../parsers/arrow-compression';

/** Options controlling the Arrow IPC container and embedded buffer compression. */
export type EncodeArrowOptions = {
  container?: 'stream' | 'file';
  compression?: ArrowIPCCompression | null;
};

export type ColumnarTable = {
  name: string;
  array: AnyArrayType;
  type: number;
}[];

/**
 * Encodes set of arrays into the Apache Arrow columnar format
 * https://arrow.apache.org/docs/format/Columnar.html#ipc-file-format
 * @param data - columns data
 * @param options - the writer options
 * @returns - encoded ArrayBuffer
 */
export function encodeArrowSync(
  data: ColumnarTable | arrow.Table,
  options: EncodeArrowOptions = {}
): ArrayBuffer {
  const table = Array.isArray(data) ? makeArrowTable(data) : data;
  const container = options.container || 'stream';
  const compressionType = options.compression
    ? registerArrowCompressionEncoderSync(options.compression)
    : null;
  const tableToIPC = arrow.tableToIPC as unknown as (
    table: arrow.Table,
    container: 'stream' | 'file',
    compressionType?: number | null
  ) => Uint8Array;
  const arrowBuffer =
    compressionType === null
      ? tableToIPC(table, container)
      : tableToIPC(table, container, compressionType);
  return ensureArrayBuffer(arrowBuffer);
}

/** Converts the legacy column descriptors to an Arrow table. */
function makeArrowTable(data: ColumnarTable): arrow.Table {
  const vectors: Record<string, arrow.Vector> = {};
  for (const column of data) {
    vectors[column.name] = createVector(column.array, column.type);
  }
  return new arrow.Table(vectors);
}

/**
 * Create Arrow arrow.Vector from given data and vector type
 * @param array {import('../types').AnyArrayType} - columns data
 * @param type {number} - the writer options
 * @return a vector of one of vector's types defined in the Apache Arrow library
 */
function createVector(array, type): arrow.Vector {
  switch (type) {
    case VECTOR_TYPES.DATE:
      return arrow.vectorFromArray(array);
    case VECTOR_TYPES.FLOAT:
    default:
      return arrow.vectorFromArray(array);
  }
}
