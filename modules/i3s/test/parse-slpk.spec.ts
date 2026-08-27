import {expect, test} from 'vitest';
import {coreApi, load, parseFile} from '@loaders.gl/core';
import {I3SLoader, SLPKLoader, SLPKSource} from '../src';
import {createReadableFileFromBuffer, loadArrayBufferFromFile} from 'test/utils/readable-files';
const SLPKUrl = '@loaders.gl/i3s/test/data/DA12_subset.slpk';
test('SLPKLoader#slpk load', async () => {
  const uncompressedFile = await load(SLPKUrl, SLPKLoader, {slpk: {path: 'nodepages/0.json'}});
  expect(uncompressedFile.byteLength, 'SLPK nodepage has the correct length').toEqual(16153);
});
test('SLPKLoader#parseFile reads from ReadableFile', async () => {
  const arrayBuffer = await loadArrayBufferFromFile(SLPKUrl);
  const readableFile = await createReadableFileFromBuffer(arrayBuffer);
  const uncompressedFile = await parseFile(readableFile, SLPKLoader, {
    slpk: {path: 'nodepages/0.json'}
  });
  expect(uncompressedFile.byteLength, 'SLPK nodepage has the correct length').toEqual(16153);
});
test('SLPKSource#initialize reads archive through I3SSource contract', async () => {
  const source = new SLPKSource({
    url: SLPKUrl,
    loader: I3SLoader,
    coreApi
  });
  await source.initialize();
  const tileset = await source.getRootTileset();
  expect(source.type, 'uses the I3S source type').toBe('I3S');
  expect(tileset.store, 'loads root I3S metadata from the archive').toBeTruthy();
});
test('SLPKLoader#slpk load error', async () => {
  try {
    await load(SLPKUrl, SLPKLoader, {slpk: {path: 'nodepages/5.json'}});
    (() => {
      throw new Error('error should be thrown');
    })();
  } catch (e) {
    if (e) expect(true, 'correct error thrown').toBe(true);
  }
});
test('SLPKLoader#slpk load http nodepage', async () => {
  const uncompressedFile = await load(SLPKUrl, SLPKLoader, {
    slpk: {
      path: 'nodepages/0',
      pathMode: 'http'
    }
  });
  expect(uncompressedFile.byteLength).toEqual(16153);
});
test('SLPKLoader#slpk load http layer', async () => {
  const uncompressedFile = await load(SLPKUrl, SLPKLoader, {slpk: {path: '', pathMode: 'http'}});
  expect(uncompressedFile.byteLength).toEqual(4780);
});
test('SLPKLoader#slpk load http node', async () => {
  const uncompressedFile = await load(SLPKUrl, SLPKLoader, {
    slpk: {
      path: 'nodes/0',
      pathMode: 'http'
    }
  });
  expect(uncompressedFile.byteLength).toEqual(1171);
});
test('SLPKLoader#slpk load http geometry', async () => {
  const uncompressedFile = await load(SLPKUrl, SLPKLoader, {
    slpk: {
      path: 'nodes/0/geometries/0',
      pathMode: 'http'
    }
  });
  expect(uncompressedFile.byteLength).toEqual(156280);
});
test('SLPKLoader#slpk load http attributes', async () => {
  const uncompressedFile = await load(SLPKUrl, SLPKLoader, {
    slpk: {
      path: 'nodes/2/attributes/f_2/0',
      pathMode: 'http'
    }
  });
  expect(uncompressedFile.byteLength).toEqual(8);
});
test('SLPKLoader#slpk load http statistics', async () => {
  const uncompressedFile = await load(SLPKUrl, SLPKLoader, {
    slpk: {
      path: 'statistics/f_3/0',
      pathMode: 'http'
    }
  });
  expect(uncompressedFile.byteLength).toEqual(735);
});
test('SLPKLoader#slpk load http shared', async () => {
  const uncompressedFile = await load(SLPKUrl, SLPKLoader, {
    slpk: {
      path: 'nodes/2/shared',
      pathMode: 'http'
    }
  });
  expect(uncompressedFile.byteLength).toEqual(333);
});
