import {expect, test} from 'vitest';
import {default as I3SConverter} from '../../src/i3s-converter/i3s-converter';
import {isBrowser, setLoaderOptions} from '@loaders.gl/core';
import {cleanUpPath} from '../utils/file-utils';
import {BROWSER_ERROR_MESSAGE} from '../../src/constants';
import {parseSLPKArchive} from '@loaders.gl/i3s';
import {NodeFile} from '@loaders.gl/loader-utils';
import {getBinaryImageMetadata} from '@loaders.gl/images';
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
    metallicFactor: 0,
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
test('tile-converter(i3s)#converts 3d-tiles tileset to i3s tileset', async () => {
  const converter = new I3SConverter();
  const tilesetJson = await converter.convert({
    inputUrl: TILESET_URL,
    outputPath: 'data',
    tilesetName: 'BatchedColors',
    egmFilePath: PGM_FILE_PATH
  });
  if (!isBrowser) {
    expect(tilesetJson).toBeTruthy();
    await cleanUpPath('data/BatchedColors');
  } else {
    expect(tilesetJson).toBe(BROWSER_ERROR_MESSAGE);
  }
});
test('tile-converter(i3s)#should create Draco compressed geometry', async () => {
  if (!isBrowser) {
    const converter = new I3SConverter();
    const tilesetJson = await converter.convert({
      inputUrl: TILESET_URL,
      outputPath: 'data',
      tilesetName: 'BatchedColors',
      draco: true,
      egmFilePath: PGM_FILE_PATH
    });
    expect(tilesetJson).toBeTruthy();
  }
  await cleanUpPath('data/BatchedColors');
});
test('tile-converter(i3s)#converts 3d-tiles tileset to i3s tileset with validation', async () => {
  if (!isBrowser) {
    const converter = new I3SConverter();
    const tilesetJson = await converter.convert({
      inputUrl: TILESET_URL,
      outputPath: 'data',
      tilesetName: 'BatchedColors',
      egmFilePath: PGM_FILE_PATH,
      validate: true
    });
    expect(tilesetJson).toBeTruthy();
  }
  await cleanUpPath('data/BatchedColors');
});
test('tile-converter(i3s)#root node should not contain geometry and textures', async () => {
  if (!isBrowser) {
    const converter = new I3SConverter();
    await converter.convert({
      inputUrl: TILESET_URL,
      outputPath: 'data',
      tilesetName: 'BatchedColors',
      egmFilePath: PGM_FILE_PATH
    });
    const archive = await parseSLPKArchive(new NodeFile('data/BatchedColors.slpk'));
    const rootTileJson = new TextDecoder().decode(await archive.getFile('nodes/root', 'http'));
    const rootTile = JSON.parse(rootTileJson);
    expect(rootTile.geometryData).toBeFalsy();
    expect(rootTile.textureData).toBeFalsy();
  }
  await cleanUpPath('data/BatchedColors');
});
test('tile-converter(i3s)#should create sharedResources json file', async () => {
  if (!isBrowser) {
    const converter = new I3SConverter();
    await converter.convert({
      inputUrl: TILESET_WITH_TEXTURES,
      outputPath: 'data',
      tilesetName: 'BatchedTextured',
      egmFilePath: PGM_FILE_PATH
    });
    const archive = await parseSLPKArchive(new NodeFile('data/BatchedTextured.slpk'));
    const rootTileJson = new TextDecoder().decode(await archive.getFile('nodes/1/shared', 'http'));
    const sharedResources = JSON.parse(rootTileJson);
    expect(sharedResources.materialDefinitions).toBeTruthy();
    expect(sharedResources.textureDefinitions).toBeTruthy();
  }
  await cleanUpPath('data/BatchedTextured');
});
test.each([
  {
    name: 'generates KTX2 from JPEG',
    inputUrl: TILESET_WITH_TEXTURES,
    tilesetName: 'generated_ktx2',
    generateTextures: true,
    formats: [
      {name: '0', format: 'jpg'},
      {name: '1', format: 'ktx2'}
    ]
  },
  {
    name: 'preserves KTX2 without generating JPEG',
    inputUrl: TILESET_WITH_KTX_2_TEXTURE,
    tilesetName: 'ktx2_only',
    generateTextures: false,
    formats: [{name: '1', format: 'ktx2'}]
  },
  {
    name: 'generates JPEG from KTX2',
    inputUrl: TILESET_WITH_KTX_2_TEXTURE,
    tilesetName: 'jpg_and_ktx2',
    generateTextures: true,
    formats: [
      {name: '1', format: 'ktx2'},
      {name: '0', format: 'jpg'}
    ]
  }
])('tile-converter(i3s)#$name', async ({inputUrl, tilesetName, generateTextures, formats}) => {
  const outputPath = `data/${tilesetName}`;
  await cleanUpPath(outputPath);
  let archiveFile: NodeFile | undefined;
  try {
    const converter = new I3SConverter();
    await converter.convert({
      inputUrl,
      outputPath: 'data',
      tilesetName,
      generateTextures,
      egmFilePath: PGM_FILE_PATH
    });
    archiveFile = new NodeFile(`${outputPath}.slpk`);
    const archive = await parseSLPKArchive(archiveFile);
    const layer = JSON.parse(new TextDecoder().decode(await archive.getFile('', 'http')));
    const ktx2Texture = await archive.getFile('nodes/1/textures/1', 'http');
    expect(new Uint8Array(ktx2Texture, 0, 12)).toEqual(
      new Uint8Array([0xab, 0x4b, 0x54, 0x58, 0x20, 0x32, 0x30, 0xbb, 0x0d, 0x0a, 0x1a, 0x0a])
    );
    const ktx2Header = new DataView(ktx2Texture);
    const width = ktx2Header.getUint32(20, true);
    const height = ktx2Header.getUint32(24, true);
    expect(width).toBeGreaterThan(0);
    expect(height).toBeGreaterThan(0);
    expect(layer.textureSetDefinitions).toEqual([{formats}, {formats, atlas: true}]);
    if (formats.some(({format}) => format === 'jpg')) {
      const jpegTexture = await archive.getFile('nodes/1/textures/0', 'http');
      expect(getBinaryImageMetadata(jpegTexture)).toEqual({mimeType: 'image/jpeg', width, height});
    } else {
      await expect(archive.getFile('nodes/1/textures/0', 'http')).rejects.toThrow(
        'No such file in the archive'
      );
    }
  } finally {
    await archiveFile?.close();
    await cleanUpPath(outputPath);
  }
});
test('tile-converter(i3s)#should create only unique materials', async () => {
  if (!isBrowser) {
    const converter = new I3SConverter();
    await converter.convert({
      inputUrl: TILESET_WITH_TEXTURES,
      outputPath: 'data',
      tilesetName: 'BatchedTextured',
      egmFilePath: PGM_FILE_PATH
    });
    const archive = await parseSLPKArchive(new NodeFile('data/BatchedTextured.slpk'));
    const layerJson = new TextDecoder().decode(await archive.getFile('', 'http'));
    const layer = JSON.parse(layerJson);
    expect(layer.materialDefinitions).toBeTruthy();
    expect(layer.materialDefinitions.length).toBe(1);
    expect(layer.materialDefinitions[0]).toEqual(TEST_TEXTURE_MATERIAL);
  }
  await cleanUpPath('data/BatchedTextured');
});
test('tile-converter(i3s)#converts 3d-tiles tileset to i3s tileset with bounding volume creation from geometry', async () => {
  if (!isBrowser) {
    const converter = new I3SConverter();
    const tilesetJson = await converter.convert({
      inputUrl: TILESET_URL,
      outputPath: 'data',
      tilesetName: 'BatchedColors',
      generateBoundingVolumes: true,
      egmFilePath: PGM_FILE_PATH
    });
    expect(tilesetJson).toBeTruthy();
  }
  await cleanUpPath('data/BatchedColors');
});
test('tile-converter(i3s)#layer json should contain fullExtent field', async () => {
  if (!isBrowser) {
    const converter = new I3SConverter();
    await converter.convert({
      inputUrl: TILESET_WITH_TEXTURES,
      outputPath: 'data',
      tilesetName: 'BatchedTextured',
      egmFilePath: PGM_FILE_PATH
    });
    const archive = await parseSLPKArchive(new NodeFile('data/BatchedTextured.slpk'));
    const layerJson = new TextDecoder().decode(await archive.getFile('', 'http'));
    const layer = JSON.parse(layerJson);
    expect(layer.fullExtent).toBeTruthy();
    for (const key in layer.fullExtent) {
      expect(layer.fullExtent[key]).toBeCloseTo(TEST_FULL_EXTENT[key], 6);
    }
  }
  await cleanUpPath('data/BatchedTextured');
});
test('tile-converter(i3s)#proceed with failing content', async () => {
  if (!isBrowser) {
    const converter = new I3SConverter();
    await converter.convert({
      inputUrl: TILESET_WITH_FAILING_CONTENT,
      outputPath: 'data',
      tilesetName: 'FailingContent',
      egmFilePath: PGM_FILE_PATH
    });
    const archive = await parseSLPKArchive(new NodeFile('data/FailingContent.slpk'));
    const layerJson = new TextDecoder().decode(await archive.getFile('nodepages/0', 'http'));
    const nodePage = JSON.parse(layerJson);
    expect(nodePage.nodes[1].mesh).toBeTruthy();
    expect(nodePage.nodes[2].mesh).toBeFalsy();
    expect(nodePage.nodes[3].mesh).toBeFalsy();
    expect(nodePage.nodes[4].mesh).toBeFalsy();
    expect(nodePage.nodes[5].mesh).toBeFalsy();
  }
  await cleanUpPath('data/FailingContent');
});
test('tile-converter(i3s)#convert with --metadata-class option', async () => {
  if (!isBrowser) {
    const converter = new I3SConverter();
    await converter.convert({
      inputUrl: TILESET_CDB_YEMEN,
      outputPath: 'data',
      tilesetName: 'CDB_Yemen',
      egmFilePath: PGM_FILE_PATH,
      metadataClass: 'CDBMaterialsClass'
    });
    const archive = await parseSLPKArchive(new NodeFile('data/CDB_Yemen.slpk'));
    const nodePageJson = new TextDecoder().decode(await archive.getFile('nodepages/0', 'http'));
    expect(nodePageJson).toBeTruthy();
  }
  await cleanUpPath('data/CDB_Yemen');
});
test('tile-converter(i3s)#convert 3tz arhive', async () => {
  if (!isBrowser) {
    const converter = new I3SConverter();
    await converter.convert({
      inputUrl: TILESET_3TZ,
      outputPath: 'data',
      tilesetName: '3tz-test',
      egmFilePath: PGM_FILE_PATH
    });
    const archive = await parseSLPKArchive(new NodeFile('data/3tz-test.slpk'));
    const nodePageJson = new TextDecoder().decode(await archive.getFile('nodepages/0', 'http'));
    expect(nodePageJson).toBeTruthy();
  }
  await cleanUpPath('data/3tz-test');
});
