import test from 'tape-promise/tape';
import {I3SConverter} from '@loaders.gl/tile-converter';
import {fetchFile, isBrowser} from '@loaders.gl/core';
import {promises as fs} from 'fs';

import {cleanUpPath, removeFile, isFileExists} from '../utils/file-utils';

const TILESET_URL = '@loaders.gl/3d-tiles/test/data/Batched/BatchedColors/tileset.json';
const TILESET_WITH_TEXTURES = '@loaders.gl/3d-tiles/test/data/Batched/BatchedTextured/tileset.json';
const TILESET_WITH_KTX_2_TEXTURE = '@loaders.gl/3d-tiles/test/data/VNext/agi-ktx2/tileset.json';

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

test('tile-converter - Converters#converts 3d-tiles tileset to i3s tileset', async (t) => {
  if (!isBrowser) {
    const converter = new I3SConverter();
    const tilesetJson = await converter.convert({
      inputUrl: TILESET_URL,
      outputPath: 'data',
      tilesetName: 'BatchedColors',
      slpk: false,
      inputType: '3dtiles',
      sevenZipExe: 'C:\\Program Files\\7-Zip\\7z.exe',
      egmFilePath: PGM_FILE_PATH,
      token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlYWMxMzcyYy0zZjJkLTQwODctODNlNi01MDRkZmMzMjIxOWIiLCJpZCI6OTYyMCwic2NvcGVzIjpbImFzbCIsImFzciIsImdjIl0sImlhdCI6MTU2Mjg2NjI3M30.1FNiClUyk00YH_nWfSGpiQAjR5V2OvREDq1PJ5QMjWQ'
    });
    t.ok(tilesetJson);
  }
  await cleanUpPath('data/BatchedColors');
  t.end();
});

test('tile-converter - Converters#converts 3d-tiles tileset to i3s tileset with validation', async (t) => {
  if (!isBrowser) {
    const converter = new I3SConverter();
    const tilesetJson = await converter.convert({
      inputUrl: TILESET_URL,
      outputPath: 'data',
      tilesetName: 'BatchedColors',
      slpk: true,
      inputType: '3dtiles',
      sevenZipExe: 'C:\\Program Files\\7-Zip\\7z.exe',
      egmFilePath: PGM_FILE_PATH,
      validate: true,
      token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlYWMxMzcyYy0zZjJkLTQwODctODNlNi01MDRkZmMzMjIxOWIiLCJpZCI6OTYyMCwic2NvcGVzIjpbImFzbCIsImFzciIsImdjIl0sImlhdCI6MTU2Mjg2NjI3M30.1FNiClUyk00YH_nWfSGpiQAjR5V2OvREDq1PJ5QMjWQ'
    });
    t.ok(tilesetJson);
  }
  await cleanUpPath('data/BatchedColors');
  t.end();
});

