import {expect, test} from 'vitest';
import {
  ConversionDump,
  ConversionDumpOptions,
  TextureSetDefinition
} from '../../../src/lib/utils/conversion-dump';
import {join} from 'path';
import {isFileExists, openJson} from '../../../src/lib/utils/file-utils';
import {DUMP_FILE_SUFFIX} from '../../../src/constants';
import {cleanUpPath} from '../../utils/file-utils';
import {I3SMaterialDefinition, Mbs} from '@loaders.gl/i3s';
const testDumpMetadata = {
  boundingVolumes: {
    obb: {center: [1, 1, 1], halfSize: [2, 3, 4], quaternion: [4, 3, 2, 1]},
    mbs: [1, 2, 3, 4] as Mbs
  },
  attributesCount: 2,
  featureCount: 12,
  geometry: true,
  hasUvRegions: false,
  materialId: 1,
  texelCountHint: 4,
  vertexCount: 100
};
const testTextureSetDefinitions = [
  {
    formats: [
      {name: '0', format: 'png'},
      {name: '1', format: 'ktx2'}
    ]
  } as TextureSetDefinition,
  {
    formats: [
      {name: '0', format: 'png'},
      {name: '1', format: 'ktx2'}
    ],
    atlas: true
  } as TextureSetDefinition
];
const testOptions = {
  inputUrl: 'testInputUrl',
  outputPath: 'testPath',
  tilesetName: 'testTileset',
  maxDepth: 5,
  slpk: true,
  egmFilePath: 'testEGM',
  token: 'testToken',
  draco: true,
  mergeMaterials: true,
  generateTextures: true,
  generateBoundingVolumes: true,
  metadataClass: 'testMetadataClass',
  analyze: true,
  outputVersion: '1.0'
};
const testMaterialDefinitions = [
  {
    doubleSided: true,
    emissiveFactor: [255, 255, 255],
    alphaMode: 'opaque',
    pbrMetallicRoughness: {
      roughnessFactor: 1,
      metallicFactor: 1,
      baseColorTexture: {textureSetDefinitionId: 0}
    }
  }
];
test('tile-converter(i3s)#ConversionDump - Should create conversion dump with options, add node and delete dump file', async () => {
  const conversionDump = new ConversionDump();
  await conversionDump.createDump(testOptions as ConversionDumpOptions);
  await conversionDump.addNode('1.b3dm', 1, testDumpMetadata);
  let isDumpExists = await isFileExists(
    join(
      testOptions.outputPath,
      testOptions.tilesetName,
      `${testOptions.tilesetName}${DUMP_FILE_SUFFIX}`
    )
  );
  expect(isDumpExists).toBe(true);
  const {options, tilesConverted} = await openJson(
    join(testOptions.outputPath, testOptions.tilesetName),
    `${testOptions.tilesetName}${DUMP_FILE_SUFFIX}`
  );
  const {...correctOptions} = testOptions;
  expect(options).toEqual(correctOptions);
  expect(tilesConverted['1.b3dm']).toEqual({
    nodes: [{nodeId: 1, done: false, dumpMetadata: testDumpMetadata}]
  });
  await conversionDump.deleteDumpFile();
  isDumpExists = await isFileExists(
    join(
      testOptions.outputPath,
      testOptions.tilesetName,
      `${testOptions.tilesetName}${DUMP_FILE_SUFFIX}`
    )
  );
  expect(isDumpExists).toBe(false);
  await cleanUpPath(testOptions.outputPath);
});
test('tile-converter(i3s)#ConversionDump - Should restore conversion dump with options and tilesConverted data, then reset the dump', async () => {
  const conversionDump = new ConversionDump();
  await conversionDump.createDump(testOptions as ConversionDumpOptions);
  await conversionDump.addNode('1.b3dm', 1, testDumpMetadata);
  const conversionDumpNew = new ConversionDump();
  await conversionDumpNew.createDump(testOptions as ConversionDumpOptions);
  const {options} = await openJson(
    join(testOptions.outputPath, testOptions.tilesetName),
    `${testOptions.tilesetName}${DUMP_FILE_SUFFIX}`
  );
  const {...correctOptions} = testOptions;
  expect(options).toEqual(correctOptions);
  expect(conversionDumpNew.restored).toBe(true);
  expect(conversionDumpNew.tilesConverted['1.b3dm']).toEqual({
    nodes: [{nodeId: 1, done: false, dumpMetadata: testDumpMetadata}]
  });
  conversionDumpNew.reset();
  expect(conversionDumpNew.restored).toBe(false);
  expect(conversionDumpNew.tilesConverted).toEqual({});
  await conversionDumpNew.deleteDumpFile();
  await cleanUpPath(testOptions.outputPath);
});
test('tile-converter(i3s)#ConversionDump - Add node to the dump', async () => {
  const conversionDump = new ConversionDump();
  const testOptions = {
    outputPath: 'testPath',
    tilesetName: 'testTileset'
  };
  await conversionDump.createDump(testOptions as ConversionDumpOptions);
  await conversionDump.addNode('1.glb', 1, testDumpMetadata);
  await conversionDump.addNode('1.glb', 2, testDumpMetadata);
  await conversionDump.addNode('2.glb', 3, testDumpMetadata);
  const {tilesConverted} = await openJson(
    join(testOptions.outputPath, testOptions.tilesetName),
    `${testOptions.tilesetName}${DUMP_FILE_SUFFIX}`
  );
  expect(tilesConverted).toEqual({
    '1.glb': {
      nodes: [
        {nodeId: 1, done: false, dumpMetadata: testDumpMetadata},
        {nodeId: 2, done: false, dumpMetadata: testDumpMetadata}
      ]
    },
    '2.glb': {
      nodes: [{nodeId: 3, done: false, dumpMetadata: testDumpMetadata}]
    }
  });
  await conversionDump.deleteDumpFile();
  await cleanUpPath(testOptions.outputPath);
});
test('tile-converter(i3s)#ConversionDump - update Done Status', async () => {
  const conversionDump = new ConversionDump();
  const testOptions = {
    outputPath: 'testPath',
    tilesetName: 'testTileset'
  };
  await conversionDump.createDump(testOptions as ConversionDumpOptions);
  await conversionDump.addNode('1.glb', 1, testDumpMetadata);
  conversionDump.updateDoneStatus('1.glb', 1, 'testResource', false);
  expect(conversionDump.tilesConverted).toEqual({
    '1.glb': {
      nodes: [
        {nodeId: 1, done: false, progress: {testResource: false}, dumpMetadata: testDumpMetadata}
      ]
    }
  });
  await conversionDump.deleteDumpFile();
  await cleanUpPath(testOptions.outputPath);
});
test('tile-converter(i3s)#ConversionDump - updateConvertedTilesDump, isFileConversionComplete', async () => {
  const conversionDump = new ConversionDump();
  await conversionDump.createDump(testOptions as ConversionDumpOptions);
  await conversionDump.addNode('1.glb', 1, testDumpMetadata);
  conversionDump.updateDoneStatus('1.glb', 1, 'testResource', false);
  expect(conversionDump.isFileConversionComplete('1.glb')).toBe(false);
  const promises: Promise<string | null>[] = [];
  promises.push(Promise.resolve(''));
  const writeResults = await Promise.allSettled(promises);
  const changedRecords = [{sourceId: '1.glb', outputId: 1, resourceType: 'testResource'}];
  await conversionDump.updateConvertedTilesDump(changedRecords, writeResults);
  expect(conversionDump.tilesConverted).toEqual({
    '1.glb': {
      nodes: [{nodeId: 1, done: true, dumpMetadata: testDumpMetadata}]
    }
  });
  const {tilesConverted} = await openJson(
    join(testOptions.outputPath, testOptions.tilesetName),
    `${testOptions.tilesetName}${DUMP_FILE_SUFFIX}`
  );
  expect(tilesConverted).toEqual({
    '1.glb': {
      nodes: [{nodeId: 1, done: true, dumpMetadata: testDumpMetadata}]
    }
  });
  expect(conversionDump.isFileConversionComplete('1.glb')).toBe(true);
  await conversionDump.deleteDumpFile();
  await cleanUpPath(testOptions.outputPath);
});
test('tile-converter(i3s)#ConversionDump - test clearDumpRecord', async () => {
  const conversionDump = new ConversionDump();
  await conversionDump.createDump(testOptions as ConversionDumpOptions);
  await conversionDump.addNode('1.glb', 1, testDumpMetadata);
  conversionDump.updateDoneStatus('1.glb', 1, 'testResource', false);
  conversionDump.clearDumpRecord('1.glb');
  expect(conversionDump.tilesConverted['1.glb']).toEqual({nodes: []});
  await conversionDump.deleteDumpFile();
  await cleanUpPath(testOptions.outputPath);
});
test('tile-converter(i3s)#ConversionDump - test updateConvertedNodesDumpFile', async () => {
  const conversionDump = new ConversionDump();
  await conversionDump.createDump(testOptions as ConversionDumpOptions);
  await conversionDump.addNode('1.b3dm', '1');
  expect(JSON.parse(JSON.stringify(conversionDump.tilesConverted))).toEqual({
    '1.b3dm': {
      nodes: [{nodeId: '1', done: false}]
    }
  });
  await conversionDump.updateConvertedNodesDumpFile('1.b3dm', '1', true);
  const {tilesConverted} = await openJson(
    join(testOptions.outputPath, testOptions.tilesetName),
    `${testOptions.tilesetName}${DUMP_FILE_SUFFIX}`
  );
  expect(tilesConverted).toEqual({
    '1.b3dm': {
      nodes: [{nodeId: '1', done: true}]
    }
  });
  await conversionDump.deleteDumpFile();
  await cleanUpPath(testOptions.outputPath);
});
test('tile-converter(i3s)#ConversionDump - test addTexturesDefinitions method', () => {
  const conversionDump = new ConversionDump();
  conversionDump.addTexturesDefinitions(testTextureSetDefinitions);
  expect(conversionDump.textureSetDefinitions).toEqual(testTextureSetDefinitions);
});
test('tile-converter(i3s)#ConversionDump - test setMaterialsDefinitions method', () => {
  const conversionDump = new ConversionDump();
  conversionDump.setMaterialsDefinitions(testMaterialDefinitions as I3SMaterialDefinition[]);
  expect(conversionDump.materialDefinitions).toEqual(testMaterialDefinitions);
});
