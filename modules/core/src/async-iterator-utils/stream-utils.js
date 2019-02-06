import {concatenateArrayBuffers} from '../binary-utils/binary-utils';

// TODO - can this be handled via corresponding AsyncIterator function
export function concatenateReadStream(readStream) {
  let arrayBuffer = new ArrayBuffer();
  let string = '';

  return new Promise((resolve, reject) => {
    readStream.data(chunk => {
      if (typeof chunk === 'string') {
        string += chunk;
      } else {
        arrayBuffer = concatenateArrayBuffers(arrayBuffer, chunk);
      }
    });
    readStream.on('error', error => reject(error));

    readStream.on('end', () => {
      if (readStream.complete) {
        resolve(arrayBuffer || string);
      } else {
        reject('The connection was terminated while the message was still being sent');
      }
    });
  });
}
