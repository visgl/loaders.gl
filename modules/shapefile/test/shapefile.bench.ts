// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {fetchFile, load} from '@loaders.gl/core';
import {ShapefileLoader} from '@loaders.gl/shapefile';

const DECKGL_DATA_URL = 'https://raw.githubusercontent.com/visgl/deck.gl-data/master';
const SHAPEFILE_URL = `${DECKGL_DATA_URL}/test-data/shapefile/geo_export_14556060-0002-4a9e-8ef0-03da3e246166.shp`;
const SHP_HEADER_SIZE = 100;
const RECORD_HEADER_SIZE = 8;
const BIG_ENDIAN = false;

export default async function shapefileLoaderBench(suite) {
  const response = await fetchFile(SHAPEFILE_URL);
  const arrayBuffer = await response.arrayBuffer();
  const rowCount = countSHPRecords(arrayBuffer);
  const rowBenchmarkOptions = {multiplier: rowCount, unit: 'rows'};

  // Add the tests
  suite.group('ShapefileLoader');

  suite.addAsync(
    'parse(ShapefileLoader without worker) to GeoJSON',
    rowBenchmarkOptions,
    async () => {
      await load(arrayBuffer.slice(0), ShapefileLoader, {
        core: {worker: false},
        shapefile: {shape: 'geojson-table'}
      });
    }
  );

  suite.addAsync(
    'parse(ShapefileLoader without worker) to GeoArrow',
    rowBenchmarkOptions,
    async () => {
      await load(arrayBuffer.slice(0), ShapefileLoader, {
        core: {worker: false},
        shapefile: {shape: 'arrow-table'}
      });
    }
  );
}

/** Counts SHP records so benchmark throughput is reported as rows per second. */
function countSHPRecords(arrayBuffer: ArrayBuffer): number {
  let rowCount = 0;
  let offset = SHP_HEADER_SIZE;
  while (offset + RECORD_HEADER_SIZE <= arrayBuffer.byteLength) {
    const recordHeaderView = new DataView(arrayBuffer, offset, RECORD_HEADER_SIZE);
    const byteLength = recordHeaderView.getInt32(4, BIG_ENDIAN) * 2;
    offset += RECORD_HEADER_SIZE;
    if (byteLength <= 0 || offset + byteLength > arrayBuffer.byteLength) {
      break;
    }
    rowCount++;
    offset += byteLength;
  }
  return rowCount;
}
