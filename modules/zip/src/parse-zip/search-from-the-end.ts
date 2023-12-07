// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {FileProvider} from '@loaders.gl/loader-utils';

/** Description of zip signature type */
export type ZipSignature = Uint8Array;

/**
 * looking for the last occurrence of the provided
 * @param file
 * @param target
 * @returns
 */
export const searchFromTheEnd = async (
  file: FileProvider,
  target: ZipSignature
): Promise<bigint> => {
  const searchWindow = [
    await file.getUint8(file.length - 1n),
    await file.getUint8(file.length - 2n),
    await file.getUint8(file.length - 3n),
    undefined
  ];

  let targetOffset = 0n;

  // looking for the last record in the central directory
  for (let i = file.length - 4n; i > -1; i--) {
    searchWindow[3] = searchWindow[2];
    searchWindow[2] = searchWindow[1];
    searchWindow[1] = searchWindow[0];
    searchWindow[0] = await file.getUint8(i);
    if (searchWindow.every((val, index) => val === target[index])) {
      targetOffset = i;
      break;
    }
  }

  return targetOffset;
};
