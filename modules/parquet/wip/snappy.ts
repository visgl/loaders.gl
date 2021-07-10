import 'jest';
import chai = require('chai');
const assert = chai.assert;
import fs = require('fs');
import internal = require('../src/snappy');
import native = require('snappy');

const textrandomInputString = fs.readFileSync(module.filename, 'utf8');

function bufferToUint8Array(buffer: Buffer) {
  return new Uint8Array(buffer);
}

function bufferToArrayBuffer(buffer: Buffer) {
  const arrayBuffer = new ArrayBuffer(buffer.length);
  const view = new Uint8Array(arrayBuffer);
  for (let i = 0; i < buffer.length; i++) {
    view[i] = buffer[i];
  }
  return arrayBuffer;
}

function uint8ArrayToBuffer(uint8Array: Uint8Array) {
  const buffer = Buffer.alloc(uint8Array.length);
  for (let i = 0; i < uint8Array.length; i++) {
    buffer[i] = uint8Array[i];
  }
  return buffer;
}

function arrayBufferToBuffer(arrayBuffer: ArrayBuffer) {
  const view = new Uint8Array(arrayBuffer);
  const buffer = Buffer.alloc(view.length);
  for (let i = 0; i < view.length; i++) {
    buffer[i] = view[i];
  }
  return buffer;
}

function stringToUint8Array(source: string) {
  const arrayBuffer = new ArrayBuffer(source.length * 2);
  const view = new Uint16Array(arrayBuffer);
  for (let i = 0; i < source.length; i++) {
    view[i] = source.charCodeAt(i);
  }
  return new Uint8Array(arrayBuffer);
}

function stringToArrayBuffer(source: string) {
  const arrayBuffer = new ArrayBuffer(source.length * 2);
  const view = new Uint16Array(arrayBuffer);
  for (let i = 0; i < source.length; i++) {
    view[i] = source.charCodeAt(i);
  }
  return arrayBuffer;
}

function uint8ArrayToString(uint8Array: Uint8Array) {
  const view = new Uint16Array(uint8Array.buffer);
  let result = '';
  for (let i = 0; i < view.length; i++) {
    result += String.fromCharCode(view[i]);
  }
  return result;
}

function arrayBufferToString(arrayBuffer: ArrayBuffer) {
  const view = new Uint16Array(arrayBuffer);
  let result = '';
  for (let i = 0; i < view.length; i++) {
    result += String.fromCharCode(view[i]);
  }
  return result;
}

function randomString(length: number) {
  let result = '';
  for (let i = 0; i < length; i++) {
    const code = Math.floor(Math.random() * 256);
    result += String.fromCharCode(code);
  }
  return result;
}

test('compress() normal text using Uint8Array', () => {
  let compressed: any = internal.compress(stringToUint8Array(textrandomInputString));
  const compressed2 = native.compressSync(Buffer.from(stringToUint8Array(textrandomInputString)));
  assert.deepEqual(compressed, compressed2);
  compressed = arrayBufferToBuffer(compressed);
  assert.equal(native.isValidCompressedSync(compressed), true);
  const uncompressed = native.uncompressSync(compressed, null) as Buffer;
  const uncompressedString = arrayBufferToString(bufferToArrayBuffer(uncompressed));
  assert.equal(uncompressedString, textrandomInputString);
});

test('compress() normal text using ArrayBuffer', () => {
  let compressed: any = internal.compress(stringToArrayBuffer(textrandomInputString));
  const compressed2 = native.compressSync(Buffer.from(stringToArrayBuffer(textrandomInputString)));
  assert.deepEqual(Buffer.from(compressed), compressed2);
  compressed = arrayBufferToBuffer(compressed);
  assert.equal(native.isValidCompressedSync(compressed), true);
  const uncompressed = native.uncompressSync(compressed, null) as Buffer;
  const uncompressedString = arrayBufferToString(bufferToArrayBuffer(uncompressed));
  assert.equal(uncompressedString, textrandomInputString);
});

test('compress() normal text using Buffer', () => {
  const compressed = internal.compress(arrayBufferToBuffer(stringToArrayBuffer(textrandomInputString)));
  const compressed2 = native.compressSync(arrayBufferToBuffer(stringToArrayBuffer(textrandomInputString)));
  assert.deepEqual(Buffer.from(compressed), compressed2);
  assert.equal(native.isValidCompressedSync(compressed), true);
  const uncompressed = native.uncompressSync(compressed, null) as Buffer;
  const uncompressedString = arrayBufferToString(bufferToArrayBuffer(uncompressed));
  assert.equal(uncompressedString, textrandomInputString);
});

