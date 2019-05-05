// TODO - remove? can this be handled via corresponding AsyncIterator function?
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

function concatenateArrayBuffers(source1, source2) {
  const sourceArray1 = source1 instanceof ArrayBuffer ? new Uint8Array(source1) : source1;
  const sourceArray2 = source2 instanceof ArrayBuffer ? new Uint8Array(source2) : source2;
  const temp = new Uint8Array(sourceArray1.byteLength + sourceArray2.byteLength);
  temp.set(sourceArray1, 0);
  temp.set(sourceArray2, sourceArray1.byteLength);
  return temp;
}
