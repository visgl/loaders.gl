import test from 'tape-promise/tape';
import {getSupportedGPUTextureFormats} from '@loaders.gl/textures';
import I3SNodePagesTiles from '../../src/helpers/i3s-nodepages-tiles';
import {isBrowser} from '@loaders.gl/core';
import {TILESET_STUB} from '../test-utils/load-utils';

test('I3SNodePagesTiles#Forms tile header from node pages data', async t => {
  const i3SNodePagesTiles = new I3SNodePagesTiles(TILESET_STUB(), {});
  const rootNode = await i3SNodePagesTiles.formTileFromNodePages(0);
  t.ok(rootNode);
  t.end();
});

test('I3SNodePagesTiles#Root tile should not have content', async t => {
  const i3SNodePagesTiles = new I3SNodePagesTiles(TILESET_STUB(), {});
  const rootNode = await i3SNodePagesTiles.formTileFromNodePages(0);
  t.ok(rootNode);
  t.notOk(rootNode.contentUrl);
  t.notOk(rootNode.textureUrl);
  t.end();
});

test('I3SNodePagesTiles#Tile with content', async t => {
  const i3SNodePagesTiles = new I3SNodePagesTiles(TILESET_STUB(), {});
  const node1 = await i3SNodePagesTiles.formTileFromNodePages(1);
  t.ok(node1);
  t.equal(
    node1.contentUrl,
    'https://raw.githubusercontent.com/visgl/loaders.gl/master/modules/i3s/test/data/SanFrancisco_3DObjects_1_7/SceneServer/layers/0/nodes/1/geometries/0'
  );
  if (isBrowser) {
    t.equal(
      node1.textureUrl,
      'https://raw.githubusercontent.com/visgl/loaders.gl/master/modules/i3s/test/data/SanFrancisco_3DObjects_1_7/SceneServer/layers/0/nodes/1/textures/0_0_1'
    );
  } else {
    t.equal(
      node1.textureUrl,
      'https://raw.githubusercontent.com/visgl/loaders.gl/master/modules/i3s/test/data/SanFrancisco_3DObjects_1_7/SceneServer/layers/0/nodes/1/textures/0'
    );
  }

  t.end();
});

test('I3SNodePagesTiles#Layer without textures', async t => {
  const i3SNodePagesTiles = new I3SNodePagesTiles(
    {...TILESET_STUB(), materialDefinitions: [{}]},
    {}
  );
  const node1 = await i3SNodePagesTiles.formTileFromNodePages(1);
  t.ok(node1);
  t.notOk(node1.textureUrl);

  const i3SNodePagesTiles2 = new I3SNodePagesTiles(
    {
      ...TILESET_STUB(),
      materialDefinitions: [{pbrMetallicRoughness: {baseColorFactor: [255, 255, 255, 255]}}]
    },
    {}
  );
  const node2 = await i3SNodePagesTiles2.formTileFromNodePages(2);
  t.ok(node2);
  t.notOk(node2.textureUrl);

  const i3SNodePagesTiles3 = new I3SNodePagesTiles(
    {
      ...TILESET_STUB(),
      textureSetDefinitions: []
    },
    {}
  );
  const node3 = await i3SNodePagesTiles3.formTileFromNodePages(3);
  t.ok(node3);
  t.notOk(node3.textureUrl);

  t.end();
});

