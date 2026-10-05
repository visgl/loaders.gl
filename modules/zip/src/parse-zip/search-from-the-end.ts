// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ReadableFile} from '@loaders.gl/loader-utils';
import {getReadableFileSize, readRange} from './readable-file-utils';

/** Description of zip signature type */
export type ZipSignature = Uint8Array;

const buffLength = 1024;

/**
 * Finds the last four-byte ZIP signature without reading past the end of the file.
 * @param file Random-access archive file.
 * @param target Four-byte ZIP signature.
 * @returns Signature offset, or -1 when it is absent.
 */
export const searchFromTheEnd = async (
  file: ReadableFile,
  target: ZipSignature
): Promise<bigint> => {
  const fileLength = await getReadableFileSize(file);
  if (fileLength < BigInt(target.length)) {
    return -1n;
  }
  const lastBytes = new Uint8Array(await readRange(file, fileLength - 3n, fileLength));
  const searchWindow = [lastBytes[0], lastBytes[1], lastBytes[2], undefined];

  let targetOffset = -1;

  // looking for the last record in the central directory
  let point = fileLength - 3n;
  do {
    const prevPoint = point;
    point -= BigInt(buffLength);
    point = point >= 0n ? point : 0n;
    const buff = new Uint8Array(await readRange(file, point, prevPoint));
    for (let i = buff.length - 1; i > -1; i--) {
      searchWindow[3] = searchWindow[2];
      searchWindow[2] = searchWindow[1];
      searchWindow[1] = searchWindow[0];
      searchWindow[0] = buff[i];
      if (searchWindow.every((val, index) => val === target[index])) {
        targetOffset = i;
        break;
      }
    }
  } while (targetOffset === -1 && point > 0n);

  return point + BigInt(targetOffset);
};
