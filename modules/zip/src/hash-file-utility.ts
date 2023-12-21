// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {MD5Hash} from '@loaders.gl/crypto';
import {FileProvider, concatenateArrayBuffers} from '@loaders.gl/loader-utils';
import {makeZipCDHeaderIterator} from './parse-zip/cd-file-header';

/**
 * Reads hash file from buffer and returns it in ready-to-use form
 * @param arrayBuffer - buffer containing hash file
 * @returns Map containing hash and offset
 */
export function parseHashTable(arrayBuffer: ArrayBuffer): Record<string, bigint> {
  const dataView = new DataView(arrayBuffer);

  const hashMap: Record<string, bigint> = {};

  for (let i = 0; i < arrayBuffer.byteLength; i = i + 24) {
    const offset = dataView.getBigUint64(i + 16, true);
    const hash = bufferToHex(arrayBuffer, i, 16);
    hashMap[hash] = offset;
  }

  return hashMap;
}

function bufferToHex(buffer: ArrayBuffer, start: number, length: number): string {
  // buffer is an ArrayBuffer
  return [...new Uint8Array(buffer, start, length)]
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * generates hash info from zip files "central directory"
 * @param fileProvider - provider of the archive
 * @returns ready to use hash info
 */
export async function makeHashTableFromZipHeaders(
  fileProvider: FileProvider
): Promise<Record<string, bigint>> {
  const zipCDIterator = makeZipCDHeaderIterator(fileProvider);
  const md5Hash = new MD5Hash();
  const textEncoder = new TextEncoder();

  const hashTable: Record<string, bigint> = {};

  for await (const cdHeader of zipCDIterator) {
    const filename = cdHeader.fileName.split('\\').join('/').toLocaleLowerCase();
    const arrayBuffer = textEncoder.encode(filename).buffer;
    const md5 = await md5Hash.hash(arrayBuffer, 'hex');
    hashTable[md5] = cdHeader.localHeaderOffset;
  }

  return hashTable;
}

export async function composeHashFile(fileProvider: FileProvider): Promise<ArrayBuffer> {
  const hashArray = await makeHashTableFromZipHeaders(fileProvider);
  const bufferArray = Object.entries(hashArray)
    .map(([key, value]) => concatenateArrayBuffers(hexStringToBuffer(key), bigintToBuffer(value)))
    .sort(compareHashes);
  console.log(bufferArray);
  return concatenateArrayBuffers(...bufferArray);
}

/**
 * Function to compare md5 hashes according to https://github.com/Esri/i3s-spec/blob/master/docs/2.0/slpk_hashtable.pcsl.md
 * @param arrA first hash to compare
 * @param arrB second hash to compare
 * @returns 0 if equal, negative number if a<b, pozitive if a>b
 */
function compareHashes(arrA: ArrayBuffer, arrB: ArrayBuffer): number {
  const a = new BigUint64Array(arrA);
  const b = new BigUint64Array(arrB);

  return Number(a[0] === b[0] ? a[1] - b[1] : a[0] - b[0]);
}

/**
 * converts hex string to buffer
 * @param str hex string to convert
 * @returns conversion result
 */
function hexStringToBuffer(str: string): ArrayBuffer {
  const byteArray = str.match(/../g)?.map((h) => parseInt(h, 16));
  return new Uint8Array(byteArray ?? new Array(16)).buffer;
}

/**
 * converts bigint to buffer
 * @param n bigint to convert
 * @returns convertion result
 */
function bigintToBuffer(n: bigint): ArrayBuffer {
  return new BigUint64Array([n]).buffer;
}