// Logic moved to parse-i3s.js to avoid calling extra conversion the center from cartographic to cartesian
test.skip('I3SNodePagesTiles#Tile should have mbs converted from obb', async t => {
  const i3SNodePagesTiles = new I3SNodePagesTiles(TILESET_STUB(), {});
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

test('I3SNodePagesTiles#Select "dds" texture if it is supported', async t => {
  const i3SNodePagesTiles = new I3SNodePagesTiles(
    {
      ...TILESET_STUB(),
      textureSetDefinitions: [
        {
          formats: [
            {
              name: '0',
              format: 'jpg'
            },
            {
              name: '0_0_1',
              format: 'dds'
            }
          ]
        }
      ]
    },
    {}
  );
  const node = await i3SNodePagesTiles.formTileFromNodePages(2);
  t.ok(node);

  if (isBrowser) {
    const supportedFormats = getSupportedGPUTextureFormats();

    if (supportedFormats.has('dxt')) {
      t.equal(
        node.textureUrl,
        'https://raw.githubusercontent.com/visgl/loaders.gl/master/modules/i3s/test/data/SanFrancisco_3DObjects_1_7/SceneServer/layers/0/nodes/2/textures/0_0_1'
      );
      t.deepEqual(i3SNodePagesTiles.textureDefinitionsSelectedFormats, [
        {name: '0_0_1', format: 'dds'}
      ]);
    } else {
      t.equal(
        node.textureUrl,
        'https://raw.githubusercontent.com/visgl/loaders.gl/master/modules/i3s/test/data/SanFrancisco_3DObjects_1_7/SceneServer/layers/0/nodes/2/textures/0'
      );
      t.deepEqual(i3SNodePagesTiles.textureDefinitionsSelectedFormats, [
        {name: '0', format: 'jpg'}
      ]);
    }
  } else {
    t.equal(
      node.textureUrl,
      'https://raw.githubusercontent.com/visgl/loaders.gl/master/modules/i3s/test/data/SanFrancisco_3DObjects_1_7/SceneServer/layers/0/nodes/2/textures/0'
    );
    t.deepEqual(i3SNodePagesTiles.textureDefinitionsSelectedFormats, [{name: '0', format: 'jpg'}]);
  }

  t.end();
});

test('I3SNodePagesTiles#Switch off compressed textures', async t => {
  const i3SNodePagesTiles = new I3SNodePagesTiles(
    {
      ...TILESET_STUB(),
      textureSetDefinitions: [
        {
          formats: [
            {
              name: '0',
              format: 'jpg'
            },
            {
              name: '0_0_1',
              format: 'dds'
            }
          ]
        }
      ]
    },
    {i3s: {useCompressedTextures: false}}
  );
  const node = await i3SNodePagesTiles.formTileFromNodePages(2);
  t.ok(node);

  if (isBrowser) {
    const supportedFormats = getSupportedGPUTextureFormats();

    if (supportedFormats.has('dxt')) {
      t.equal(
        node.textureUrl,
        'https://raw.githubusercontent.com/visgl/loaders.gl/master/modules/i3s/test/data/SanFrancisco_3DObjects_1_7/SceneServer/layers/0/nodes/2/textures/0'
      );
      t.deepEqual(i3SNodePagesTiles.textureDefinitionsSelectedFormats, [
        {name: '0', format: 'jpg'}
      ]);
    }
  }

  t.end();
});

test('I3SNodePagesTiles#Should load DRACO geometry', async t => {
  const i3SNodePagesTiles = new I3SNodePagesTiles(TILESET_STUB(), {i3s: {useDracoGeometry: true}});
  const node1 = await i3SNodePagesTiles.formTileFromNodePages(1);
  t.ok(node1);
  t.equal(
    node1.contentUrl,
    'https://raw.githubusercontent.com/visgl/loaders.gl/master/modules/i3s/test/data/SanFrancisco_3DObjects_1_7/SceneServer/layers/0/nodes/1/geometries/1'
  );

  const tilesetJson = TILESET_STUB();
  // Remove compressed geometry metadata from geometry definitions
  tilesetJson.geometryDefinitions[0].geometryBuffers = tilesetJson.geometryDefinitions[0].geometryBuffers.slice(
    0,
    1
  );
  const i3SNodePagesTiles2 = new I3SNodePagesTiles(tilesetJson, {i3s: {useDracoGeometry: true}});
  const node12 = await i3SNodePagesTiles2.formTileFromNodePages(1);
  t.equal(
    node12.contentUrl,
    'https://raw.githubusercontent.com/visgl/loaders.gl/master/modules/i3s/test/data/SanFrancisco_3DObjects_1_7/SceneServer/layers/0/nodes/1/geometries/0'
  );

  t.end();
});
