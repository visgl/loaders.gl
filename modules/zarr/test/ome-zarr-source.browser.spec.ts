// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {createDataSource} from '@loaders.gl/core';
import {
  OMEZarrImageSource,
  OMEZarrSourceLoader,
  type ZarrSourceLoaderOptions
} from '@loaders.gl/zarr';

const SPATIALDATA_V3_FIXTURE_URL = '/modules/zarr/test/data/spatialdata-v3.zarr';

test('OMEZarrSourceLoader supports browser-relative store URLs', async t => {
  const source = createDataSource(SPATIALDATA_V3_FIXTURE_URL, [OMEZarrSourceLoader], {
    zarr: {path: 'images/example-image'}
  });
  const metadata = await source.getMetadata();

  t.equal(metadata.name, 'ome-zarr example');
  t.equal(metadata.width, 439);
  t.equal(metadata.height, 167);
  t.equal(metadata.bandCount, 3);
  t.end();
});

test('OMEZarrImageSource reads metadata and channel data in browsers', async t => {
  const source = createInMemoryOMEZarrSource();
  const metadata = await source.getMetadata();
  const planarRaster = await source.getRaster({channels: [0, 2]});
  const interleavedRaster = await source.getRaster({channels: [0, 1], interleaved: true});

  t.equal(metadata.name, 'Browser OME fixture');
  t.equal(metadata.width, 3);
  t.equal(metadata.height, 2);
  t.equal(metadata.bandCount, 3);
  t.equal(metadata.dtype, 'uint8');
  t.deepEqual(metadata.labels, ['t', 'c', 'z', 'y', 'x']);
  t.deepEqual(metadata.tileSize, {width: 3, height: 2});
  t.deepEqual(metadata.channels, [
    {index: 0, name: 'red', color: 'FF0000', active: true},
    {index: 1, name: 'green', color: '00FF00', active: true},
    {index: 2, name: 'blue', color: '0000FF', active: false}
  ]);

  t.ok(Array.isArray(planarRaster.data));
  t.deepEqual(Array.from(planarRaster.data[0]), [1, 2, 3, 4, 5, 6]);
  t.deepEqual(Array.from(planarRaster.data[1]), [21, 22, 23, 24, 25, 26]);
  t.equal(planarRaster.width, 3);
  t.equal(planarRaster.height, 2);
  t.equal(planarRaster.bandCount, 2);

  t.ok(interleavedRaster.data instanceof Uint8Array);
  t.deepEqual(Array.from(interleavedRaster.data as Uint8Array), [1, 11, 2, 12, 3, 13, 4, 14, 5, 15, 6, 16]);
  t.equal(interleavedRaster.bandCount, 2);
  t.equal(interleavedRaster.interleaved, true);
  t.end();
});

test('OMEZarrImageSource validates browser raster selections', async t => {
  const source = createInMemoryOMEZarrSource();

  await t.rejects(source.getRaster({level: 1}), /pyramid level 1 is not available/);
  await t.rejects(source.getRaster({channels: []}), /must include at least one channel/);
  await t.rejects(source.getRaster({channels: [3]}), /Channel 3 is out of bounds/);
  await t.rejects(source.getRaster({t: 1}), /time index 1 is out of bounds/);
  await t.rejects(source.getRaster({z: -1}), /z index -1 is out of bounds/);
  t.end();
});

/** Creates an OME-Zarr source backed by a small in-memory Zarr v3 store. */
function createInMemoryOMEZarrSource(): OMEZarrImageSource {
  const baseUrl = 'https://example.com/browser-ome.zarr';
  const options: ZarrSourceLoaderOptions = {
    core: {loadOptions: {core: {fetch: createOMEZarrFetcher(baseUrl)}}},
    zarr: {requireConsolidatedMetadata: false}
  };
  return new OMEZarrImageSource(baseUrl, options);
}

/** Creates an in-memory HTTP view of a small OME-Zarr v3 store. */
function createOMEZarrFetcher(baseUrl: string): typeof fetch {
  const responses = new Map<string, BodyInit>([
    [`${baseUrl}/zarr.json`, encodeJson(createOMEGroupMetadata())],
    [`${baseUrl}/0/zarr.json`, encodeJson(createOMEArrayMetadata())],
    [`${baseUrl}/0/c/0/0/0/0/0`, new Uint8Array([1, 2, 3, 4, 5, 6])],
    [`${baseUrl}/0/c/0/1/0/0/0`, new Uint8Array([11, 12, 13, 14, 15, 16])],
    [`${baseUrl}/0/c/0/2/0/0/0`, new Uint8Array([21, 22, 23, 24, 25, 26])]
  ]);

  return (async input => {
    const url = input instanceof Request ? input.url : String(input);
    const body = responses.get(url);
    return body ? new Response(body) : new Response(null, {status: 404});
  }) as typeof fetch;
}

/** Creates OME metadata for the in-memory image group. */
function createOMEGroupMetadata(): Record<string, unknown> {
  return {
    zarr_format: 3,
    node_type: 'group',
    attributes: {
      ome: {
        multiscales: [
          {
            version: '0.5',
            axes: [
              {name: 't', type: 'time'},
              {name: 'c', type: 'channel'},
              {name: 'z', type: 'space'},
              {name: 'y', type: 'space'},
              {name: 'x', type: 'space'}
            ],
            datasets: [{path: '0'}]
          }
        ],
        omero: {
          name: 'Browser OME fixture',
          channels: [
            {active: true, color: 'FF0000', label: 'red'},
            {active: true, color: '00FF00', label: 'green'},
            {active: false, color: '0000FF', label: 'blue'}
          ],
          rdefs: {defaultT: 0, defaultZ: 0, model: 'color'}
        }
      }
    }
  };
}

/** Creates uncompressed uint8 array metadata for the in-memory image. */
function createOMEArrayMetadata(): Record<string, unknown> {
  return {
    zarr_format: 3,
    node_type: 'array',
    shape: [1, 3, 1, 2, 3],
    data_type: 'uint8',
    chunk_grid: {name: 'regular', configuration: {chunk_shape: [1, 1, 1, 2, 3]}},
    chunk_key_encoding: {name: 'default', configuration: {separator: '/'}},
    codecs: [{name: 'bytes', configuration: {endian: 'little'}}],
    fill_value: 0,
    dimension_names: ['t', 'c', 'z', 'y', 'x'],
    attributes: {}
  };
}

/** Encodes Zarr metadata as UTF-8 bytes. */
function encodeJson(value: unknown): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(value));
}
