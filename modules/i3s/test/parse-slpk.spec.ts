import test from 'test/utils/vitest-tape';
import {coreApi, load, parseFile} from '@loaders.gl/core';
import {I3SLoader, SLPKLoader, SLPKSource} from '../src';
import {createReadableFileFromBuffer, loadArrayBufferFromFile} from 'test/utils/readable-files';

const SLPKUrl = '@loaders.gl/i3s/test/data/DA12_subset.slpk';

test('SLPKLoader#slpk load', async t => {
  const uncompressedFile = await load(SLPKUrl, SLPKLoader, {slpk: {path: 'nodepages/0.json'}});
  t.deepEqual(uncompressedFile.byteLength, 16153, 'SLPK nodepage has the correct length');
  t.end();
});

test('SLPKLoader#parseFile reads from ReadableFile', async t => {
  const arrayBuffer = await loadArrayBufferFromFile(SLPKUrl);
  const readableFile = await createReadableFileFromBuffer(arrayBuffer);
  const uncompressedFile = await parseFile(readableFile, SLPKLoader, {
    slpk: {path: 'nodepages/0.json'}
  });

  t.deepEqual(uncompressedFile.byteLength, 16153, 'SLPK nodepage has the correct length');
  t.end();
});

test('SLPKSource#initialize reads archive through I3SSource contract', async t => {
  const source = new SLPKSource({
    url: SLPKUrl,
    loader: I3SLoader,
    coreApi
  });

  await source.initialize();
  const tileset = await source.getRootTileset();

  t.equal(source.type, 'I3S', 'uses the I3S source type');
  t.ok(tileset.store, 'loads root I3S metadata from the archive');
  t.end();
});

test('SLPKLoader#slpk load error', async t => {
  try {
    await load(SLPKUrl, SLPKLoader, {slpk: {path: 'nodepages/5.json'}});
    t.fail('error should be thrown');
  } catch (e) {
    if (e) t.pass('correct error thrown');
  }
  t.end();
});

test('SLPKLoader#slpk load http nodepage', async t => {
  const uncompressedFile = await load(SLPKUrl, SLPKLoader, {
    slpk: {
      path: 'nodepages/0',
      pathMode: 'http'
    }
  });
  t.deepEqual(uncompressedFile.byteLength, 16153);
  t.end();
});

test('SLPKLoader#slpk load http layer', async t => {
  const uncompressedFile = await load(SLPKUrl, SLPKLoader, {slpk: {path: '', pathMode: 'http'}});
  t.deepEqual(uncompressedFile.byteLength, 4780);
  t.end();
});

test('SLPKLoader#slpk load http node', async t => {
  const uncompressedFile = await load(SLPKUrl, SLPKLoader, {
    slpk: {
      path: 'nodes/0',
      pathMode: 'http'
    }
  });
  t.deepEqual(uncompressedFile.byteLength, 1171);
  t.end();
});

test('SLPKLoader#slpk load http geometry', async t => {
  const uncompressedFile = await load(SLPKUrl, SLPKLoader, {
    slpk: {
      path: 'nodes/0/geometries/0',
      pathMode: 'http'
    }
  });
  t.deepEqual(uncompressedFile.byteLength, 156280);
  t.end();
});

test('SLPKLoader#slpk load http attributes', async t => {
  const uncompressedFile = await load(SLPKUrl, SLPKLoader, {
    slpk: {
      path: 'nodes/2/attributes/f_2/0',
      pathMode: 'http'
    }
  });
  t.deepEqual(uncompressedFile.byteLength, 8);
  t.end();
});

test('SLPKLoader#slpk load http statistics', async t => {
  const uncompressedFile = await load(SLPKUrl, SLPKLoader, {
    slpk: {
      path: 'statistics/f_3/0',
      pathMode: 'http'
    }
  });
  t.deepEqual(uncompressedFile.byteLength, 735);
  t.end();
});

test('SLPKLoader#slpk load http shared', async t => {
  const uncompressedFile = await load(SLPKUrl, SLPKLoader, {
    slpk: {
      path: 'nodes/2/shared',
      pathMode: 'http'
    }
  });
  t.deepEqual(uncompressedFile.byteLength, 333);
  t.end();
});
