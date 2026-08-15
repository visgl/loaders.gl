// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {pathToFileURL} from 'node:url';
import test from 'test/utils/vitest-tape';
import {createDataSource, fetchFile, resolvePath} from '@loaders.gl/core';
import {
  OMEZarrImageSource,
  OMEZarrSourceLoader,
  loadZarrConsolidatedMetadata
} from '@loaders.gl/zarr';

const CONTENT_BASE = resolvePath('@loaders.gl/zarr/test/data');
const OME_FIXTURE = `${CONTENT_BASE}/ome.zarr`;
const OME_FIXTURE_URL = pathToFileURL(OME_FIXTURE).href;
const SPATIALDATA_V3_FIXTURE = `${CONTENT_BASE}/spatialdata-v3.zarr`;
const SPATIALDATA_V3_FIXTURE_URL = pathToFileURL(SPATIALDATA_V3_FIXTURE).href;

function createOMEZarrSource(
  url: string,
  options: Parameters<typeof OMEZarrSourceLoader.createDataSource>[1] = {}
): OMEZarrImageSource {
  return createDataSource(url, [OMEZarrSourceLoader], options);
}

test('OMEZarrSourceLoader creates a source via createDataSource()', t => {
  const source = createOMEZarrSource(OME_FIXTURE_URL);
  t.ok(source instanceof OMEZarrImageSource);
  t.end();
});

test('OMEZarrImageSource exposes normalized metadata', async t => {
  const source = createOMEZarrSource(OME_FIXTURE_URL);
  const metadata = await source.getMetadata();

  t.equal(metadata.name, 'ome-zarr example');
  t.equal(metadata.width, 439);
  t.equal(metadata.height, 167);
  t.equal(metadata.bandCount, 3);
  t.equal(metadata.dtype, 'int8');
  t.deepEqual(metadata.labels, ['t', 'c', 'z', 'y', 'x']);
  t.equal(metadata.levels.length, 2);
  t.deepEqual(metadata.tileSize, {width: 439, height: 167});
  t.end();
});

test('OMEZarrImageSource#getRaster returns planar and interleaved channel data', async t => {
  const source = createOMEZarrSource(OME_FIXTURE_URL);
  const planarRaster = await source.getRaster({channels: [0, 1, 2]});
  const interleavedRaster = await source.getRaster({channels: [0, 2], interleaved: true});

  t.equal(planarRaster.width, 439);
  t.equal(planarRaster.height, 167);
  t.equal(planarRaster.bandCount, 3);
  t.equal(planarRaster.dtype, 'int8');
  t.ok(Array.isArray(planarRaster.data), 'planar channel selection returns array data');
  t.equal(planarRaster.data[0].length, 439 * 167);
  t.notOk(Array.isArray(interleavedRaster.data), 'interleaved selection returns one typed array');
  t.equal(interleavedRaster.data.length, 439 * 167 * 2);
  t.equal(interleavedRaster.bandCount, 2);
  t.end();
});

test('OMEZarrImageSource validates pyramid levels and channels', async t => {
  const source = createOMEZarrSource(OME_FIXTURE_URL);

  await t.rejects(source.getRaster({level: 10}), /pyramid level 10 is not available/);
  await t.rejects(source.getRaster({channels: [3]}), /Channel 3 is out of bounds/);
  await t.rejects(source.getRaster({channels: []}), /must include at least one channel/);
  await t.rejects(source.getRaster({channels: [0.5]}), /Channel 0.5 is out of bounds/);
  await t.rejects(source.getRaster({t: 1}), /time index 1 is out of bounds/);
  await t.rejects(source.getRaster({z: -1}), /z index -1 is out of bounds/);
  t.end();
});

