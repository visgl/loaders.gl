/* global File */
import test from 'tape-promise/tape';
import {fetchFile, load, loadInBatches, selectLoader} from '@loaders.gl/core';
import {_BrowserFileSystem as BrowserFileSystem} from '@loaders.gl/core';
import {ShapefileLoader} from '@loaders.gl/shapefile';
import {Proj4Projection} from '@math.gl/proj4';
import {tapeEqualsEpsilon} from 'test/utils/tape-assertions';

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

test('ShapefileLoader#load (from browser File objects)', async t => {
  if (typeof File !== 'undefined') {
    // test `File` load (browser)
    t.comment('...FILE LOAD STARTING. FAILED FETCHES EXPECTED');
    for (const testFileName in SHAPEFILE_JS_TEST_FILES) {
      const fileList = await getFileList(testFileName);
      SHAPEFILE_JS_TEST_FILES[testFileName] = fileList;
    }
    t.comment('...FILE LOAD COMPLETE');

    for (const testFileName in SHAPEFILE_JS_TEST_FILES) {
      const fileList = SHAPEFILE_JS_TEST_FILES[testFileName];
      const fileSystem = new BrowserFileSystem(fileList);
      const {fetch} = fileSystem;
      const filename = `${testFileName}.shp`;
      const data = await load(filename, ShapefileLoader, {fetch});
      t.comment(`${filename}: ${JSON.stringify(data).slice(0, 70)}`);

      testShapefileData(t, testFileName, data);
    }
  }
  t.end();
});

test('ShapefileLoader#load (from files or URLs)', async t => {
  // test file load (node) or URL load (browser)
  for (const testFileName in SHAPEFILE_JS_TEST_FILES) {
    const filename = `${SHAPEFILE_JS_DATA_FOLDER}/${testFileName}.shp`;
    const data = await load(filename, ShapefileLoader);
    t.comment(`${filename}: ${JSON.stringify(data).slice(0, 70)}`);

    await testShapefileData(t, testFileName, data);
  }

  t.end();
});

test('ShapefileLoader#load and reproject (from files or URLs)', async t => {
  // test file load (node) or URL load (browser)
  const testFileName = 'points';
  const filename = `${SHAPEFILE_JS_DATA_FOLDER}/${testFileName}.shp`;
  const data = await load(filename, ShapefileLoader, {
    gis: {reproject: true, _targetCrs: 'EPSG:3857'}
  });
  t.comment(`${filename}: ${JSON.stringify(data).slice(0, 70)}`);

  // Compare with parsed json
  // This is a special case with reprojected coordinates; otherwise use the
  // testShapefileData helper
  const response = await fetchFile(`${SHAPEFILE_JS_DATA_FOLDER}/${testFileName}.json`);
  const json = await response.json();

  const projection = new Proj4Projection({from: 'WGS84', to: 'EPSG:3857'});

  for (let i = 0; i < json.features.length; i++) {
    const shpFeature = data.data[i];
    const jsonFeature = json.features[i];
    const jsonPointGeom = projection.project(jsonFeature.geometry.coordinates);
    tapeEqualsEpsilon(t, shpFeature.geometry.coordinates, jsonPointGeom, 0.00001);
  }

  t.end();
});

test('ShapefileLoader#selectLoader (from arrayBuffer data)', async t => {
  // test file load (node) or URL load (browser)
  const filename = `${SHAPEFILE_JS_DATA_FOLDER}/boolean-property.shp`;
  const response = await fetchFile(filename);
  const arrayBuffer = await response.arrayBuffer();
  const loader = await selectLoader(arrayBuffer, [ShapefileLoader]);
  t.equal(loader && loader.id, 'shapefile', 'Select loader using SHP magic number');
  t.end();
});

test('ShapefileLoader#loadInBatches(URL)', async t => {
  // test file load (node) or URL load (browser)
  for (const testFileName in SHAPEFILE_JS_TEST_FILES) {
    const filename = `${SHAPEFILE_JS_DATA_FOLDER}/${testFileName}.shp`;
    const batches = await loadInBatches(filename, ShapefileLoader);
    let data;
    for await (const batch of batches) {
      data = batch;
      // t.comment(`${filename}: ${JSON.stringify(data).slice(0, 70)}`);
    }
    await testShapefileData(t, testFileName, data);
  }

  t.end();
});

test('ShapefileLoader#loadInBatches(File)', async t => {
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
    const batches = await loadInBatches(file, ShapefileLoader, {fetch: fileSystem.fetch});
    let data;
    for await (const batch of batches) {
      data = batch;
    }
    await testShapefileData(t, testFileName, data);
  }

  t.end();
});

async function getFileList(testFileName) {
  const EXTENSIONS = ['.shp', '.shx', '.dbf', '.cpg', '.prj'];
  const fileList = [];
  for (const extension of EXTENSIONS) {
    const filename = `${testFileName}${extension}`;
    const response = await fetchFile(`${SHAPEFILE_JS_DATA_FOLDER}/${filename}`);
    if (response.ok) {
      fileList.push(new File([await response.blob()], filename));
    }
  }
  return fileList;
}

async function testShapefileData(t, testFileName, data) {
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

  for (let i = 0; i < json.features.length; i++) {
    t.deepEqual(data.data[i], json.features[i]);
  }
}
