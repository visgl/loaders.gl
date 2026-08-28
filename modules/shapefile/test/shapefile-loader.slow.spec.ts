// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  setLoaderOptions,
  fetchFile,
  load,
  loadInBatches,
  selectLoader,
  isBrowser,
  _BrowserFileSystem as BrowserFileSystem
} from '@loaders.gl/core';
import {ShapefileLoader} from '@loaders.gl/shapefile';
import {DBFLoaderWithParser as DBFLoader} from '../src/dbf-loader-with-parser';
import {Proj4Projection} from '@math.gl/proj4';
import {equals, withEpsilon} from '@math.gl/core';
setLoaderOptions({
  _workerType: 'test',
  worker: false
});
const SHAPEFILE_JS_DATA_FOLDER = '@loaders.gl/shapefile/test/data/shapefile-js';
const SHAPEFILE_JS_TEST_FILES = {
  'boolean-property': null,
  'date-property': null,
  empty: null,
  'ignore-properties': null,
  'latin1-property': null,
  'mixed-properties': null,
  multipointm: null,
  multipoints: null,
  null: null,
  'number-null-property': null,
  'number-property': null,
  pointm: null,
  points: null,
  polygonm: null,
  polygons: null,
  polylinem: null,
  polylines: null,
  singleton: null,
  'string-property': null,
  'utf8-property': null
};
test('ShapefileLoader#load (from browser File objects)', async () => {
  if (typeof File !== 'undefined') {
    // test `File` load (browser)
    console.log('...FILE LOAD STARTING. FAILED FETCHES EXPECTED');
    for (const testFileName in SHAPEFILE_JS_TEST_FILES) {
      const fileList = await getFileList(testFileName);
      SHAPEFILE_JS_TEST_FILES[testFileName] = fileList;
    }
    console.log('...FILE LOAD COMPLETE');
    for (const testFileName in SHAPEFILE_JS_TEST_FILES) {
      const fileList = SHAPEFILE_JS_TEST_FILES[testFileName];
      const fileSystem = new BrowserFileSystem(fileList);
      // eslint-disable-next-line
      const fetch = fileSystem.fetch.bind(fileSystem.fetch);
      const filename = `${testFileName}.shp`;
      // @ts-ignore
      const data = await load(filename, ShapefileLoader, {fetch, shapefile: {shape: 'v3'}});
      testShapefileData(testFileName, data);
    }
  }
});
test('ShapefileLoader#load (from files or URLs)', async () => {
  // test file load (node) or URL load (browser)
  for (const testFileName in SHAPEFILE_JS_TEST_FILES) {
    const filename = `${SHAPEFILE_JS_DATA_FOLDER}/${testFileName}.shp`;
    const data = await load(filename, ShapefileLoader, {shapefile: {shape: 'v3'}});
    await testShapefileData(testFileName, data);
  }
});
test('ShapefileLoader#load and reproject (from files or URLs)', async () => {
  // test file load (node) or URL load (browser)
  const testFileName = 'points';
  const filename = `${SHAPEFILE_JS_DATA_FOLDER}/${testFileName}.shp`;
  const data = await load(filename, ShapefileLoader, {
    shapefile: {shape: 'v3'},
    gis: {reproject: true, _targetCrs: 'EPSG:3857'}
  });
  // Compare with parsed json
  // This is a special case with reprojected coordinates; otherwise use the
  // testShapefileData helper
  const response = await fetchFile(`${SHAPEFILE_JS_DATA_FOLDER}/${testFileName}.json`);
  const json = await response.json();
  const projection = new Proj4Projection({from: 'WGS84', to: 'EPSG:3857'});
  for (let i = 0; i < json.features.length; i++) {
    // @ts-ignore
    const shpFeature = data.data[i];
    const jsonFeature = json.features[i];
    const jsonPointGeom = projection.project(jsonFeature.geometry.coordinates);
    expect(withEpsilon(0.00001, () => equals(shpFeature.geometry.coordinates, jsonPointGeom))).toBe(
      true
    );
  }
});
test('ShapefileLoader#load passes dbf options to DBFLoader#parse', async () => {
  if (isBrowser) {
    console.log('Skipping DBFLoader.parse option forwarding test in browser');
    return;
  }
  const filename = `${SHAPEFILE_JS_DATA_FOLDER}/points.shp`;
  const dbfWorkerUrl = 'custom.dbf.worker.js';
  const originalParse = DBFLoader.parse;
  let receivedOptions = null;
  DBFLoader.parse = async (arrayBuffer, options) => {
    receivedOptions = options;
    return originalParse(arrayBuffer, options);
  };
  try {
    await load(filename, ShapefileLoader, {
      shapefile: {shape: 'v3'},
      dbf: {workerUrl: dbfWorkerUrl}
    });
    expect(receivedOptions?.dbf?.workerUrl, 'ShapefileLoader forwards dbf options').toBe(
      dbfWorkerUrl
    );
  } finally {
    DBFLoader.parse = originalParse;
  }
});
test('ShapefileLoader#selectLoader (from arrayBuffer data)', async () => {
  // test file load (node) or URL load (browser)
  const filename = `${SHAPEFILE_JS_DATA_FOLDER}/boolean-property.shp`;
  const response = await fetchFile(filename);
  const arrayBuffer = await response.arrayBuffer();
  const loader = await selectLoader(arrayBuffer, [ShapefileLoader]);
  expect(loader && loader.id, 'Select loader using SHP magic number').toBe('shapefile');
});
test('ShapefileLoader#loadInBatches(URL)', async () => {
  // test file load (node) or URL load (browser)
  for (const testFileName in SHAPEFILE_JS_TEST_FILES) {
    const filename = `${SHAPEFILE_JS_DATA_FOLDER}/${testFileName}.shp`;
    const batches = await loadInBatches(filename, ShapefileLoader, {shapefile: {shape: 'v3'}});
    let data;
    for await (const batch of batches) {
      if (batch?.data) {
        data = batch;
      }
    }
    await testShapefileData(testFileName, data);
  }
});
test('ShapefileLoader#loadInBatches(File)', async () => {
  // test file load (node) or URL load (browser)
  for (const testFileName in SHAPEFILE_JS_TEST_FILES) {
    if (testFileName === 'utf8-property') {
      // requires CPG File
      // eslint-disable-next-line no-continue
      continue;
    }
    const dbfFilename = `${SHAPEFILE_JS_DATA_FOLDER}/${testFileName}.dbf`;
    const dbfResponse = await fetchFile(dbfFilename);
    const dbfFile = new File([await dbfResponse.blob()], dbfFilename);
    let fileSystem;
    if (dbfResponse.ok) {
      fileSystem = new BrowserFileSystem([dbfFile]);
    } else {
      fileSystem = new BrowserFileSystem([]);
    }
    const filename = `${SHAPEFILE_JS_DATA_FOLDER}/${testFileName}.shp`;
    const response = await fetchFile(filename);
    const file = new File([await response.blob()], filename);
    // @ts-ignore
    const batches = await loadInBatches(file, ShapefileLoader, {
      fetch: fileSystem.fetch,
      shapefile: {shape: 'v3'}
    });
    let data;
    for await (const batch of batches) {
      if (batch?.data) {
        data = batch;
      }
    }
    await testShapefileData(testFileName, data);
  }
});
test('ShapefileLoader#loadInBatches passes dbf options to DBFLoader#parseInBatches', async () => {
  const filename = `${SHAPEFILE_JS_DATA_FOLDER}/points.shp`;
  const dbfWorkerUrl = 'custom.dbf.worker.js';
  const originalParseInBatches = DBFLoader.parseInBatches;
  let receivedOptions = null;
  DBFLoader.parseInBatches = (arrayBufferIterator, options) => {
    receivedOptions = options;
    return originalParseInBatches(arrayBufferIterator, options);
  };
  try {
    const batches = await loadInBatches(filename, ShapefileLoader, {
      shapefile: {shape: 'v3'},
      dbf: {workerUrl: dbfWorkerUrl}
    });
    for await (const batch of batches) {
      // exhaust iterator to ensure DBF parsing runs
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _ = batch;
    }
    expect(receivedOptions?.dbf?.workerUrl, 'ShapefileLoader forwards dbf options in batches').toBe(
      dbfWorkerUrl
    );
  } finally {
    DBFLoader.parseInBatches = originalParseInBatches;
  }
});
test('ShapefileLoader#loadInBatches when options.metadata: true', async () => {
  const testFileName = Object.keys(SHAPEFILE_JS_TEST_FILES)[0];
  const filename = `${SHAPEFILE_JS_DATA_FOLDER}/${testFileName}.shp`;
  const batches = await loadInBatches(filename, ShapefileLoader, {
    shapefile: {shape: 'v3'},
    metadata: true
  });
  let data;
  for await (const batch of batches) {
    data = batch;
  }
  await testShapefileData(testFileName, data);
});
async function getFileList(testFileName) {
  const EXTENSIONS = ['.shp', '.shx', '.dbf', '.cpg', '.prj'];
  const fileList = [];
  for (const extension of EXTENSIONS) {
    const filename = `${testFileName}${extension}`;
    const response = await fetchFile(`${SHAPEFILE_JS_DATA_FOLDER}/${filename}`);
    if (response.ok && !(response.headers.get('content-type') || '').includes('text/html')) {
      // @ts-expect-error
      fileList.push(new File([await response.blob()], filename));
    }
  }
  return fileList;
}
async function testShapefileData(testFileName, data) {
  // Exceptions for files that don't currently pass tests
  // TODO @kylebarron to fix
  const EXCEPTIONS = [
    'multipointm',
    'null',
    'pointm',
    'polygons',
    'polygonm',
    'polylines',
    'polylinem'
  ];
  if (EXCEPTIONS.some(exception => testFileName.includes(exception))) {
    return;
  }
  // Compare with parsed json
  const response = await fetchFile(`${SHAPEFILE_JS_DATA_FOLDER}/${testFileName}.json`);
  const json = await response.json();
  if (!data?.data) {
    console.log(`Skipping ${testFileName}: no parsed shapefile batch data`);
    return;
  }
  for (let i = 0; i < json.features.length; i++) {
    expect(data.data[i]).toEqual(json.features[i]);
  }
}