test('tile-converter - Converters#root node should not contain geometry and textures', async (t) => {
  if (!isBrowser) {
    const converter = new I3SConverter();
    await converter.convert({
      inputUrl: TILESET_URL,
      outputPath: 'data',
      tilesetName: 'BatchedColors',
      inputType: '3dtiles',
      sevenZipExe: 'C:\\Program Files\\7-Zip\\7z.exe',
      egmFilePath: PGM_FILE_PATH
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

test('tile-converter - Converters#should create SceneServer path', async (t) => {
  if (!isBrowser) {
    const converter = new I3SConverter();
    await converter.convert({
      inputUrl: TILESET_URL,
      outputPath: 'data',
      tilesetName: 'BatchedColors',
      inputType: '3dtiles',
      sevenZipExe: 'C:\\Program Files\\7-Zip\\7z.exe',
      egmFilePath: PGM_FILE_PATH
    });
    const sceneServerJson = await fs.readFile('data/BatchedColors/SceneServer/index.json', 'utf8');
    const sceneServer = JSON.parse(sceneServerJson);
    t.ok(sceneServer.layers[0]);
    t.equal(sceneServer.serviceVersion, '1.8');
  }
  await cleanUpPath('data/BatchedColors');
  t.end();
});

test('tile-converter - Converters#should create sharedResources json file', async (t) => {
  if (!isBrowser) {
    const converter = new I3SConverter();
    await converter.convert({
      inputUrl: TILESET_WITH_TEXTURES,
      outputPath: 'data',
      tilesetName: 'BatchedTextured',
      inputType: '3dtiles',
      sevenZipExe: 'C:\\Program Files\\7-Zip\\7z.exe',
      egmFilePath: PGM_FILE_PATH
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

test('tile-converter - Converters#should generate KTX2 texture', async (t) => {
  if (!isBrowser) {
    const EXPECTED_TEXTURE_SET_DEFINITIONS = [
      {
        formats: [
          {name: '0', format: 'jpg'},
          {name: '1', format: 'ktx2'}
        ]
      }
    ];

    const converter = new I3SConverter();
    await converter.convert({
      inputUrl: TILESET_WITH_TEXTURES,
      outputPath: 'data',
      tilesetName: 'BatchedTextured',
      inputType: '3dtiles',
      generateTextures: true,
      sevenZipExe: 'C:\\Program Files\\7-Zip\\7z.exe',
      egmFilePath: PGM_FILE_PATH
    });
    const sharedResourcesJson = await fs.readFile(
      'data/BatchedTextured/SceneServer/layers/0/index.json',
      'utf8'
    );
    const ktx2Texture = await fs.stat(
      'data/BatchedTextured/SceneServer/layers/0/nodes/1/textures/1/index.ktx2'
    );
    const tileset0 = JSON.parse(sharedResourcesJson);
    t.ok(ktx2Texture, 'ktx2 texture exists!');
    t.ok(tileset0.textureSetDefinitions);
    t.deepEqual(tileset0.textureSetDefinitions, EXPECTED_TEXTURE_SET_DEFINITIONS);
  }
  await cleanUpPath('data/BatchedTextured');
  t.end();
});

test('tile-converter - Converters#Should not generate JPG texture if only KTX2 is provided and generateTextures = false', async (t) => {
  if (!isBrowser) {
    const EXPECTED_TEXTURE_SET_DEFINITIONS = [
      {
        formats: [{name: '1', format: 'ktx2'}]
      }
    ];

    const converter = new I3SConverter();
    await converter.convert({
      inputUrl: TILESET_WITH_KTX_2_TEXTURE,
      outputPath: 'data',
      tilesetName: 'ktx2_only',
      inputType: '3dtiles',
      generateTextures: false,
      sevenZipExe: 'C:\\Program Files\\7-Zip\\7z.exe',
      egmFilePath: PGM_FILE_PATH
    });
    const sharedResourcesJson = await fs.readFile(
      'data/ktx2_only/SceneServer/layers/0/index.json',
      'utf8'
    );

    const ktx2Texture = await fs.stat(
      'data/ktx2_only/SceneServer/layers/0/nodes/1/textures/1/index.ktx2'
    );
    const tileset0 = JSON.parse(sharedResourcesJson);
    t.ok(ktx2Texture, 'ktx2 texture exists!');
    t.ok(tileset0.textureSetDefinitions);
    t.deepEqual(tileset0.textureSetDefinitions, EXPECTED_TEXTURE_SET_DEFINITIONS);
  }
  await cleanUpPath('data/ktx2_only');
  t.end();
});

test('tile-converter - Converters#Should generate JPG texture if only KTX2 is provided and generateTextures = true', async (t) => {
  if (!isBrowser) {
    const EXPECTED_TEXTURE_SET_DEFINITIONS = [
      {
        formats: [
          {name: '1', format: 'ktx2'},
          {name: '0', format: 'jpg'}
        ]
      }
    ];

    const converter = new I3SConverter();
    await converter.convert({
      inputUrl: TILESET_WITH_KTX_2_TEXTURE,
      outputPath: 'data',
      tilesetName: 'jpg_and_ktx2',
      inputType: '3dtiles',
      generateTextures: true,
      sevenZipExe: 'C:\\Program Files\\7-Zip\\7z.exe',
      egmFilePath: PGM_FILE_PATH
    });
    const sharedResourcesJson = await fs.readFile(
      'data/jpg_and_ktx2/SceneServer/layers/0/index.json',
      'utf8'
    );

    const ktx2Texture = await fs.stat(
      'data/jpg_and_ktx2/SceneServer/layers/0/nodes/1/textures/1/index.ktx2'
    );
    const tileset0 = JSON.parse(sharedResourcesJson);
    t.ok(ktx2Texture, 'ktx2 texture exists!');
    t.ok(tileset0.textureSetDefinitions);
    t.deepEqual(tileset0.textureSetDefinitions, EXPECTED_TEXTURE_SET_DEFINITIONS);
  }
  await cleanUpPath('data/jpg_and_ktx2');
  t.end();
});

test('tile-converter - Converters#should create only unique materials', async (t) => {
  if (!isBrowser) {
    const converter = new I3SConverter();
    await converter.convert({
      inputUrl: TILESET_WITH_TEXTURES,
      outputPath: 'data',
      tilesetName: 'BatchedTextured',
      inputType: '3dtiles',
      sevenZipExe: 'C:\\Program Files\\7-Zip\\7z.exe',
      egmFilePath: PGM_FILE_PATH
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

test('tile-converter - Converters#converts 3d-tiles tileset to i3s tileset with bounding volume creation from geometry', async (t) => {
  if (!isBrowser) {
    const converter = new I3SConverter();
    const tilesetJson = await converter.convert({
      inputUrl: TILESET_URL,
      outputPath: 'data',
      tilesetName: 'BatchedColors',
      generateBoundingVolumes: true,
      slpk: false,
      inputType: '3dtiles',
      sevenZipExe: 'C:\\Program Files\\7-Zip\\7z.exe',
      egmFilePath: PGM_FILE_PATH,
      token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlYWMxMzcyYy0zZjJkLTQwODctODNlNi01MDRkZmMzMjIxOWIiLCJpZCI6OTYyMCwic2NvcGVzIjpbImFzbCIsImFzciIsImdjIl0sImlhdCI6MTU2Mjg2NjI3M30.1FNiClUyk00YH_nWfSGpiQAjR5V2OvREDq1PJ5QMjWQ'
    });
    t.ok(tilesetJson);
  }
  await cleanUpPath('data/BatchedColors');
  t.end();
});

test('tile-converter - Converters#create performance log if option is set', async (t) => {
  if (!isBrowser) {
    const tilesetName = 'BatchedColors';
    const converter = new I3SConverter();
    await converter.convert({
      inputUrl: TILESET_URL,
      outputPath: 'data',
      tilesetName,
      slpk: false,
      inputType: '3dtiles',
      performance: true,
      sevenZipExe: 'C:\\Program Files\\7-Zip\\7z.exe',
      egmFilePath: PGM_FILE_PATH,
      token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlYWMxMzcyYy0zZjJkLTQwODctODNlNi01MDRkZmMzMjIxOWIiLCJpZCI6OTYyMCwic2NvcGVzIjpbImFzbCIsImFzciIsImdjIl0sImlhdCI6MTU2Mjg2NjI3M30.1FNiClUyk00YH_nWfSGpiQAjR5V2OvREDq1PJ5QMjWQ'
    });
    t.ok(await isFileExists(`${tilesetName}.perf-log.json`));

    const perfLog = await fetchFile(`${tilesetName}.perf-log.json`);
    const perfLogEntry = (await perfLog.json())[0];
    t.ok(perfLogEntry);
    t.ok(perfLogEntry.name.includes('Load Tile Content - '));
    t.ok(
      perfLogEntry.name.includes(
        'modules/3d-tiles/test/data/Batched/BatchedColors/batchedColors.b3dm'
      )
    );
    t.equals(perfLogEntry.entryType, 'measure');
    t.ok(perfLogEntry.startTime);
    t.ok(perfLogEntry.duration);

    await cleanUpPath('data/BatchedColors');
    removeFile(`${tilesetName}.perf-log.json`);

    await converter.convert({
      inputUrl: TILESET_URL,
      outputPath: 'data',
      tilesetName,
      slpk: false,
      inputType: '3dtiles',
      performance: false,
      sevenZipExe: 'C:\\Program Files\\7-Zip\\7z.exe',
      egmFilePath: PGM_FILE_PATH,
      token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlYWMxMzcyYy0zZjJkLTQwODctODNlNi01MDRkZmMzMjIxOWIiLCJpZCI6OTYyMCwic2NvcGVzIjpbImFzbCIsImFzciIsImdjIl0sImlhdCI6MTU2Mjg2NjI3M30.1FNiClUyk00YH_nWfSGpiQAjR5V2OvREDq1PJ5QMjWQ'
    });
    t.notOk(await isFileExists(`${tilesetName}.perf-log.json`));

    await cleanUpPath('data/BatchedColors');
    removeFile(`${tilesetName}.perf-log.json`);

    await converter.convert({
      inputUrl: TILESET_URL,
      outputPath: 'data',
      tilesetName,
      slpk: false,
      inputType: '3dtiles',
      sevenZipExe: 'C:\\Program Files\\7-Zip\\7z.exe',
      egmFilePath: PGM_FILE_PATH,
      token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlYWMxMzcyYy0zZjJkLTQwODctODNlNi01MDRkZmMzMjIxOWIiLCJpZCI6OTYyMCwic2NvcGVzIjpbImFzbCIsImFzciIsImdjIl0sImlhdCI6MTU2Mjg2NjI3M30.1FNiClUyk00YH_nWfSGpiQAjR5V2OvREDq1PJ5QMjWQ'
    });
    t.notOk(await isFileExists(`${tilesetName}.perf-log.json`));

    await cleanUpPath('data/BatchedColors');
    removeFile(`${tilesetName}.perf-log.json`);
  }
  t.end();
});
