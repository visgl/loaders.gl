// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {generateRandomArrayBuffer} from '@loaders.gl/compression/test/utils/test-utils';

export {
  generateRandomArrayBuffer,
  compareArrayBuffers
} from '@loaders.gl/compression/test/utils/test-utils';

const SIZE = 100 * 1000;

let data;

/**
 * Generate binaryData and repeatedData
 * @returns {{binaryData: ArrayBuffer, repeatedData: ArrayBuffer}}
 */
export function getBinaryData(size = SIZE) {
  if (!data) {
    data = {
      binaryData: generateRandomArrayBuffer({size}),
      repeatedData: generateRandomArrayBuffer({size: size / 10, repetitions: 10})
    };
  }
  return data;
}
