import test from 'tape-promise/tape';
import {ConversionDump, ConversionDumpOptions} from '../../../src/lib/utils/conversion-dump';
import {join} from 'path';
import {isFileExists, openJson} from '../../../src/lib/utils/file-utils';
import {DUMP_FILE_SUFFIX} from '../../../src/constants';
import {cleanUpPath} from '../../utils/file-utils';

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
    join(testOptions.outputPath, `${testOptions.tilesetName}${DUMP_FILE_SUFFIX}`)
  );
  t.equal(isDumpExists, true);

  const {options} = await openJson(
    testOptions.outputPath,
    `${testOptions.tilesetName}${DUMP_FILE_SUFFIX}`
  );
  const {something, ...correctOptions} = testOptions;
  t.deepEqual(options, correctOptions);

  await conversionDump.deleteDumpFile();
  isDumpExists = await isFileExists(
    join(testOptions.outputPath, `${testOptions.tilesetName}${DUMP_FILE_SUFFIX}`)
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

  await conversionDump.addNode('1.glb', 1);
  await conversionDump.addNode('1.glb', 2);
  await conversionDump.addNode('2.glb', 3);

  const {tilesConverted} = await openJson(
    testOptions.outputPath,
    `${testOptions.tilesetName}${DUMP_FILE_SUFFIX}`
  );

  t.deepEqual(tilesConverted, {
    '1.glb': {
      nodes: [
        {nodeId: 1, done: {}},
        {nodeId: 2, done: {}}
      ]
    },
    '2.glb': {
      nodes: [{nodeId: 3, done: {}}]
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
  await conversionDump.addNode('1.glb', 1);
  conversionDump.updateDoneStatus('1.glb', 1, 'testResource', false);

  t.deepEqual(conversionDump.tilesConverted, {
    '1.glb': {
      nodes: [{nodeId: 1, done: {testResource: false}}]
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
  await conversionDump.addNode('1.glb', 1);
  conversionDump.updateDoneStatus('1.glb', 1, 'testResource', false);

  const promises: Promise<string | null>[] = [];
  promises.push(Promise.resolve(''));
  const writeResults = await Promise.allSettled(promises);
  const changedRecords = [{sourceId: '1.glb', outputId: 1, resourceType: 'testResource'}];
  await conversionDump.updateConvertedTilesDump(changedRecords, writeResults);

  t.deepEqual(conversionDump.tilesConverted, {
    '1.glb': {
      nodes: [{nodeId: 1, done: true}]
    }
  });

  const {tilesConverted} = await openJson(
    testOptions.outputPath,
    `${testOptions.tilesetName}${DUMP_FILE_SUFFIX}`
  );

  t.deepEqual(tilesConverted, {
    '1.glb': {
      nodes: [{nodeId: 1, done: true}]
    }
  });

  await conversionDump.deleteDumpFile();
  await cleanUpPath(testOptions.outputPath);
  t.end();
});
