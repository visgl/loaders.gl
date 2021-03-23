import test from 'tape-promise/tape';
import BinaryChunkReader from '@loaders.gl/shapefile/lib/streaming/binary-chunk-reader';

const buf1 = new Uint8Array([1, 2, 3]).buffer;
const buf2 = new Uint8Array([4, 5, 6]).buffer;
const buf3 = new Uint8Array([7, 8, 9]).buffer;

test('BinaryChunkReader', t => {
  const reader = new BinaryChunkReader();
  t.ok(reader);
  t.end();
});

test('BinaryChunkReader#add arrayBuffers', t => {
  const reader = new BinaryChunkReader();
  reader.write(buf1);
  reader.write(buf2);
  t.equals(reader.arrayBuffers.length, 2);
  t.end();
});

test('BinaryChunkReader#findBufferOffsets single view', t => {
  const reader = new BinaryChunkReader();
  reader.write(buf1);
  reader.write(buf2);
  reader.write(buf3);

  let bufferOffsets = reader.findBufferOffsets(2);
  t.deepEquals(bufferOffsets, [[0, [0, 2]]]);

  reader.skip(1);
  bufferOffsets = reader.findBufferOffsets(2);
  t.deepEquals(bufferOffsets, [[0, [1, 3]]]);

  reader.skip(2);
  bufferOffsets = reader.findBufferOffsets(2);
  t.deepEquals(bufferOffsets, [[1, [0, 2]]]);

  reader.skip(3);
  bufferOffsets = reader.findBufferOffsets(1);
  t.deepEquals(bufferOffsets, [[2, [0, 1]]]);

  bufferOffsets = reader.findBufferOffsets(3);
  t.deepEquals(bufferOffsets, [[2, [0, 3]]]);

  t.end();
});

test('BinaryChunkReader#findBufferOffsets multiple views', t => {
  const reader = new BinaryChunkReader();
  reader.write(buf1);
  reader.write(buf2);
  reader.write(buf3);

  let bufferOffsets = reader.findBufferOffsets(5);
  t.deepEquals(bufferOffsets, [
    [0, [0, 3]],
    [1, [0, 2]]
  ]);

  reader.skip(2);
  bufferOffsets = reader.findBufferOffsets(5);
  t.deepEquals(bufferOffsets, [
    [0, [2, 3]],
    [1, [0, 3]],
    [2, [0, 1]]
  ]);

  bufferOffsets = reader.findBufferOffsets(2);
  t.deepEquals(bufferOffsets, [
    [0, [2, 3]],
    [1, [0, 1]]
  ]);
  t.end();
});

test('BinaryChunkReader#getDataView single source array', t => {
  const reader = new BinaryChunkReader();
  reader.write(buf1);
  reader.write(buf2);
  reader.write(buf3);

  let view = reader.getDataView(2);
  t.equals(view.getUint8(0), 1);
  t.equals(view.getUint8(1), 2);

  reader.skip(2);
  view = reader.getDataView(2);
  t.equals(view.getUint8(0), 5);
  t.equals(view.getUint8(1), 6);
  t.end();
});

test('BinaryChunkReader#getDataView multiple source arrays', t => {
  const reader = new BinaryChunkReader();
  reader.write(buf1);
  reader.write(buf2);
  reader.write(buf3);

  reader.skip(2);
  let view = reader.getDataView(2);
  t.equals(view.getUint8(0), 3);
  t.equals(view.getUint8(1), 4);

  view = reader.getDataView(4);
  t.equals(view.getUint8(0), 5);
  t.equals(view.getUint8(1), 6);
  t.equals(view.getUint8(2), 7);
  t.equals(view.getUint8(3), 8);
  t.end();
});

test('BinaryChunkReader#disposeBuffers', t => {
  const reader = new BinaryChunkReader();
  reader.write(buf1);
  reader.write(buf2);
  reader.write(buf3);

  reader.skip(2);
  t.equals(reader.arrayBuffers.length, 3);

  reader.getDataView(1);
  t.equals(reader.arrayBuffers.length, 2);

  reader.getDataView(3);
  t.equals(reader.arrayBuffers.length, 1);

  reader.getDataView(3);
  t.equals(reader.arrayBuffers.length, 0);
  t.end();
});

test('BinaryChunkReader#disposeBuffers with maxRewindBytes', t => {
  const reader = new BinaryChunkReader({maxRewindBytes: 2});
  reader.write(buf1);
  reader.write(buf2);
  reader.write(buf3);

  reader.skip(2);
  t.equals(reader.arrayBuffers.length, 3);

  reader.getDataView(2);
  t.equals(reader.arrayBuffers.length, 3);

  reader.getDataView(1);
  t.equals(reader.arrayBuffers.length, 2);

  t.end();
});
