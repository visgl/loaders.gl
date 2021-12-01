import test from 'tape-promise/tape';
import {
  isMeshoptSupported,
  meshoptDecodeVertexBuffer,
  meshoptDecodeIndexBuffer,
  meshoptDecodeIndexSequence
  // meshoptDecodeGltfBuffer
  // @ts-expect-error
} from '@loaders.gl/gltf/meshopt/meshopt-decoder';

test('meshopt#isMeshoptSupported', async (t) => {
  t.ok(isMeshoptSupported, 'meshopt is supported');
  t.end();
});

test('meshopt#decodeVertexBuffer', async (t) => {
  const encoded = new Uint8Array([
    0xa0, 0x01, 0x3f, 0x00, 0x00, 0x00, 0x58, 0x57, 0x58, 0x01, 0x26, 0x00, 0x00, 0x00, 0x01, 0x0c,
    0x00, 0x00, 0x00, 0x58, 0x01, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x3f, 0x00,
    0x00, 0x00, 0x17, 0x18, 0x17, 0x01, 0x26, 0x00, 0x00, 0x00, 0x01, 0x0c, 0x00, 0x00, 0x00, 0x17,
    0x01, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00
  ]);

  const expected = new Uint8Array([
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 44, 1, 0, 0, 0, 0, 0, 0, 244, 1, 0, 0, 0, 0, 44, 1, 0, 0, 0,
    0, 0, 0, 244, 1, 44, 1, 44, 1, 0, 0, 0, 0, 244, 1, 244, 1
  ]);

  const result = new Uint8Array(expected.length);
  await meshoptDecodeVertexBuffer(result, 4, 12, encoded);

  t.deepEqual(result, expected);
  t.end();
});

test('meshopt#decodeIndexBuffer16', async (t) => {
  const encoded = new Uint8Array([
    0xe0, 0xf0, 0x10, 0xfe, 0xff, 0xf0, 0x0c, 0xff, 0x02, 0x02, 0x02, 0x00, 0x76, 0x87, 0x56, 0x67,
    0x78, 0xa9, 0x86, 0x65, 0x89, 0x68, 0x98, 0x01, 0x69, 0x00, 0x00
  ]);

  const expected = new Uint16Array([0, 1, 2, 2, 1, 3, 4, 6, 5, 7, 8, 9]);

  const result = new Uint16Array(expected.length);
  await meshoptDecodeIndexBuffer(new Uint8Array(result.buffer), 12, 2, encoded);

  t.deepEqual(result, expected);
  t.end();
});

test('meshopt#decodeIndexBuffer32', async (t) => {
  const encoded = new Uint8Array([
    0xe0, 0xf0, 0x10, 0xfe, 0xff, 0xf0, 0x0c, 0xff, 0x02, 0x02, 0x02, 0x00, 0x76, 0x87, 0x56, 0x67,
    0x78, 0xa9, 0x86, 0x65, 0x89, 0x68, 0x98, 0x01, 0x69, 0x00, 0x00
  ]);

  const expected = new Uint32Array([0, 1, 2, 2, 1, 3, 4, 6, 5, 7, 8, 9]);

  const result = new Uint32Array(expected.length);
  await meshoptDecodeIndexBuffer(new Uint8Array(result.buffer), 12, 4, encoded);

  t.deepEqual(result, expected);
  t.end();
});

test('meshopt#decodeIndexBufferV1', async (t) => {
  const encoded = new Uint8Array([
    0xe1, 0xf0, 0x10, 0xfe, 0x1f, 0x3d, 0x00, 0x0a, 0x00, 0x76, 0x87, 0x56, 0x67, 0x78, 0xa9, 0x86,
    0x65, 0x89, 0x68, 0x98, 0x01, 0x69, 0x00, 0x00
  ]);

  const expected = new Uint32Array([0, 1, 2, 2, 1, 3, 0, 1, 2, 2, 1, 5, 2, 1, 4]);

  const result = new Uint32Array(expected.length);
  await meshoptDecodeIndexBuffer(new Uint8Array(result.buffer), 15, 4, encoded);

  t.deepEqual(result, expected);
  t.end();
});

