import test from 'tape-promise/tape';
import {I3SConverter} from '@loaders.gl/tile-converter';
import {isBrowser, setLoaderOptions} from '@loaders.gl/core';

import {cleanUpPath} from '../utils/file-utils';
import {BROWSER_ERROR_MESSAGE} from '../../src/constants';
import {parseSLPKArchive} from '@loaders.gl/i3s';
import {FileHandleFile} from '@loaders.gl/loader-utils';

const TILESET_URL = '@loaders.gl/3d-tiles/test/data/CesiumJS/Batched/BatchedColors/tileset.json';
const TILESET_WITH_TEXTURES =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/Batched/BatchedTextured/tileset.json';
const TILESET_WITH_KTX_2_TEXTURE =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/VNext/agi-ktx2/tileset.json';
const TILESET_WITH_FAILING_CONTENT =
  '@loaders.gl/tile-converter/test/data/failing-content-error/tileset.json';
const TILESET_CDB_YEMEN =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/VNext/cdb-yemen-cut/tileset.json';
const TILESET_3TZ = './modules/3d-tiles/test/data/test.3tz';

const PGM_FILE_PATH = '@loaders.gl/tile-converter/test/data/egm84-30.pgm';

const TEST_TEXTURE_MATERIAL = {
  doubleSided: false,
  emissiveFactor: [0, 0, 0],
  alphaMode: 'opaque',
  pbrMetallicRoughness: {
    roughnessFactor: 1,
    metallicFactor: 1,
    baseColorTexture: {
      textureSetDefinitionId: 0
    }
  }
};

const TEST_FULL_EXTENT = {
  xmin: -75.61412210800641,
  ymin: 40.040956941636935,
  xmax: -75.61006638801986,
  ymax: 40.04410424800317,
  zmin: 0,
  zmax: 20
};

setLoaderOptions({
  _worker: 'test'
});

test('tile-converter(i3s)#converts 3d-tiles tileset to i3s tileset', async (t) => {
  const converter = new I3SConverter();
  const tilesetJson = await converter.convert({
    inputUrl: TILESET_URL,
    outputPath: 'data',
    tilesetName: 'BatchedColors',
    egmFilePath: PGM_FILE_PATH
  });
  if (!isBrowser) {
    t.ok(tilesetJson);
    await cleanUpPath('data/BatchedColors');
  } else {
    t.equals(tilesetJson, BROWSER_ERROR_MESSAGE);
  }
  t.end();
});

test('tile-converter(i3s)#should create Draco compressed geometry', async (t) => {
  if (!isBrowser) {
    const converter = new I3SConverter();
    const tilesetJson = await converter.convert({
      inputUrl: TILESET_URL,
      outputPath: 'data',
      tilesetName: 'BatchedColors',
      draco: true,
      egmFilePath: PGM_FILE_PATH
    });
    t.ok(tilesetJson);
  }
  await cleanUpPath('data/BatchedColors');
  t.end();
});

test('tile-converter(i3s)#converts 3d-tiles tileset to i3s tileset with validation', async (t) => {
  if (!isBrowser) {
    const converter = new I3SConverter();
    const tilesetJson = await converter.convert({
      inputUrl: TILESET_URL,
      outputPath: 'data',
      tilesetName: 'BatchedColors',
      egmFilePath: PGM_FILE_PATH,
      validate: true
    });
    t.ok(tilesetJson);
  }
  await cleanUpPath('data/BatchedColors');
  t.end();
});

test('tile-converter(i3s)#root node should not contain geometry and textures', async (t) => {
  if (!isBrowser) {
    const converter = new I3SConverter();
    await converter.convert({
      inputUrl: TILESET_URL,
      outputPath: 'data',
      tilesetName: 'BatchedColors',
      egmFilePath: PGM_FILE_PATH
    });

    const archive = await parseSLPKArchive(new FileHandleFile('data/BatchedColors.slpk'));
    const rootTileJson = new TextDecoder().decode(await archive.getFile('nodes/root', 'http'));
    const rootTile = JSON.parse(rootTileJson);
    t.notOk(rootTile.geometryData);
    t.notOk(rootTile.textureData);
  }
  await cleanUpPath('data/BatchedColors');
  t.end();
});

test('tile-converter(i3s)#should create sharedResources json file', async (t) => {
  if (!isBrowser) {
    const converter = new I3SConverter();
    await converter.convert({
      inputUrl: TILESET_WITH_TEXTURES,
      outputPath: 'data',
      tilesetName: 'BatchedTextured',
      egmFilePath: PGM_FILE_PATH
    });
    const archive = await parseSLPKArchive(new FileHandleFile('data/BatchedTextured.slpk'));
    const rootTileJson = new TextDecoder().decode(await archive.getFile('nodes/1/shared', 'http'));
    const sharedResources = JSON.parse(rootTileJson);
    t.ok(sharedResources.materialDefinitions);
    t.ok(sharedResources.textureDefinitions);
  }
  await cleanUpPath('data/BatchedTextured');
  t.end();
});