test('uncompress() normal text using Uint8Array', () => {
  let compressed: any = native.compressSync(arrayBufferToBuffer(stringToArrayBuffer(textrandomInputString)));
  const compressedjs = internal.compress(arrayBufferToBuffer(stringToArrayBuffer(textrandomInputString)));
  assert.deepEqual(compressedjs, compressed);
  assert.equal(native.isValidCompressedSync(compressed), true);
  compressed = bufferToUint8Array(compressed);
  const uncompressed = internal.uncompress(compressed);
  const uncompressedString = uint8ArrayToString(uncompressed);
  assert.equal(uncompressedString, textrandomInputString);
});

test('uncompress() normal text using ArrayBuffer', () => {
  let compressed: any = native.compressSync(arrayBufferToBuffer(stringToArrayBuffer(textrandomInputString)));
  const compressedjs = internal.compress(arrayBufferToBuffer(stringToArrayBuffer(textrandomInputString)));
  assert.deepEqual(compressedjs, compressed);
  assert.equal(native.isValidCompressedSync(compressed), true);
  compressed = bufferToArrayBuffer(compressed);
  const uncompressed = internal.uncompress(compressed);
  const uncompressedString = arrayBufferToString(uncompressed);
  assert.equal(uncompressedString, textrandomInputString);
});

test('uncompress() normal text using Buffer', () => {
  const compressed = native.compressSync(arrayBufferToBuffer(stringToArrayBuffer(textrandomInputString)));
  const compressedjs = internal.compress(arrayBufferToBuffer(stringToArrayBuffer(textrandomInputString)));
  assert.deepEqual(compressedjs, compressed);
  assert.equal(native.isValidCompressedSync(compressed), true);
  const uncompressed = internal.uncompress(compressed);
  const uncompressedString = arrayBufferToString(bufferToArrayBuffer(uncompressed));
  assert.equal(uncompressedString, textrandomInputString);
});

test('compress() random string of length 100000 using Uint8Array', () => {
  const randomInputString = randomString(100000);
  let compressed: any = internal.compress(stringToUint8Array(randomInputString));
  const compressed2 = native.compressSync(Buffer.from(stringToUint8Array(randomInputString)));
  assert.deepEqual(Buffer.from(compressed), compressed2);
  compressed = uint8ArrayToBuffer(compressed);
  assert.equal(native.isValidCompressedSync(compressed), true);
  const uncompressed = native.uncompressSync(compressed, null) as Buffer;
  const uncompressedString = arrayBufferToString(bufferToArrayBuffer(uncompressed));
  assert.equal(uncompressedString, randomInputString);
});

test('compress() random string of length 100000 using ArrayBuffer', () => {
  const randomInputString = randomString(100000);
  let compressed: any = internal.compress(stringToArrayBuffer(randomInputString));
  const compressed2 = native.compressSync(Buffer.from(stringToArrayBuffer(randomInputString)));
  assert.deepEqual(Buffer.from(compressed), compressed2);
  compressed = arrayBufferToBuffer(compressed);
  assert.equal(native.isValidCompressedSync(compressed), true);
  const uncompressed = native.uncompressSync(compressed, null) as Buffer;
  const uncompressedString = arrayBufferToString(bufferToArrayBuffer(uncompressed));
  assert.equal(uncompressedString, randomInputString);
});

test('compress() random string of length 100000 using Buffer', () => {
  const randomInputString = randomString(100000);
  const compressed = internal.compress(arrayBufferToBuffer(stringToArrayBuffer(randomInputString)));
  const compressed2 = native.compressSync(arrayBufferToBuffer(stringToArrayBuffer(randomInputString)));
  assert.deepEqual(Buffer.from(compressed), compressed2);
  assert.equal(native.isValidCompressedSync(compressed), true);
  const uncompressed = native.uncompressSync(compressed, null) as Buffer;
  const uncompressedString = arrayBufferToString(bufferToArrayBuffer(uncompressed));
  assert.equal(uncompressedString, randomInputString);
});

test('compress() random string of length 100 using Uint8Array', () => {
  const randomInputString = randomString(100);
  let compressed: any = internal.compress(stringToUint8Array(randomInputString));
  const compressed2 = native.compressSync(Buffer.from(stringToUint8Array(randomInputString)));
  assert.deepEqual(Buffer.from(compressed), compressed2);
  compressed = uint8ArrayToBuffer(compressed);
  assert.equal(native.isValidCompressedSync(compressed), true);
  const uncompressed = native.uncompressSync(compressed, null) as Buffer;
  const uncompressedString = arrayBufferToString(bufferToArrayBuffer(uncompressed));
  assert.equal(uncompressedString, randomInputString);
});

