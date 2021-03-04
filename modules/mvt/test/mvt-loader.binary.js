import test from 'tape-promise/tape';
import {MVTLoader} from '@loaders.gl/mvt';
import {setLoaderOptions, fetchFile, parse} from '@loaders.gl/core';
import {geojsonToBinary} from '@loaders.gl/gis';

setLoaderOptions({
  _workerType: 'test'
});

const DATA_PATH = '@loaders.gl/mvt/test/data/';

const testfiles = {
  lines: 'lines_2-2-1.mvt',
  linesMultiple: 'lines_10-501-386_multiplelayers.mvt',
  points: 'points_4-2-6.mvt',
  polygons: 'polygons_10-133-325.mvt'
};

// Test to sanity check that old method of parsing binary
// format via an intermediate geojson step produces the
// same result
for (const [name, filename] of Object.entries(testfiles)) {
  const url = `${DATA_PATH}${filename}`;
  test(`Check ${name}`, async t => {
    const response = await fetchFile(url);
    const mvtArrayBuffer = await response.arrayBuffer();
    const geojson = await parse(mvtArrayBuffer, MVTLoader);
    const binary = await parse(mvtArrayBuffer, MVTLoader, {gis: {format: 'binary'}});
    delete binary.byteLength;
    t.deepEqual(geojsonToBinary(geojson), binary);
    t.end();
  });
}
