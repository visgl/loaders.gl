import test from 'tape-promise/tape';
import I3SNodePagesTiles from '../../src/helpers/i3s-nodepages-tiles';

const TILESET_STUB = {
  fetchOptions: {},
  nodePages: {
    nodesPerPage: 64,
    lodSelectionMetricType: 'maxScreenThresholdSQ'
  },
  url: '@loaders.gl/i3s/test/data/SanFrancisco_3DObjects_1_7/SceneServer/layers/0',
  materialDefinitions: [
    {
      doubleSided: true,
      emissiveFactor: [255, 255, 255],
      pbrMetallicRoughness: {
        baseColorTexture: {textureSetDefinitionId: 0}
      }
    }
  ],
  textureSetDefinitions: [{formats: [{name: '0', format: 'jpg'}]}]
};

test('I3SNodePagesTiles#Forms tile header from node pages data', async t => {
  const i3SNodePagesTiles = new I3SNodePagesTiles(TILESET_STUB, {});
  const rootNode = await i3SNodePagesTiles.formTileFromNodePages(0);
  t.ok(rootNode);
  t.end();
});

test('I3SNodePagesTiles#Root tile should not have content', async t => {
  const i3SNodePagesTiles = new I3SNodePagesTiles(TILESET_STUB, {});
  const rootNode = await i3SNodePagesTiles.formTileFromNodePages(0);
  t.ok(rootNode);
  t.notOk(rootNode.contentUrl);
  t.notOk(rootNode.textureUrl);
  t.end();
});

test('I3SNodePagesTiles#Tile with content', async t => {
  const i3SNodePagesTiles = new I3SNodePagesTiles(TILESET_STUB, {});
  const node1 = await i3SNodePagesTiles.formTileFromNodePages(1);
  t.ok(node1);
  t.equal(
    node1.contentUrl,
    '@loaders.gl/i3s/test/data/SanFrancisco_3DObjects_1_7/SceneServer/layers/0/nodes/1/geometries/0'
  );
  t.equal(
    node1.textureUrl,
    '@loaders.gl/i3s/test/data/SanFrancisco_3DObjects_1_7/SceneServer/layers/0/nodes/1/textures/0'
  );
  t.end();
});

test('I3SNodePagesTiles#Layer without textures', async t => {
  const i3SNodePagesTiles = new I3SNodePagesTiles({...TILESET_STUB, materialDefinitions: [{}]}, {});
  const node1 = await i3SNodePagesTiles.formTileFromNodePages(1);
  t.ok(node1);
  t.notOk(node1.textureUrl);

  const i3SNodePagesTiles2 = new I3SNodePagesTiles(
    {
      ...TILESET_STUB,
      materialDefinitions: [{pbrMetallicRoughness: {baseColorFactor: [255, 255, 255, 255]}}]
    },
    {}
  );
  const node2 = await i3SNodePagesTiles2.formTileFromNodePages(2);
  t.ok(node2);
  t.notOk(node2.textureUrl);

  const i3SNodePagesTiles3 = new I3SNodePagesTiles(
    {
      ...TILESET_STUB,
      textureSetDefinitions: []
    },
    {}
  );
  const node3 = await i3SNodePagesTiles3.formTileFromNodePages(3);
  t.ok(node3);
  t.notOk(node3.textureUrl);

  t.end();
});

test('I3SNodePagesTiles#Tile should have mbs converted from obb', async t => {
  const i3SNodePagesTiles = new I3SNodePagesTiles(TILESET_STUB, {});
  const node1 = await i3SNodePagesTiles.formTileFromNodePages(1);
  t.ok(node1);
  t.deepEqual(node1.mbs, [
    8.676496951388435,
    50.108416671362576,
    189.47502169783516,
    3243.264050599379
  ]);
  t.end();
});