test('loadZarrConsolidatedMetadata handles .zmetadata and extracts top-level groups', async t => {
  const metadata = await loadZarrConsolidatedMetadata(OME_FIXTURE, {fetch: fetchFile});

  t.equal(metadata.format, 'v2');
  t.equal(metadata.metadataPath, '.zmetadata');
  t.deepEqual(metadata.topLevelGroups, []);
  t.deepEqual(metadata.topLevelArrays, ['0', '1']);
  t.end();
});

test('OMEZarrImageSource reads a v3 SpatialData fixture', async t => {
  const source = createOMEZarrSource(SPATIALDATA_V3_FIXTURE_URL, {
    zarr: {path: 'images/example-image'}
  });
  const metadata = await source.getMetadata();
  const raster = await source.getRaster({channels: [0, 1, 2]});

  t.equal(metadata.name, 'ome-zarr example');
  t.equal(metadata.width, 439);
  t.equal(metadata.height, 167);
  t.deepEqual(metadata.labels, ['t', 'c', 'z', 'y', 'x']);
  t.equal(raster.width, 439);
  t.equal(raster.height, 167);
  t.equal(raster.bandCount, 3);
  t.end();
});

test('loadZarrConsolidatedMetadata handles v3 zarr.json fixture metadata', async t => {
  const metadata = await loadZarrConsolidatedMetadata(SPATIALDATA_V3_FIXTURE, {
    fetch: fetchFile
  });

  t.equal(metadata.format, 'v3');
  t.equal(metadata.metadataPath, 'zarr.json');
  t.deepEqual(metadata.topLevelGroups, ['images', 'labels', 'points', 'shapes', 'tables']);
  t.deepEqual(metadata.topLevelArrays, []);
  t.end();
});

test('loadZarrConsolidatedMetadata handles zmetadata and zarr.json payloads', async t => {
  const baseUrl = 'https://example.com/spatialdata.zarr';
  const fetcher = async (url: string) => {
    if (url === `${baseUrl}/zmetadata`) {
      return new Response(
        JSON.stringify({
          metadata: {
            '.zgroup': {zarr_format: 2},
            'images/.zgroup': {zarr_format: 2},
            'labels/.zgroup': {zarr_format: 2}
          }
        }),
        {status: 200}
      );
    }
    return new Response(null, {status: 404});
  };

  const zmetadata = await loadZarrConsolidatedMetadata(baseUrl, {
    metadataPath: 'zmetadata',
    fetch: fetcher
  });
  t.equal(zmetadata.format, 'v2');
  t.deepEqual(zmetadata.topLevelGroups, ['images', 'labels']);
  t.deepEqual(zmetadata.topLevelArrays, []);

  const zarrJson = await loadZarrConsolidatedMetadata(baseUrl, {
    metadataPath: 'zarr.json',
    fetch: async () =>
      new Response(
        JSON.stringify({
          consolidated_metadata: {
            metadata: {
              images: {node_type: 'group'},
              'images/example': {node_type: 'group'},
              labels: {node_type: 'group'}
            }
          }
        }),
        {status: 200}
      )
  });
  t.equal(zarrJson.format, 'v3');
  t.deepEqual(zarrJson.topLevelGroups, ['images', 'labels']);
  t.deepEqual(zarrJson.topLevelArrays, []);
  t.end();
});

test('loadZarrConsolidatedMetadata auto probing skips non-consolidated zarr.json', async t => {
  const baseUrl = 'https://example.com/mixed.zarr';
  const metadata = await loadZarrConsolidatedMetadata(baseUrl, {
    fetch: async url => {
      if (url.endsWith('/zarr.json')) {
        return new Response(JSON.stringify({zarr_format: 3, node_type: 'group'}));
      }
      if (url.endsWith('/.zmetadata')) {
        return new Response(
          JSON.stringify({
            metadata: {
              '.zgroup': {zarr_format: 2},
              'image/.zarray': {shape: [1, 1]}
            }
          })
        );
      }
      return new Response(null, {status: 404});
    }
  });

  t.equal(metadata.format, 'v2');
  t.deepEqual(metadata.topLevelArrays, ['image']);
  t.end();
});
