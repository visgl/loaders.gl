import test from 'tape-promise/tape';
import {
  ConversionDump,
  ConversionDumpOptions,
  TextureSetDefinition
} from '../../../src/lib/utils/conversion-dump';
import {join} from 'path';
import {isFileExists, openJson} from '../../../src/lib/utils/file-utils';
import {DUMP_FILE_SUFFIX} from '../../../src/constants';
import {cleanUpPath} from '../../utils/file-utils';
import {Mbs} from '@loaders.gl/i3s';

const testDumpMetadata = {
  boundingVolumes: {
    obb: {center: [1, 1, 1], halfSize: [2, 3, 4], quaternion: [4, 3, 2, 1]},
    mbs: [1, 2, 3, 4] as Mbs
  },
  attributes: [],
  featureCount: 12,
  geometry: true,
  hasUvRegions: false,
  meshMaterial: {
    alphaMode: 'opaque' as 'opaque' | 'mask' | 'blend',
    pbrMetallicRoughness: {metallicFactor: 0.5, roughnessFactor: 0.7}
  },
  texture: {
    image: {
      height: 320,
      width: 240
    }
  },
  vertexCount: 100,
  attributeTypesMap: {testAttr: 'string'}
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

test('tile-converter(i3s)#ConversionDump - Should create and delete conversion dump with options', async (t) => {
  const conversionDump = new ConversionDump();
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
    something: 'test'
  };

  await conversionDump.createDumpFile(testOptions as ConversionDumpOptions);

  let isDumpExists = await isFileExists(
    join(
      testOptions.outputPath,
      testOptions.tilesetName,
      `${testOptions.tilesetName}${DUMP_FILE_SUFFIX}`
    )
  );
  t.equal(isDumpExists, true);

  const {options} = await openJson(
    join(testOptions.outputPath, testOptions.tilesetName),
    `${testOptions.tilesetName}${DUMP_FILE_SUFFIX}`
  );
  const {something, ...correctOptions} = testOptions;
  t.deepEqual(options, correctOptions);

  await conversionDump.deleteDumpFile();
  isDumpExists = await isFileExists(
    join(
      testOptions.outputPath,
      testOptions.tilesetName,
      `${testOptions.tilesetName}${DUMP_FILE_SUFFIX}`
    )
  );
  t.equal(isDumpExists, false);
  await cleanUpPath(testOptions.outputPath);
  t.end();
});

test('tile-converter(i3s)#ConversionDump - Add node to the dump', async (t) => {
  const conversionDump = new ConversionDump();
  const testOptions = {
    outputPath: 'testPath',
    tilesetName: 'testTileset'
  };

  await conversionDump.createDumpFile(testOptions as ConversionDumpOptions);

  await conversionDump.addNode('1.glb', 1, testDumpMetadata);
  await conversionDump.addNode('1.glb', 2, testDumpMetadata);
  await conversionDump.addNode('2.glb', 3, testDumpMetadata);

  const {tilesConverted} = await openJson(
    join(testOptions.outputPath, testOptions.tilesetName),
    `${testOptions.tilesetName}${DUMP_FILE_SUFFIX}`
  );

  t.deepEqual(tilesConverted, {
    '1.glb': {
      nodes: [
        {nodeId: 1, done: false, progress: {}, dumpMetadata: testDumpMetadata},
        {nodeId: 2, done: false, progress: {}, dumpMetadata: testDumpMetadata}
      ]
    },
    '2.glb': {
      nodes: [{nodeId: 3, done: false, progress: {}, dumpMetadata: testDumpMetadata}]
    }
  });

  await conversionDump.deleteDumpFile();
  await cleanUpPath(testOptions.outputPath);
  t.end();
});