test('compress() random string of length 100 using ArrayBuffer', () => {
  const randomInputString = randomString(100);
  let compressed: any = internal.compress(stringToArrayBuffer(randomInputString));
  const compressed2 = native.compressSync(Buffer.from(stringToArrayBuffer(randomInputString)));
  assert.deepEqual(Buffer.from(compressed), compressed2);
  compressed = arrayBufferToBuffer(compressed);
  assert.equal(native.isValidCompressedSync(compressed), true);
  const uncompressed = native.uncompressSync(compressed, null) as Buffer;
  const uncompressedString = arrayBufferToString(bufferToArrayBuffer(uncompressed));
  assert.equal(uncompressedString, randomInputString);
});

test('compress() random string of length 100 using Buffer', () => {
  const randomInputString = randomString(100);
  const compressed = internal.compress(arrayBufferToBuffer(stringToArrayBuffer(randomInputString)));
  const compressed2 = native.compressSync(arrayBufferToBuffer(stringToArrayBuffer(randomInputString)));
  assert.deepEqual(compressed, compressed2);
  assert.equal(native.isValidCompressedSync(compressed), true);
  const uncompressed = native.uncompressSync(compressed, null) as Buffer;
  const uncompressedString = arrayBufferToString(bufferToArrayBuffer(uncompressed));
  assert.equal(uncompressedString, randomInputString);
});

test('uncompress() random string of length 100000 using Uint8Array', () => {
  const randomInputString = randomString(100000);
  let compressed: any = native.compressSync(arrayBufferToBuffer(stringToArrayBuffer(randomInputString)));
  const compressedjs = internal.compress(arrayBufferToBuffer(stringToArrayBuffer(randomInputString)));
  assert.deepEqual(compressedjs, compressed);
  assert.equal(native.isValidCompressedSync(compressed), true);
  compressed = bufferToUint8Array(compressed);
  const uncompressed = internal.uncompress(compressed);
  const uncompressedString = uint8ArrayToString(uncompressed);
  assert.equal(uncompressedString, randomInputString);
});

test('uncompress() random string of length 100000 using ArrayBuffer', () => {
  const randomInputString = randomString(100000);
  let compressed: any = native.compressSync(arrayBufferToBuffer(stringToArrayBuffer(randomInputString)));
  const compressedjs = internal.compress(arrayBufferToBuffer(stringToArrayBuffer(randomInputString)));
  assert.deepEqual(compressedjs, compressed);
  assert.equal(native.isValidCompressedSync(compressed), true);
  compressed = bufferToArrayBuffer(compressed);
  const uncompressed = internal.uncompress(compressed);
  const uncompressedString = arrayBufferToString(uncompressed);
  assert.equal(uncompressedString, randomInputString);
});

test('uncompress() random string of length 100000 using Buffer', () => {
  const randomInputString = randomString(100000);
  const compressed = native.compressSync(arrayBufferToBuffer(stringToArrayBuffer(randomInputString)));
  const compressedjs = internal.compress(arrayBufferToBuffer(stringToArrayBuffer(randomInputString)));
  assert.deepEqual(compressedjs, compressed);
  assert.equal(native.isValidCompressedSync(compressed), true);
  const uncompressed = internal.uncompress(compressed);
  const uncompressedString = arrayBufferToString(bufferToArrayBuffer(uncompressed));
  assert.equal(uncompressedString, randomInputString);
});

let files: string[] = [];
try {
  files = fs.readdirSync('./data');
} catch (e) {
}

for (const file of files) {
  test(`file: ${file}`, () => {
    const data = fs.readFileSync('./data/' + file);
    let pos = 0;
    let fragmentSize: number;
    while (pos < data.length) {
      fragmentSize = Math.min(data.length - pos, (1 << 16) * 4);
      const buf = data.slice(pos, fragmentSize);
      const c1 = native.compressSync(buf);
      const c2 = internal.compress(buf);
      const u1 = native.uncompressSync(c2, null) as Buffer;
      const u2 = internal.uncompress(c1);
      assert.deepEqual(u2, u1);
      assert.deepEqual(c2, c1);
      pos += fragmentSize;
    }
  });
}
