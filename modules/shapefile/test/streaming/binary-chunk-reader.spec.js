import test from 'tape-promise/tape';
import BinaryChunkReader from '@loaders.gl/shapefile/lib/streaming/binary-chunk-reader';

var buf1 = new Uint8Array([1, 2, 3]).buffer;
var buf2 = new Uint8Array([4, 5, 6]).buffer;
var buf3 = new Uint8Array([7, 8, 9]).buffer;


test('BinaryChunkReader', async t => {
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
  var reader = new BinaryChunkReader();
  reader.write(buf1);
  reader.write(buf2);
  reader.write(buf3);
  var bufferOffsets = reader.findBufferOffsets(2);

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

test('BinaryChunkReader#findBufferOffsets single view from beginning', t => {
  const reader = new BinaryChunkReader();
  reader.write(buf1);
  reader.write(buf2);
  const bufferOffsets = reader.findBufferOffsets(2);

  t.deepEquals(bufferOffsets, [[0, [0, 2]]]);

  t.end();
});
