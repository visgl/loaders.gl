import {GZipCompressor} from '@loaders.gl/compression/gzip-compressor';
import {encodeZip} from '@loaders.gl/zip';
import {BlobFile} from '@loaders.gl/loader-utils';
import {encodeIndexedZip} from '@loaders.gl/zip/indexed-zip-writer';
import {expect, test, vi} from 'vitest';
import {coreApi, load, parseFile} from '@loaders.gl/core';
import {I3SLoader, SLPKLoader, SLPKSource} from '../../src/i3s';
import {createReadableFileFromBuffer, loadArrayBufferFromFile} from 'test/utils/readable-files';
const SLPKUrl = '@loaders.gl/tiles-3d/i3s/test/data/DA12_subset.slpk';
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
  await expect(load(SLPKUrl, SLPKLoader, {slpk: {path: 'nodepages/5.json'}})).rejects.toThrow(
    'No such file in the archive: nodepages/5.json'
  );
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

test.each([
  'success',
  'missing'
])('SLPKLoader closes its owned file after %s extraction', async result => {
  const bytes = await encodeIndexedZip(
    {'tileset.json': new TextEncoder().encode('{}').buffer},
    {
      indexPath: '@specialIndexFileHASH128@',
      maxArchiveBytes: 4096
    }
  );
  const file = new BlobFile(bytes);
  const close = vi.spyOn(file, 'close');
  const read = parseFile(file, SLPKLoader, {
    slpk: {path: result === 'success' ? 'tileset.json' : 'missing'}
  });
  if (result === 'success') expect(new TextDecoder().decode(await read)).toBe('{}');
  else await expect(read).rejects.toThrow('No such file');
  expect(close).toHaveBeenCalledOnce();
});

test('SLPK unindexed node aliases use locale-independent path hashing', async () => {
  const resource = await new GZipCompressor().compress(new TextEncoder().encode('{}').buffer);
  const bytes = await encodeZip({'nodes/0/3dNodeIndexDocument.json.gz': resource});
  const localeLowerCase = String.prototype.toLocaleLowerCase;
  const locale = vi.spyOn(String.prototype, 'toLocaleLowerCase').mockImplementation(function (
    this: string
  ) {
    return localeLowerCase.call(this, 'tr');
  });
  try {
    const result = await parseFile(new BlobFile(bytes), SLPKLoader, {
      slpk: {path: 'nodes/0', pathMode: 'http'}
    });
    expect(new TextDecoder().decode(result)).toBe('{}');
  } finally {
    locale.mockRestore();
  }
});