test('tile-converter(i3s)#ConversionDump - update Done Status', async (t) => {
  const conversionDump = new ConversionDump();
  const testOptions = {
    outputPath: 'testPath',
    tilesetName: 'testTileset'
  };

  await conversionDump.createDumpFile(testOptions as ConversionDumpOptions);
  await conversionDump.addNode('1.glb', 1, testDumpMetadata);
  conversionDump.updateDoneStatus('1.glb', 1, 'testResource', false);

  t.deepEqual(conversionDump.tilesConverted, {
    '1.glb': {
      nodes: [
        {nodeId: 1, done: false, progress: {testResource: false}, dumpMetadata: testDumpMetadata}
      ]
    }
  });

  await conversionDump.deleteDumpFile();
  await cleanUpPath(testOptions.outputPath);
  t.end();
});

test('tile-converter(i3s)#ConversionDump - updateConvertedTilesDump', async (t) => {
  const conversionDump = new ConversionDump();
  const testOptions = {
    outputPath: 'testPath',
    tilesetName: 'testTileset'
  };

  await conversionDump.createDumpFile(testOptions as ConversionDumpOptions);
  await conversionDump.addNode('1.glb', 1, testDumpMetadata);
  conversionDump.updateDoneStatus('1.glb', 1, 'testResource', false);

  const promises: Promise<string | null>[] = [];
  promises.push(Promise.resolve(''));
  const writeResults = await Promise.allSettled(promises);
  const changedRecords = [{sourceId: '1.glb', outputId: 1, resourceType: 'testResource'}];
  await conversionDump.updateConvertedTilesDump(changedRecords, writeResults);

  t.deepEqual(conversionDump.tilesConverted, {
    '1.glb': {
      nodes: [{nodeId: 1, done: true, progress: {}, dumpMetadata: testDumpMetadata}]
    }
  });

  const {tilesConverted} = await openJson(
    join(testOptions.outputPath, testOptions.tilesetName),
    `${testOptions.tilesetName}${DUMP_FILE_SUFFIX}`
  );

  t.deepEqual(tilesConverted, {
    '1.glb': {
      nodes: [{nodeId: 1, done: true, progress: {}, dumpMetadata: testDumpMetadata}]
    }
  });

  await conversionDump.deleteDumpFile();
  await cleanUpPath(testOptions.outputPath);
  t.end();
});

test('tile-converter(i3s)#ConversionDump - test init, isFileConversionComplete and clearDumpRecord methods', async (t) => {
  const conversionDump = new ConversionDump();
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
    analyze: true
  };
  const testTilesConverted = {
    'file1.glb': {nodes: [{nodeId: 1, done: true, progress: {}, dumpMetadata: testDumpMetadata}]},
    'file2.glb': {nodes: [{nodeId: 2, done: false, progress: {}, dumpMetadata: testDumpMetadata}]}
  };

  conversionDump.init(testOptions, testTilesConverted, testTextureSetDefinitions);

  t.equal(conversionDump.isFileConversionComplete('file1.glb'), true);
  t.equal(conversionDump.isFileConversionComplete('file2.glb'), false);

  conversionDump.clearDumpRecord('file2.glb');
  t.deepEqual(conversionDump.tilesConverted['file2.glb'], {nodes: []});
  t.end();
});

test('tile-converter(i3s)#ConversionDump - test addTexturesDefinitions method', async (t) => {
  const conversionDump = new ConversionDump();

  conversionDump.addTexturesDefinitions(testTextureSetDefinitions);

  t.deepEqual(conversionDump.textureSetDefinitions, testTextureSetDefinitions);
  t.end();
});

test('tile-converter(i3s)#ConversionDump - compare options', async (t) => {
  const dumpedOptions = {
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
    analyze: true
  };
  const converterOptions = {...dumpedOptions, something: 'something'};
  t.equal(ConversionDump.compareOptions(dumpedOptions, converterOptions), true);

  const converterOptions2 = {...converterOptions, draco: false};
  t.equal(ConversionDump.compareOptions(dumpedOptions, converterOptions2), false);
  t.end();
});
