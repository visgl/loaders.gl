import {generateRandomArrayBuffer} from '@loaders.gl/compression/test/utils/test-utils';

export {
  generateRandomArrayBuffer,
  compareArrayBuffers
} from '@loaders.gl/compression/test/utils/test-utils';

const SIZE = 100 * 1000;

const data = {};

/** Generate binaryData and repeatedData */
export function getBinaryData(size = SIZE) {
  data.binaryData = data.binaryData || generateRandomArrayBuffer({size});
  data.repeatedData =
    data.repeatedData || generateRandomArrayBuffer({size: size / 10, repetitions: 10});
  return data;
}
