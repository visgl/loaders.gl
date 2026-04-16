// @loaders.gl, MIT license
import {pathToFileURL} from 'node:url';
import test from 'tape-promise/tape';
import {createDataSource, isBrowser, resolvePath} from '@loaders.gl/core';
import {
  OMEZarrImageSource,
  OMEZarrSourceLoader,
  loadZarrConsolidatedMetadata
} from '@loaders.gl/zarr';

const CONTENT_BASE = resolvePath('@loaders.gl/zarr/test/data');
const OME_FIXTURE = `${CONTENT_BASE}/ome.zarr`;
const SPATIALDATA_V3_FIXTURE = pathToFileURL(`${CONTENT_BASE}/spatialdata-v3.zarr`).href;

test('OMEZarrSourceLoader creates a source via createDataSource()', async (t) => {
  if (isBrowser) {
    t.end();
    return;
  }

  t.plan(1);
  const source = createDataSource(OME_FIXTURE, [OMEZarrSourceLoader], {
    omezarr: {}
  });
  t.ok(source instanceof OMEZarrImageSource, 'createDataSource() returns OMEZarrImageSource');
});

test('OMEZarrImageSource exposes normalized metadata', async (t) => {
  if (isBrowser) {
    t.end();
    return;
  }

  t.plan(8);
  const source = new OMEZarrImageSource(OME_FIXTURE, {omezarr: {}});
  const metadata = await source.getMetadata();

  t.equal(metadata.name, 'ome-zarr example');
  t.equal(metadata.width, 439);
  t.equal(metadata.height, 167);
  t.equal(metadata.bandCount, 3);
  t.equal(metadata.dtype, 'int8');
  t.deepEqual(metadata.labels, ['t', 'c', 'z', 'y', 'x']);
  t.equal(metadata.levels.length, 2);
  t.equal(metadata.tileSize.width, 256);
});

test('OMEZarrImageSource#getRaster returns multi-channel plane data', async (t) => {
  if (isBrowser) {
    t.end();
    return;
  }

  t.plan(6);
  const source = new OMEZarrImageSource(OME_FIXTURE, {omezarr: {}});
  const raster = await source.getRaster({channels: [0, 1, 2]});

  t.equal(raster.width, 439);
  t.equal(raster.height, 167);
  t.equal(raster.bandCount, 3);
  t.equal(raster.dtype, 'int8');
  t.ok(Array.isArray(raster.data), 'non-interleaved channel selection returns array data');
  t.equal(raster.data[0].length, 439 * 167);
});

test('loadZarrConsolidatedMetadata handles .zmetadata and extracts top-level groups', async (t) => {
  if (isBrowser) {
    t.end();
    return;
  }

  t.plan(3);
  const metadata = await loadZarrConsolidatedMetadata(OME_FIXTURE);

  t.equal(metadata.format, 'v2');
  t.equal(metadata.metadataPath, '.zmetadata');
  t.deepEqual(metadata.topLevelGroups, ['0', '1']);
});

test('OMEZarrImageSource reads a v3 spatialdata fixture', async (t) => {
  if (isBrowser) {
    t.end();
    return;
  }

  t.plan(7);
  const source = new OMEZarrImageSource(SPATIALDATA_V3_FIXTURE, {
    zarr: {path: 'images/example-image'},
    omezarr: {}
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
});

test('loadZarrConsolidatedMetadata handles v3 zarr.json fixture metadata', async (t) => {
  if (isBrowser) {
    t.end();
    return;
  }

  t.plan(3);
  const metadata = await loadZarrConsolidatedMetadata(SPATIALDATA_V3_FIXTURE);

  t.equal(metadata.format, 'v3');
  t.equal(metadata.metadataPath, 'zarr.json');
  t.deepEqual(metadata.topLevelGroups, ['images', 'labels', 'points', 'shapes', 'tables']);
});

test('loadZarrConsolidatedMetadata handles zmetadata and zarr.json payloads', async (t) => {
  t.plan(4);

  const baseUrl = 'https://example.com/spatialdata.zarr';
  const fetcher = async (url) => {
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
});
