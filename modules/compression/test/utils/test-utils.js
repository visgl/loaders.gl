// Helper functions

import {concatenateArrayBuffers} from '@loaders.gl/loader-utils';
import RandomNumberGenerator from './random-number-generator';

const SIZE = 100 * 1000;
const data = null;

/**
 *  Avoid creating data in global scope
 * @returns {{binaryData: ArrayBuffer, repeatedData: ArrayBuffer}}
 */
export function getData() {
  if (data) {
    return data;
  }
  return {
    binaryData: generateRandomArrayBuffer({size: SIZE}),
    repeatedData: generateRandomArrayBuffer({size: SIZE / 10, repetitions: 10})
  };
}

export function generateRandomArrayBuffer({size, repetitions = 1}) {
  const random = new RandomNumberGenerator();

  const binaryArray = new Uint8Array(size);

  for (let i = binaryArray.byteLength - 1; i >= 0; i--) {
    binaryArray[i] = random.getRange(0, 256) & 0xff;
  }

  const repeatedBuffers = new Array(repetitions).fill(binaryArray);
  const arrayBuffer = concatenateArrayBuffers(...repeatedBuffers);

  return arrayBuffer;
}

export function compareArrayBuffers(a, b) {
  a = new Uint8Array(a);
  b = new Uint8Array(b);
  if (a.byteLength !== b.byteLength) {
    return false;
  }
  for (let i = 0, l = a.byteLength; i < l; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}
