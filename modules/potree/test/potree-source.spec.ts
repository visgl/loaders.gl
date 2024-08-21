import test from 'tape-promise/tape';
import {PotreeSource} from '@loaders.gl/potree';

const POTREE_HIERARCHY_CHUNK_URL = '@loaders.gl/potree/test/data/lion_takanawa';

test('PotreeSource#initialize', async (t) => {
  const DS = PotreeSource;
  const source = DS.createDataSource(POTREE_HIERARCHY_CHUNK_URL, {});
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
  const source = DS.createDataSource(POTREE_HIERARCHY_CHUNK_URL, {});

  const existingNodeContent = await source.loadNodeContent([3, 6, 0]);
  t.equals(existingNodeContent, null);

  t.end();
});
