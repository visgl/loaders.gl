import test from 'tape-promise/tape';
import {join} from 'path';
import {createDataSource} from '@loaders.gl/core';
import {COPCSource, COPCTileSource} from '@loaders.gl/copc';

const ellipsoidFilename = join(__dirname, 'data/ellipsoid.copc.laz');

test('COPCSource#creates a source through createDataSource', async (t) => {
  const dataSource = createDataSource(ellipsoidFilename, [COPCSource], {
    core: {
      type: 'copc'
    },
    copc: {}
  });

  t.ok(dataSource instanceof COPCTileSource, 'createDataSource returns a COPC tile source');
  t.end();
});

test('COPCSource#loads normalized root and child tiles', async (t) => {
  const source = COPCSource.createDataSource(ellipsoidFilename, {});
  await source.initialize();

  const rootTile = await source.getRootTile();
  const childTiles = await source.getChildren(rootTile);

  t.equal(rootTile.id, '0-0-0-0', 'root tile id uses COPC key format');
  t.ok(rootTile.pointCount > 0, 'root tile point count is exposed');
  t.ok(rootTile.boundingVolume.radius > 0, 'root tile has a bounding volume');
  t.ok(childTiles.length > 0, 'child tile headers are exposed');
  t.ok(
    childTiles.every((tile) => tile.geometricError < rootTile.geometricError),
    'child tiles refine geometric error'
  );

  const grandChildTiles = await source.getChildren(childTiles[0]);
  t.ok(Array.isArray(grandChildTiles), 'deeper hierarchy traversal succeeds');
  t.end();
});

test('COPCSource#loads full point content for a tile', async (t) => {
  const source = COPCSource.createDataSource(ellipsoidFilename, {});
  await source.initialize();

  const rootTile = await source.getRootTile();
  const childTiles = await source.getChildren(rootTile);
  const tile = childTiles[0] || rootTile;
  const content = await source.loadTileContent(tile);

  t.ok(content, 'tile content loads');
  t.equal(
    content?.attributes.positions.value.length,
    content?.pointCount * 3,
    'positions array contains all points'
  );
  t.ok(content?.cartographicOrigin.length === 3, 'content includes a coordinate origin');
  t.end();
});

test('COPCSource#derives cartographic view metadata from the dataset', async (t) => {
  const source = COPCSource.createDataSource(ellipsoidFilename, {});

  const metadata = await source.getMetadata();
  const viewState = source.getViewState();

  t.ok(Array.isArray(metadata.viewState.cartographicCenter), 'metadata includes a cartographic center');
  t.ok(metadata.viewState.zoom > 0, 'metadata includes an inferred zoom');
  t.deepEqual(
    metadata.viewState.cartographicCenter,
    viewState.cartographicCenter,
    'metadata view state matches the source view state'
  );
  t.end();
});
