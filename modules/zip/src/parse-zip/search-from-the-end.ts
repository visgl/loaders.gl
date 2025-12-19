// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ReadableFile} from '@loaders.gl/loader-utils';
import {getReadableFileSize, readRange} from './readable-file-utils';

/** Description of zip signature type */
export type ZipSignature = Uint8Array;

const buffLength = 1024;

/**
 * looking for the last occurrence of the provided
 * @param file
 * @param target
 * @returns
 */
export const searchFromTheEnd = async (
  file: ReadableFile,
  target: ZipSignature
): Promise<bigint> => {
  const fileLength = await getReadableFileSize(file);
  const lastBytes = new Uint8Array(await readRange(file, fileLength - 3n, fileLength + 1n));
  const searchWindow = [lastBytes[3], lastBytes[2], lastBytes[1], undefined];

  let targetOffset = -1;

  // looking for the last record in the central directory
  let point = fileLength - 4n;
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
