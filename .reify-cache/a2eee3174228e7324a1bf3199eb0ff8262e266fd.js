"use strict";var test;module.link('tape-promise/tape',{default(v){test=v}},0);var fetchFile,getStreamIterator;module.link('@loaders.gl/core',{fetchFile(v){fetchFile=v},getStreamIterator(v){getStreamIterator=v}},1);var createReadStream;module.link('@loaders.gl/core',{createReadStream(v){createReadStream=v}},2);

 // DEPRECATED

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

test('getStreamIterator(createReadStream)#async iterate', async t => {
  const stream = await createReadStream(DATA_URL);
  t.ok(stream);

  const asyncIterator = getStreamIterator(stream);
  t.ok(asyncIterator);

  for await (const arrayBuffer of asyncIterator) {
    t.ok(arrayBuffer, `Got chunk from stream ${arrayBuffer.byteLength}`);
  }

  t.end();
});
