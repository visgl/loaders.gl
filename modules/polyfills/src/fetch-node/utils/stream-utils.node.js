const zlib = require('zlib');

export function decompressReadStream(readStream) {
  switch (readStream.headers['content-encoding']) {
    case 'br':
      return readStream.pipe(zlib.createBrotliDecompress());
    case 'gzip':
      return readStream.pipe(zlib.createGunzip());
    case 'deflate':
      return readStream.pipe(zlib.createDeflate());
    default:
      // No compression or an unknown one, just return it as is
      return readStream;
  }
}

export function concatenateReadStream(readStream) {
  let arrayBuffer = new ArrayBuffer(0);
  let string = '';

  return new Promise((resolve, reject) => {
    readStream.on('data', chunk => {
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
