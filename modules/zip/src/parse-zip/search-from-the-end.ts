// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {FileProviderInterface} from '@loaders.gl/loader-utils';

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
  file: FileProviderInterface,
  target: ZipSignature
): Promise<bigint> => {
  const searchWindow = [
    await file.getUint8(file.length - 1n),
    await file.getUint8(file.length - 2n),
    await file.getUint8(file.length - 3n),
    undefined
  ];

  let targetOffset = -1;

  // looking for the last record in the central directory
  let point = file.length - 4n;
  do {
    const prevPoint = point;
    point -= BigInt(buffLength);
    point = point >= 0n ? point : 0n;
    const buff = new Uint8Array(await file.slice(point, prevPoint));
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
