import {concatenateArrayBuffers} from '../binary-utils/binary-utils';

export async function concatenateAsyncIterator(asyncIterator) {
  let arrayBuffer = new ArrayBuffer();
  let string = '';
  for await (const chunk of asyncIterator) {
    if (typeof chunk === 'string') {
      string += chunk;
    } else {
      arrayBuffer = concatenateArrayBuffers(arrayBuffer, chunk);
    }
  }
  return arrayBuffer || string;
}
