import test from 'tape-promise/tape';
import {PotreeSource} from '@loaders.gl/potree';

const POTREE_BIN_URL = '@loaders.gl/potree/test/data/lion_takanawa';
const POTREE_LAZ_URL =
  'https://raw.githubusercontent.com/visgl/deck.gl-data/master/formats/potree/1.8/3dm_32_291_5744_1_nw-converted';

test('PotreeSource#initialize', async (t) => {
  const DS = PotreeSource;
  const source = DS.createDataSource(POTREE_BIN_URL, {});
  t.notOk(source.isReady);

  await source.init();

  t.ok(source.isReady);
  t.equal(source.metadata?.version, '1.7');
  t.equal(source.root?.header.childCount, 6);
  t.notOk(source.isSupported());
  t.end();
});

test('PotreeSource#loadNodeContent - should return null for unsupported source', async (t) => {
  const DS = PotreeSource;
  const source = DS.createDataSource(POTREE_BIN_URL, {});

  const existingNodeContent = await source.loadNodeContent([3, 6, 0]);
  t.equals(existingNodeContent, null);

  t.end();
});

test('PotreeSource#loadNodeContent', async (t) => {
  const DS = PotreeSource;
  const source = DS.createDataSource(POTREE_LAZ_URL, {});

  await source.init();

  t.ok(source.isSupported());

  const existingNodeContent = await source.loadNodeContent([2, 4, 6]);
  t.equals(existingNodeContent?.header?.vertexCount, 9933);

  t.end();
});
