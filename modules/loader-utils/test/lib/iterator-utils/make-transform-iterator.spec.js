import test from 'tape-promise/tape';
import {makeTransformIterator, concatenateArrayBuffers} from '@loaders.gl/loader-utils';

class ByteLengthTransform {
  constructor(options = {}) {
    this.byteLength = 0;
    this.options = options;
  }
  write(chunk) {
    this.byteLength += chunk.byteLength || 0;
    return chunk;
  }
  end() {
    if (this.options.onEnd) {
      this.options.onEnd({byteLength: this.byteLength});
    }
  }
}

test('makeTransformIterator#ByteLengthTransform', async t => {
  const inputChunks = [
    new Uint8Array([1, 2, 3]).buffer,
    new Uint8Array([4, 5, 6]).buffer,
    new Uint8Array([7, 8, 9]).buffer
  ];

  let byteLength;
  let callCount = 0;

  // @ts-ignore
  const transformIterator = makeTransformIterator(inputChunks, ByteLengthTransform, {
    onEnd: result => {
      byteLength = result.byteLength;
      callCount++;
    }
  });

  const transformedChunks = [];
  for await (const chunk of transformIterator) {
    transformedChunks.push(chunk);
  }

  t.equal(byteLength, 9, 'ByteLengthTransform generated correct byteLength');
  t.equal(callCount, 1, 'ByteLengthTransform called onEnd exactly once');

  const inputData = concatenateArrayBuffers(...inputChunks);
  const transformedData = concatenateArrayBuffers(...transformedChunks);

  t.ok(compareArrayBuffers(inputData, transformedData), 'ByteLengthTransform passed through data');

  t.end();
});

function compareArrayBuffers(a, b) {
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