test('tile-converter(i3s)#should generate KTX2 texture', async (t) => {
  if (!isBrowser) {
    const EXPECTED_TEXTURE_SET_DEFINITIONS = [
      {
        formats: [
          {name: '0', format: 'jpg'},
          {name: '1', format: 'ktx2'}
        ]
      },
      {
        formats: [
          {name: '0', format: 'jpg'},
          {name: '1', format: 'ktx2'}
        ],
        atlas: true
      }
    ];

    const converter = new I3SConverter();
    await converter.convert({
      inputUrl: TILESET_WITH_TEXTURES,
      outputPath: 'data',
      tilesetName: 'BatchedTextured',
      generateTextures: true,
      egmFilePath: PGM_FILE_PATH
    });
    const archive = await parseSLPKArchive(new FileHandleFile('data/BatchedTextured.slpk'));
    const sharedResourcesJson = new TextDecoder().decode(await archive.getFile('', 'http'));
    const ktx2Texture = new TextDecoder().decode(
      await archive.getFile('nodes/1/textures/1', 'http')
    );
    const tileset0 = JSON.parse(sharedResourcesJson);
    t.ok(ktx2Texture, 'ktx2 texture exists!');
    t.ok(tileset0.textureSetDefinitions);
    t.deepEqual(tileset0.textureSetDefinitions, EXPECTED_TEXTURE_SET_DEFINITIONS);
  }
  await cleanUpPath('data/BatchedTextured');
  t.end();
});

test('tile-converter(i3s)#Should not generate JPG texture if only KTX2 is provided and generateTextures = false', async (t) => {
  if (!isBrowser) {
    const EXPECTED_TEXTURE_SET_DEFINITIONS = [
      {formats: [{name: '1', format: 'ktx2'}]},
      {formats: [{name: '1', format: 'ktx2'}], atlas: true}
    ];

    const converter = new I3SConverter();
    await converter.convert({
      inputUrl: TILESET_WITH_KTX_2_TEXTURE,
      outputPath: 'data',
      tilesetName: 'ktx2_only',
      generateTextures: false,
      egmFilePath: PGM_FILE_PATH
    });
    const archive = await parseSLPKArchive(new FileHandleFile('data/ktx2_only.slpk'));
    const sharedResourcesJson = new TextDecoder().decode(await archive.getFile('', 'http'));
    const ktx2Texture = new TextDecoder().decode(
      await archive.getFile('nodes/1/textures/1', 'http')
    );
    const tileset0 = JSON.parse(sharedResourcesJson);
    t.ok(ktx2Texture, 'ktx2 texture exists!');
    t.ok(tileset0.textureSetDefinitions);
    t.deepEqual(tileset0.textureSetDefinitions, EXPECTED_TEXTURE_SET_DEFINITIONS);
  }
  await cleanUpPath('data/ktx2_only');
  t.end();
});

test('tile-converter(i3s)#Should generate JPG texture if only KTX2 is provided and generateTextures = true', async (t) => {
  if (!isBrowser) {
    const EXPECTED_TEXTURE_SET_DEFINITIONS = [
      {
        formats: [
          {name: '1', format: 'ktx2'},
          {name: '0', format: 'jpg'}
        ]
      },
      {
        formats: [
          {name: '1', format: 'ktx2'},
          {name: '0', format: 'jpg'}
        ],
        atlas: true
      }
    ];

    const converter = new I3SConverter();
    await converter.convert({
      inputUrl: TILESET_WITH_KTX_2_TEXTURE,
      outputPath: 'data',
      tilesetName: 'jpg_and_ktx2',
      generateTextures: true,
      egmFilePath: PGM_FILE_PATH
    });
    const archive = await parseSLPKArchive(new FileHandleFile('data/jpg_and_ktx2.slpk'));
    const sharedResourcesJson = new TextDecoder().decode(await archive.getFile('', 'http'));
    const ktx2Texture = new TextDecoder().decode(
      await archive.getFile('nodes/1/textures/1', 'http')
    );
    const tileset0 = JSON.parse(sharedResourcesJson);
    t.ok(ktx2Texture, 'ktx2 texture exists!');
    t.ok(tileset0.textureSetDefinitions);
    t.deepEqual(tileset0.textureSetDefinitions, EXPECTED_TEXTURE_SET_DEFINITIONS);
  }
  await cleanUpPath('data/jpg_and_ktx2');
  t.end();
});

