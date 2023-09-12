import {MVTLoader} from '@loaders.gl/mvt';
import {fetchFile, parse} from '@loaders.gl/core';
import {geojsonToBinary} from '@loaders.gl/gis';

// Define MVT files to run bench tests over
const testfiles = {
  lines: 'lines_2-2-1.mvt',
  linesMultiple: 'lines_10-501-386_multiplelayers.mvt',
  points: 'points_4-2-6.mvt',
  polygons: 'polygons_10-133-325.mvt'
  // Add more test files here...
  // See `data/fetch_data.py`
};

const DATA_PATH = '@loaders.gl/mvt/test/data/';

// Benchmark to compare old method of parsing binary
// format via an intermediate geojson step with the
// new direct parser
export default async function mvtLoaderBench(suite) {
  suite.group('MVTLoader');

  const options = {unit: 'tiles'};

  for (const [name, filename] of Object.entries(testfiles)) {
    // Prefetch data, so we only test parse speed
    const url = `${DATA_PATH}${filename}`;
    const response = await fetchFile(url);
    const mvtArrayBuffer = await response.arrayBuffer();

    // Actually define perf test
    suite.addAsync(`${name} MVT -> geojson`, options, async () => {
      // Conversion to geojson only
      await parse(mvtArrayBuffer.slice(0), MVTLoader, {worker: true});
    });
    suite.addAsync(`${name} MVT -> binary (legacy)`, options, async () => {
      // Conversion to binary, via intermediate geojson
      const geometryJSON = await parse(mvtArrayBuffer.slice(0), MVTLoader, {worker: true});
      geojsonToBinary(geometryJSON);
    });
    suite.addAsync(`${name} MVT -> binary`, options, async () => {
      // Conversion to binary directly
      await parse(mvtArrayBuffer.slice(0), MVTLoader, {gis: {format: 'binary'}, worker: true});
    });
  }
}
