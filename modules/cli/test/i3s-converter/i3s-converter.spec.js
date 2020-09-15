import test from 'tape-promise/tape';
import {I3SConverter} from '@loaders.gl/cli';
import {isBrowser} from '@loaders.gl/core';
import {promises as fs} from 'fs';

const TILESET_URL = '@loaders.gl/3d-tiles/test/data/Batched/BatchedColors/tileset.json';
const TILESET_WITH_TEXTURES = '@loaders.gl/3d-tiles/test/data/Batched/BatchedTextured/tileset.json';

const TEST_TEXTURE_MATERIAL = {
  doubleSided: false,
  emissiveFactor: [0, 0, 0],
  alphaMode: 'OPAQUE',
  pbrMetallicRoughness: {
    roughnessFactor: 1,
    metallicFactor: 0,
    baseColorTexture: {
      textureSetDefinitionId: 0
    }
  }
};

async function cleanUpPath(testPath) {
  // Do not run under browser
  if (!isBrowser) {
    try {
      await fs.rmdir(testPath, {recursive: true});
    } catch (e) {
      // Do nothing
    }
    try {
      await fs.unlink(`${testPath}.slpk`);
    } catch (e) {
      // Do nothing
    }
  }
}

test('cli - Converters#converts 3d-tiles tileset to i3s tileset', async t => {
  if (!isBrowser) {
    const converter = new I3SConverter();
    const tilesetJson = await converter.convert({
      inputUrl: TILESET_URL,
      outputPath: 'data',
      tilesetName: 'BatchedColors',
      slpk: true
    });
    t.ok(tilesetJson);
  }
  await cleanUpPath('data/BatchedColors');
  t.end();
});

test('cli - Converters#root node should not contain geometry and textures', async t => {
  if (!isBrowser) {
    const converter = new I3SConverter();
    await converter.convert({
      inputUrl: TILESET_URL,
      outputPath: 'data',
      tilesetName: 'BatchedColors'
    });

    // Read the converted tileset json
    const rootTileJson = await fs.readFile(
      'data/BatchedColors/SceneServer/layers/0/nodes/root/index.json',
      'utf8'
    );
    const rootTile = JSON.parse(rootTileJson);
    t.notOk(rootTile.geometryData);
    t.notOk(rootTile.textureData);
  }
  await cleanUpPath('data/BatchedColors');
  t.end();
});

test('cli - Converters#should create SceneServer path', async t => {
  if (!isBrowser) {
    const converter = new I3SConverter();
    await converter.convert({
      inputUrl: TILESET_URL,
      outputPath: 'data',
      tilesetName: 'BatchedColors'
    });
    const sceneServerJson = await fs.readFile('data/BatchedColors/SceneServer/index.json', 'utf8');
    const sceneServer = JSON.parse(sceneServerJson);
    t.ok(sceneServer.layers[0]);
    t.equal(sceneServer.serviceVersion, '1.7');
  }
  await cleanUpPath('data/BatchedColors');
  t.end();
});

test('cli - Converters#should create sharedResources json file', async t => {
  if (!isBrowser) {
    const converter = new I3SConverter();
    await converter.convert({
      inputUrl: TILESET_WITH_TEXTURES,
      outputPath: 'data',
      tilesetName: 'BatchedTextured'
    });
    const sharedResourcesJson = await fs.readFile(
      'data/BatchedTextured/SceneServer/layers/0/nodes/1/shared/index.json',
      'utf8'
    );
    const sharedResources = JSON.parse(sharedResourcesJson);
    t.ok(sharedResources.materialDefinitions);
    t.ok(sharedResources.textureDefinitions);
  }
  await cleanUpPath('data/BatchedTextured');
  t.end();
});

test('cli - Converters#should create only unique materials', async t => {
  if (!isBrowser) {
    const converter = new I3SConverter();
    await converter.convert({
      inputUrl: TILESET_WITH_TEXTURES,
      outputPath: 'data',
      tilesetName: 'BatchedTextured'
    });
    const layerJson = await fs.readFile(
      'data/BatchedTextured/SceneServer/layers/0/index.json',
      'utf8'
    );
    const layer = JSON.parse(layerJson);
    t.ok(layer.materialDefinitions);
    t.equal(layer.materialDefinitions.length, 1);
    t.deepEqual(layer.materialDefinitions[0], TEST_TEXTURE_MATERIAL);
  }
  await cleanUpPath('data/BatchedTextured');
  t.end();
});
