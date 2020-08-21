import test from 'tape-promise/tape';
import BinaryChunkReader from '@loaders.gl/shapefile/lib/streaming/binary-chunk-reader';

const buf1 = new Uint8Array([1, 2, 3]).buffer;
const buf2 = new Uint8Array([4, 5, 6]).buffer;
// const buf3 = new Uint8Array([7, 8, 9]).buffer;


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

test('BinaryChunkReader#findBufferOffsets single view from beginning', t => {
  const reader = new BinaryChunkReader();
  reader.write(buf1);
  reader.write(buf2);
  const bufferOffsets = reader.findBufferOffsets(2);

  t.deepEquals(bufferOffsets, [[0, [0, 2]]]);

  t.end();
});
