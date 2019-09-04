import test from 'tape-promise/tape';
import {fetchFile, getStreamIterator} from '@loaders.gl/core';

const DATA_URL = '@loaders.gl/draco/test/data/raw-attribute-buffers/lidar-positions.bin';

test('getStreamIterator(fetch)#async iterate', async t => {
  const response = await fetchFile(DATA_URL);
  const stream = await response.body;
  t.ok(stream);

  const asyncIterator = getStreamIterator(stream);
  t.ok(asyncIterator);

  for await (const arrayBuffer of asyncIterator) {
    t.ok(arrayBuffer, `Got chunk from stream ${arrayBuffer.byteLength}`);
  }

  t.end();
});
