// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {SHPLoader} from '@loaders.gl/shapefile';
import {parse, parseInBatches, fetchFile} from '@loaders.gl/core';
import {convertBinaryGeometryToGeometry} from '@loaders.gl/gis';

const DECKGL_DATA_URL = 'https://raw.githubusercontent.com/visgl/deck.gl-data/master';
const SHAPEFILE_URL = `${DECKGL_DATA_URL}/test-data/shapefile/geo_export_14556060-0002-4a9e-8ef0-03da3e246166.shp`;
const SHP_HEADER_SIZE = 100;
const RECORD_HEADER_SIZE = 8;
const BIG_ENDIAN = false;
const LITTLE_ENDIAN = true;

export default async function shpLoaderBench(suite) {
  const response = await fetchFile(SHAPEFILE_URL);
  const arrayBuffer = await response.arrayBuffer();
  const {coordinateCount} = countSHPRecordsAndCoordinates(arrayBuffer);
  const coordinateBenchmarkOptions = {multiplier: coordinateCount, unit: 'coordinates'};

  // Add the tests
  suite.group('SHPLoader');

  suite.addAsync(
    'geoarrow.wkb',
    coordinateBenchmarkOptions,
    async () =>
      await parse(arrayBuffer.slice(0), SHPLoader, {
        core: {worker: false},
        shp: {shape: 'arrow-table', geoarrowEncoding: 'geoarrow.wkb'}
      })
  );

  suite.addAsync(
    'geoarrow.[inferred typed]',
    coordinateBenchmarkOptions,
    async () =>
      await parse(arrayBuffer.slice(0), SHPLoader, {
        core: {worker: false},
        shp: {shape: 'arrow-table', geoarrowEncoding: 'geoarrow'}
      })
  );

  suite.addAsync(
    'binary geometry',
    coordinateBenchmarkOptions,
    async () =>
      await parse(arrayBuffer, SHPLoader, {
        core: {worker: false},
        shp: {shape: 'binary-geometry'}
      })
  );

  suite.addAsync('geojson', coordinateBenchmarkOptions, async () => {
    const result = await parse(arrayBuffer.slice(0), SHPLoader, {
      core: {worker: false},
      shp: {shape: 'binary-geometry'}
    });
    result.geometries.map(geometry =>
      geometry ? convertBinaryGeometryToGeometry(geometry) : null
    );
  });

  suite.addAsync('parseInBatches geoarrow.wkb', coordinateBenchmarkOptions, async () => {
    const batches = await parseInBatches(arrayBuffer, SHPLoader, {
      core: {worker: false},
      shp: {shape: 'arrow-table', geoarrowEncoding: 'geoarrow.wkb'}
    });
    for await (const _batch of batches) {
      _batch;
    }
  });

  // TODO: optionally test for equality of batched and atomic loaders
  // Note: first batch returned from asyncIterator is the shp header
  // const rows = [];
  // for await (const batch of asyncIterator) {
  //   rows.push(...batch);
  // }
  // t.deepEqual(rows, output.geometries);
}

/** Counts SHP records and coordinates so benchmark throughput can report geometry work. */
function countSHPRecordsAndCoordinates(arrayBuffer: ArrayBuffer): {
  rowCount: number;
  coordinateCount: number;
} {
  let rowCount = 0;
  let coordinateCount = 0;
  let offset = SHP_HEADER_SIZE;
  while (offset + RECORD_HEADER_SIZE <= arrayBuffer.byteLength) {
    const recordHeaderView = new DataView(arrayBuffer, offset, RECORD_HEADER_SIZE);
    const byteLength = recordHeaderView.getInt32(4, BIG_ENDIAN) * 2;
    offset += RECORD_HEADER_SIZE;
    if (byteLength <= 0 || offset + byteLength > arrayBuffer.byteLength) {
      break;
    }
    rowCount++;
    coordinateCount += countRecordCoordinates(new DataView(arrayBuffer, offset, byteLength));
    offset += byteLength;
  }
  return {rowCount, coordinateCount};
}

function countRecordCoordinates(recordView: DataView): number {
  const type = recordView.getInt32(0, LITTLE_ENDIAN);
  switch (type) {
    case 0:
      return 0;
    case 1:
    case 11:
    case 21:
      return 1;
    case 3:
    case 5:
    case 13:
    case 15:
    case 23:
    case 25:
      return recordView.getInt32(40, LITTLE_ENDIAN);
    case 8:
    case 18:
    case 28:
      return recordView.getInt32(36, LITTLE_ENDIAN);
    default:
      return 0;
  }
}
