import test from 'tape-promise/tape';
import {createReadStream, getStreamIterator} from '@loaders.gl/core';

const DATA_URL = '@loaders.gl/draco/test/data/raw-attribute-buffers/lidar-positions.bin';

test('getStreamIterator(createReadStream)#async iterate (DEPRECATED)', async t => {
  const stream = await createReadStream(DATA_URL);
  t.ok(stream);

  const asyncIterator = getStreamIterator(stream);
  t.ok(asyncIterator);

  for await (const arrayBuffer of asyncIterator) {
    t.ok(arrayBuffer, `Got chunk from stream ${arrayBuffer.byteLength}`);
  }

  t.end();
});
