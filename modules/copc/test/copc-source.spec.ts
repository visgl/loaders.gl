import test from 'tape-promise/tape';
import {createDataSource, encodeSync, fetchFile, isBrowser} from '@loaders.gl/core';
import {COPCSourceLoader, COPCTileSource, COPCWriter} from '@loaders.gl/copc';

const ELLIPSOID_FILE_PATH = 'modules/copc/test/data/ellipsoid.copc.laz';
const ELLIPSOID_BROWSER_URL = new URL('./data/ellipsoid.copc.laz', import.meta.url).href;

test('COPCSourceLoader#creates a source through createDataSource', async t => {
  const dataSource = createDataSource(await createEllipsoidSourceData(), [COPCSourceLoader], {
    core: {
      type: 'copc'
    },
    copc: {}
  });

  t.ok(dataSource instanceof COPCTileSource, 'createDataSource returns a COPC tile source');
  t.end();
});

test('COPCSourceLoader#loads normalized root and child tiles', async t => {
  const source = COPCSourceLoader.createDataSource(await createEllipsoidSourceData(), {});
  await source.initialize();

  const rootTile = await source.getRootTile();
  const childTiles = await source.getChildren(rootTile);

  t.equal(rootTile.id, '0-0-0-0', 'root tile id uses COPC key format');
  t.ok(rootTile.pointCount > 0, 'root tile point count is exposed');
  t.ok(rootTile.boundingVolume.radius > 0, 'root tile has a bounding volume');
  t.ok(childTiles.length > 0, 'child tile headers are exposed');
  t.ok(
    childTiles.every(tile => tile.geometricError < rootTile.geometricError),
    'child tiles refine geometric error'
  );

  const grandChildTiles = await source.getChildren(childTiles[0]);
  t.ok(Array.isArray(grandChildTiles), 'deeper hierarchy traversal succeeds');
  t.end();
});

test('COPCSourceLoader#loads full point content for a tile', async t => {
  if (isBrowser) {
    t.comment('Skipping browser content decode until laz-perf wasm is served as an asset');
    t.end();
    return;
  }

  const source = COPCSourceLoader.createDataSource(ELLIPSOID_FILE_PATH, {});
  await source.initialize();

  const rootTile = await source.getRootTile();
  const childTiles = await source.getChildren(rootTile);
  const tile = childTiles[0] || rootTile;
  const content = await source.loadTileContent(tile);

  t.ok(content, 'tile content loads');
  t.equal(
    content?.data.data.getChild('POSITION')?.length,
    content?.pointCount,
    'Arrow table contains one position row per point'
  );
  t.equal(content?.data.shape, 'arrow-table', 'tile content is returned as an Arrow table');
  t.ok(content?.cartographicOrigin.length === 3, 'content includes a coordinate origin');
  t.end();
});

test('COPCSourceLoader#loads tile content with TypeScript LAZ decoder', async t => {
  const source = COPCSourceLoader.createDataSource(await createEllipsoidSourceData(), {
    copc: {decoder: 'typescript-laz'}
  });
  await source.initialize();

  const rootTile = await source.getRootTile();
  const content = await source.loadTileContent(rootTile);

  t.ok(content, 'tile content loads');
  t.equal(
    content?.data.data.getChild('POSITION')?.length,
    content?.pointCount,
    'Arrow table contains one position row per point'
  );
  t.end();
});

test('COPCSourceLoader#TypeScript tile attributes match laz-perf', async t => {
  if (isBrowser) {
    t.comment('Skipping browser parity until laz-perf wasm is served as an asset');
    t.end();
    return;
  }

  const lazPerfSource = COPCSourceLoader.createDataSource(ELLIPSOID_FILE_PATH, {});
  const typescriptSource = COPCSourceLoader.createDataSource(ELLIPSOID_FILE_PATH, {
    copc: {decoder: 'typescript-laz'}
  });
  await Promise.all([lazPerfSource.initialize(), typescriptSource.initialize()]);

  const rootTile = await typescriptSource.getRootTile();
  const [lazPerfContent, typescriptContent] = await Promise.all([
    lazPerfSource.loadTileContent(rootTile),
    typescriptSource.loadTileContent(rootTile)
  ]);
  const lazPerfPositions = lazPerfContent?.data.data.getChild('POSITION');
  const typescriptPositions = typescriptContent?.data.data.getChild('POSITION');
  const lazPerfColors = lazPerfContent?.data.data.getChild('COLOR_0');
  const typescriptColors = typescriptContent?.data.data.getChild('COLOR_0');

  t.equal(typescriptContent?.pointCount, lazPerfContent?.pointCount, 'point counts match');
  t.deepEqual(
    Array.from({length: rootTile.pointCount}, (_, index) =>
      typescriptPositions?.get(index)?.toArray()
    ),
    Array.from({length: rootTile.pointCount}, (_, index) =>
      lazPerfPositions?.get(index)?.toArray()
    ),
    'tile-relative positions match laz-perf'
  );
  t.deepEqual(
    Array.from({length: rootTile.pointCount}, (_, index) =>
      typescriptColors?.get(index)?.toArray()
    ),
    Array.from({length: rootTile.pointCount}, (_, index) => lazPerfColors?.get(index)?.toArray()),
    'raw colors match laz-perf'
  );
  t.end();
});

test('COPCSourceLoader#loads tile content from a Blob', async t => {
  if (isBrowser) {
    t.comment('Skipping browser content decode until laz-perf wasm is served as an asset');
    t.end();
    return;
  }

  const blob = await createEllipsoidBlob();
  const source = COPCSourceLoader.createDataSource(blob, {});
  await source.initialize();

  const rootTile = await source.getRootTile();
  const content = await source.loadTileContent(rootTile);

  t.ok(content, 'Blob-backed tile content loads');
  t.equal(
    content?.data.data.getChild('POSITION')?.length,
    content?.pointCount,
    'Blob-backed Arrow table contains one position row per point'
  );
  t.end();
});

test('COPCSourceLoader#derives cartographic view metadata from the dataset', async t => {
  const source = COPCSourceLoader.createDataSource(await createEllipsoidSourceData(), {});

  const metadata = await source.getMetadata();
  const viewState = source.getViewState();

  t.ok(
    Array.isArray(metadata.viewState.cartographicCenter),
    'metadata includes a cartographic center'
  );
  t.ok(metadata.viewState.zoom > 0, 'metadata includes an inferred zoom');
  t.deepEqual(
    metadata.viewState.cartographicCenter,
    viewState.cartographicCenter,
    'metadata view state matches the source view state'
  );
  t.end();
});

test('COPCWriter#reports unimplemented TypeScript COPC encoding', t => {
  t.throws(
    () => encodeSync({} as any, COPCWriter),
    /not implemented yet/,
    'COPCWriter encodeSync reports unimplemented encoding'
  );
  t.end();
});

/** Returns the COPC fixture input for the active test runner. */
async function createEllipsoidSourceData(): Promise<string | Blob> {
  return isBrowser ? await createEllipsoidBlob() : ELLIPSOID_FILE_PATH;
}

/** Loads the shared COPC fixture as a Blob in both Node and browser test runners. */
async function createEllipsoidBlob(): Promise<Blob> {
  const url = isBrowser ? ELLIPSOID_BROWSER_URL : ELLIPSOID_FILE_PATH;
  return new Blob([await (await fetchFile(url)).arrayBuffer()]);
}