test('tile-converter(i3s)#should create only unique materials', async (t) => {
  if (!isBrowser) {
    const converter = new I3SConverter();
    await converter.convert({
      inputUrl: TILESET_WITH_TEXTURES,
      outputPath: 'data',
      tilesetName: 'BatchedTextured',
      egmFilePath: PGM_FILE_PATH
    });
    const archive = await parseSLPKArchive(new FileHandleFile('data/BatchedTextured.slpk'));
    const layerJson = new TextDecoder().decode(await archive.getFile('', 'http'));
    const layer = JSON.parse(layerJson);
    t.ok(layer.materialDefinitions);
    t.equal(layer.materialDefinitions.length, 1);
    t.deepEqual(layer.materialDefinitions[0], TEST_TEXTURE_MATERIAL);
  }
  await cleanUpPath('data/BatchedTextured');
  t.end();
});

test('tile-converter(i3s)#converts 3d-tiles tileset to i3s tileset with bounding volume creation from geometry', async (t) => {
  if (!isBrowser) {
    const converter = new I3SConverter();
    const tilesetJson = await converter.convert({
      inputUrl: TILESET_URL,
      outputPath: 'data',
      tilesetName: 'BatchedColors',
      generateBoundingVolumes: true,
      egmFilePath: PGM_FILE_PATH
    });
    t.ok(tilesetJson);
  }
  await cleanUpPath('data/BatchedColors');
  t.end();
});

test('tile-converter(i3s)#layer json should contain fullExtent field', async (t) => {
  if (!isBrowser) {
    const converter = new I3SConverter();
    await converter.convert({
      inputUrl: TILESET_WITH_TEXTURES,
      outputPath: 'data',
      tilesetName: 'BatchedTextured',
      egmFilePath: PGM_FILE_PATH
    });
    const archive = await parseSLPKArchive(new FileHandleFile('data/BatchedTextured.slpk'));
    const layerJson = new TextDecoder().decode(await archive.getFile('', 'http'));

    const layer = JSON.parse(layerJson);
    t.ok(layer.fullExtent);
    for (const key in layer.fullExtent) {
      t.equal(layer.fullExtent[key], TEST_FULL_EXTENT[key]);
    }
  }
  await cleanUpPath('data/BatchedTextured');
  t.end();
});

test('tile-converter(i3s)#proceed with failing content', async (t) => {
  if (!isBrowser) {
    const converter = new I3SConverter();
    await converter.convert({
      inputUrl: TILESET_WITH_FAILING_CONTENT,
      outputPath: 'data',
      tilesetName: 'FailingContent',
      egmFilePath: PGM_FILE_PATH
    });
    const archive = await parseSLPKArchive(new FileHandleFile('data/FailingContent.slpk'));
    const layerJson = new TextDecoder().decode(await archive.getFile('nodepages/0', 'http'));
    const nodePage = JSON.parse(layerJson);
    t.ok(nodePage.nodes[1].mesh);
    t.notOk(nodePage.nodes[2].mesh);
    t.notOk(nodePage.nodes[3].mesh);
    t.notOk(nodePage.nodes[4].mesh);
    t.notOk(nodePage.nodes[5].mesh);
  }
  await cleanUpPath('data/FailingContent');
  t.end();
});

test('tile-converter(i3s)#convert with --metadata-class option', async (t) => {
  if (!isBrowser) {
    const converter = new I3SConverter();
    await converter.convert({
      inputUrl: TILESET_CDB_YEMEN,
      outputPath: 'data',
      tilesetName: 'CDB_Yemen',
      egmFilePath: PGM_FILE_PATH,
      metadataClass: 'CDBMaterialsClass'
    });
    const archive = await parseSLPKArchive(new FileHandleFile('data/CDB_Yemen.slpk'));
    const nodePageJson = new TextDecoder().decode(await archive.getFile('nodepages/0', 'http'));
    t.ok(nodePageJson);
  }
  await cleanUpPath('data/CDB_Yemen');
  t.end();
});

test('tile-converter(i3s)#convert 3tz arhive', async (t) => {
  if (!isBrowser) {
    const converter = new I3SConverter();
    await converter.convert({
      inputUrl: TILESET_3TZ,
      outputPath: 'data',
      tilesetName: '3tz-test',
      egmFilePath: PGM_FILE_PATH
    });
    const archive = await parseSLPKArchive(new FileHandleFile('data/3tz-test.slpk'));
    const nodePageJson = new TextDecoder().decode(await archive.getFile('nodepages/0', 'http'));
    t.ok(nodePageJson);
  }
  await cleanUpPath('data/3tz-test');
  t.end();
});
