// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {copyToArrayBuffer, type ReadableFile, type Stat} from '@loaders.gl/loader-utils';

function toBigInt(value: number | bigint): bigint {
  return typeof value === 'bigint' ? value : BigInt(value);
}

function toNumber(value: number | bigint): number {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    throw new Error('Offset is out of bounds');
  }
  return numberValue;
}

/**
 * Read a byte range from a readable file.
 * @param file readable file handle
 * @param start inclusive start offset
 * @param end exclusive end offset
 * @returns requested slice
 */
export async function readRange(
  file: ReadableFile,
  start: number | bigint,
  end: number | bigint
): Promise<ArrayBuffer> {
  const startOffset = toBigInt(start);
  const endOffset = toBigInt(end);
  const length = endOffset - startOffset;
  if (length < 0) {
    throw new Error('Invalid range requested');
  }
  return await file.read(startOffset, toNumber(length));
}

export async function readDataView(
  file: ReadableFile,
  start: number | bigint,
  end: number | bigint
): Promise<DataView> {
  const arrayBuffer = await readRange(file, start, end);
  return new DataView(arrayBuffer);
}

export async function readUint8(file: ReadableFile, offset: number | bigint): Promise<number> {
  const dataView = await readDataView(file, offset, toBigInt(offset) + 1n);
  return dataView.getUint8(0);
}

export async function readUint16(file: ReadableFile, offset: number | bigint): Promise<number> {
  const dataView = await readDataView(file, offset, toBigInt(offset) + 2n);
  return dataView.getUint16(0, true);
}

export async function readUint32(file: ReadableFile, offset: number | bigint): Promise<number> {
  const dataView = await readDataView(file, offset, toBigInt(offset) + 4n);
  return dataView.getUint32(0, true);
}

export async function readBigUint64(file: ReadableFile, offset: number | bigint): Promise<bigint> {
  const dataView = await readDataView(file, offset, toBigInt(offset) + 8n);
  return dataView.getBigUint64(0, true);
}

/**
 * Resolve the size of a readable file.
 * @param file readable file handle
 * @returns file size as bigint
 */
export async function getReadableFileSize(file: ReadableFile): Promise<bigint> {
  if (file.bigsize > 0n) {
    return file.bigsize;
  }
  if (file.size > 0) {
    return BigInt(file.size);
  }
  if (file.stat) {
    const stats: Stat = await file.stat();
    if (stats?.bigsize !== undefined) {
      return stats.bigsize;
    }
    if (stats?.size !== undefined) {
      return BigInt(stats.size);
    }
  }
  return 0n;
}

/**
 * Minimal readable file backed by a DataView.
 */
export class DataViewReadableFile implements ReadableFile {
  readonly handle: DataView;
  readonly size: number;
  readonly bigsize: bigint;
  readonly url: string;

  constructor(dataView: DataView, url: string = '') {
    this.handle = dataView;
    this.size = dataView.byteLength;
    this.bigsize = BigInt(dataView.byteLength);
    this.url = url;
  }

  async close(): Promise<void> {}

  async stat(): Promise<Stat> {
    return {size: this.size, bigsize: this.bigsize, isDirectory: false};
  }

  async read(start: number | bigint = 0, length?: number): Promise<ArrayBuffer> {
    const offset = toNumber(start);
    const end = length ? offset + length : this.size;
    return copyToArrayBuffer(this.handle.buffer, offset, end - offset);
  }
}
