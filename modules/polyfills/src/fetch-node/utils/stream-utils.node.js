const zlib = require('zlib');

export function concatenateReadStream(readStream) {
  let arrayBuffer = new ArrayBuffer(0);
  let string = '';

  return new Promise((resolve, reject) => {
    let wrappedStream;
    switch (readStream.headers['content-encoding']) {
      case 'br':
        wrappedStream = readStream.pipe(zlib.createBrotliDecompress());
        break;
      case 'gzip':
        wrappedStream = readStream.pipe(zlib.createGunzip());
        break;
      case 'deflate':
        wrappedStream = readStream.pipe(zlib.createDeflate());
        break;
      default:
        // No compression or an unknown one, just pipe it as is
        wrappedStream = readStream;
        break;
    }

    wrappedStream.on('data', chunk => {
      if (typeof chunk === 'string') {
        string += chunk;
      } else {
        arrayBuffer = concatenateArrayBuffers(arrayBuffer, chunk);
      }
    });

    wrappedStream.on('error', error => reject(error));

    wrappedStream.on('end', () => {
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