test('meshopt#decodeIndexSequence', async (t) => {
  const encoded = new Uint8Array([
    0xd1, 0x00, 0x04, 0xcd, 0x01, 0x04, 0x07, 0x98, 0x1f, 0x00, 0x00, 0x00, 0x00
  ]);

  const expected = new Uint32Array([0, 1, 51, 2, 49, 1000]);

  const result = new Uint32Array(expected.length);
  await meshoptDecodeIndexSequence(new Uint8Array(result.buffer), 6, 4, encoded);

  t.deepEqual(result, expected);
  t.end();
});

test('meshopt#decodeFilterOct8', async (t) => {
  const encoded = new Uint8Array([
    0xa0, 0x01, 0x07, 0x00, 0x00, 0x00, 0x1e, 0x01, 0x3f, 0x00, 0x00, 0x00, 0x8b, 0x8c, 0xfd, 0x00,
    0x01, 0x26, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x01, 0x7f, 0x00
  ]);

  const expected = new Uint8Array([0, 1, 127, 0, 0, 159, 82, 1, 255, 1, 127, 0, 1, 130, 241, 1]);

  const result = new Uint8Array(expected.length);
  await meshoptDecodeVertexBuffer(new Uint8Array(result.buffer), 4, 4, encoded, /* filter= */ 1);

  t.deepEqual(result, expected);
  t.end();
});

test('meshopt#decodeFilterOct12', async (t) => {
  const encoded = new Uint8Array([
    0xa0, 0x01, 0x0f, 0x00, 0x00, 0x00, 0x3d, 0x5a, 0x01, 0x0f, 0x00, 0x00, 0x00, 0x0e, 0x0d, 0x01,
    0x3f, 0x00, 0x00, 0x00, 0x9a, 0x99, 0x26, 0x01, 0x3f, 0x00, 0x00, 0x00, 0x0e, 0x0d, 0x0a, 0x00,
    0x00, 0x01, 0x26, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x01, 0x00, 0xff, 0x07, 0x00, 0x00
  ]);

  const expected = new Uint16Array([
    0, 16, 32767, 0, 0, 32621, 3088, 1, 32764, 16, 471, 0, 307, 28541, 16093, 1
  ]);

  const result = new Uint16Array(expected.length);
  await meshoptDecodeVertexBuffer(new Uint8Array(result.buffer), 4, 8, encoded, /* filter= */ 1);

  t.deepEqual(result, expected);
  t.end();
});

test('meshopt#decodeFilterQuat12', async (t) => {
  const encoded = new Uint8Array([
    0xa0, 0x01, 0x0f, 0x00, 0x00, 0x00, 0x3d, 0x5a, 0x01, 0x0f, 0x00, 0x00, 0x00, 0x0e, 0x0d, 0x01,
    0x3f, 0x00, 0x00, 0x00, 0x9a, 0x99, 0x26, 0x01, 0x3f, 0x00, 0x00, 0x00, 0x0e, 0x0d, 0x0a, 0x00,
    0x00, 0x01, 0x2a, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x01, 0x00, 0x00, 0x00, 0xfc, 0x07
  ]);

  const expected = new Uint16Array([
    32767, 0, 11, 0, 0, 25013, 0, 21166, 11, 0, 23504, 22830, 158, 14715, 0, 29277
  ]);

  const result = new Uint16Array(expected.length);
  await meshoptDecodeVertexBuffer(new Uint8Array(result.buffer), 4, 8, encoded, /* filter= */ 2);

  t.deepEqual(result, expected);
  t.end();
});

test('meshopt#decodeFilterExp', async (t) => {
  const encoded = new Uint8Array([
    0xa0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x03, 0x00, 0x00, 0xff, 0xf7, 0xff, 0xff, 0x02, 0xff, 0xff, 0x7f,
    0xfe
  ]);

  const expected = new Uint32Array([0, 0x3fc00000, 0xc2100000, 0x49fffffe]);

  const result = new Uint32Array(expected.length);
  await meshoptDecodeVertexBuffer(new Uint8Array(result.buffer), 1, 16, encoded, /* filter= */ 3);

  t.deepEqual(result, expected);
  t.end();
});
