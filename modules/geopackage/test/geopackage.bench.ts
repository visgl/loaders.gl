// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {fetchFile, load} from '@loaders.gl/core';
import {GeoPackageLoader} from '@loaders.gl/geopackage';

const GPKG_RIVERS = '@loaders.gl/geopackage/test/data/rivers_small.gpkg';
const ROW_BENCHMARK_OPTIONS = {multiplier: 1, unit: 'rows'};

export default async function geopackageLoaderBench(suite) {
  const response = await fetchFile(GPKG_RIVERS);
  const arrayBuffer = await response.arrayBuffer();

  suite = suite.group('GeoPackageLoader');

  suite.addAsync('load arrow-table geoarrow.wkb', ROW_BENCHMARK_OPTIONS, async () => {
    await load(arrayBuffer.slice(0), GeoPackageLoader, {
      core: {worker: false},
      geopackage: {shape: 'arrow-table'}
    });
  });

  suite.addAsync('load geojson-table', ROW_BENCHMARK_OPTIONS, async () => {
    await load(arrayBuffer.slice(0), GeoPackageLoader, {
      core: {worker: false},
      geopackage: {shape: 'geojson-table'}
    });
  });
}
