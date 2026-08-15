import test from 'test/utils/vitest-tape';
import {PotreeSourceLoader} from '@loaders.gl/potree';

const POTREE_BIN_URL = '@loaders.gl/potree/test/data/lion_takanawa';

test('PotreeSourceLoader#initialize', async t => {
  const DS = PotreeSourceLoader;
  const source = DS.createDataSource(POTREE_BIN_URL, {});
  t.notOk(source.isReady);

  await source.init();

  t.ok(source.isReady);
  t.equal(source.metadata?.version, '1.7');
  t.equal(source.root?.header.childCount, 6);
  t.ok(source.isSupported());
  t.end();
});

test('PotreeSourceLoader#loadNodeContent - loads binary point content', async t => {
  const DS = PotreeSourceLoader;
  const source = DS.createDataSource(POTREE_BIN_URL, {});

  await source.initialize();

  const nodeContent = await source.loadNodeContent('0');
  t.ok(nodeContent, 'node content is returned');
  t.equals(nodeContent?.header?.vertexCount, 4511, 'vertex count matches hierarchy');
  t.equals(
    nodeContent?.attributes.positions?.value.length,
    4511 * 3,
    'positions are decoded for every point'
  );
  t.equals(
    nodeContent?.attributes.colors?.value.length,
    4511 * 3,
    'packed colors are decoded for every point'
  );

  t.end();
});

test('PotreeSourceLoader#exposes normalized tile headers and bounds', async t => {
  const source = PotreeSourceLoader.createDataSource(POTREE_BIN_URL, {});
  await source.initialize();

  const rootTile = await source.getRootTile();
  const childTiles = await source.getChildren(rootTile);
  const childZero = childTiles.find(tile => tile.id === 'r0');

  t.equal(rootTile.id, 'r', 'root tile id is normalized');
  t.equal(rootTile.level, 0, 'root tile level is preserved');
  t.ok(rootTile.boundingVolume.radius > 0, 'root tile has a bounding volume');
  t.ok(childTiles.length > 0, 'child tile headers are available');
  t.ok(childZero, 'expected child tile exists');

  if (childZero) {
    const [rootMinBounds, rootMaxBounds] = rootTile.boundingVolume.cartographicBounds;
    const [childMinBounds, childMaxBounds] = childZero.boundingVolume.cartographicBounds;
    t.equal(childMinBounds[0], rootMinBounds[0], 'child 0 keeps lower x bound');
    t.equal(childMaxBounds[0], (rootMinBounds[0] + rootMaxBounds[0]) / 2, 'child 0 splits x');
    t.equal(childMinBounds[1], rootMinBounds[1], 'child 0 keeps lower y bound');
    t.equal(childMaxBounds[1], (rootMinBounds[1] + rootMaxBounds[1]) / 2, 'child 0 splits y');
    t.equal(childMinBounds[2], rootMinBounds[2], 'child 0 keeps lower z bound');
    t.equal(childMaxBounds[2], (rootMinBounds[2] + rootMaxBounds[2]) / 2, 'child 0 splits z');
  }

  t.end();
});
