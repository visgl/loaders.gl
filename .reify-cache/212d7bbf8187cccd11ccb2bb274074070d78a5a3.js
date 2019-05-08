"use strict";var test;module.link('tape-promise/tape',{default(v){test=v}},0);var createReadStream,getStreamIterator;module.link('@loaders.gl/core',{createReadStream(v){createReadStream=v},getStreamIterator(v){getStreamIterator=v}},1);


const DATA_URL = '@loaders.gl/draco/test/data/raw-attribute-buffers/lidar-positions.bin';

test('createReadStream#parseStream(text)', async t => {
  const stream = await createReadStream(DATA_URL);
  t.ok(stream);

  const asyncIterator = getStreamIterator(stream);
  t.ok(asyncIterator);

  for await (const arrayBuffer of asyncIterator) {
    t.ok(arrayBuffer, `Got chunk from stream ${arrayBuffer.byteLength}`);
  }

  t.end();
});
