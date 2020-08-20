import test from 'tape-promise/tape';
import BinaryChunkReader from '@loaders.gl/shapefile/lib/streaming/binary-chunk-reader';

test.only('BinaryChunkReader', async t => {
  const reader = new BinaryChunkReader();
  t.ok(reader);
  t.end();
});
