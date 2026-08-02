// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Override aliases to point to publicly accessible github
// TODO maybe setPathPrefix is enough?
import ALIASES from '../../test/aliases';
import {_addAliases} from '@loaders.gl/loader-utils';

import loaderUtilsBench from '@loaders.gl/loader-utils/test/loader-utils.bench';
import coreBench from '@loaders.gl/core/test/core.bench';
import csvBench from '@loaders.gl/csv/test/csv.bench';
import dracoBench from '@loaders.gl/draco/test/draco.bench';
import excelBench from '@loaders.gl/excel/test/excel.bench';
import imageBench from '@loaders.gl/images/test/images.bench';
import lasBench from '@loaders.gl/las/test/las-loader.bench';
import jsonBench from '@loaders.gl/json/test/json-loader.bench';
import tiles3DBench from '@loaders.gl/3d-tiles/test/tiles-3d-loader.bench';
// import mvtBench from '@loaders.gl/mvt/test/mvt-loader.bench';
import flatgeobufBench from '@loaders.gl/flatgeobuf/test/flatgeobuf.bench';
import geopackageBench from '@loaders.gl/geopackage/test/geopackage.bench';
import gisBench from '@loaders.gl/gis/test/binary-features/gis.bench';
import kmlBench from '@loaders.gl/kml/test/kml.bench';
import {parquetBench} from '@loaders.gl/parquet/test/parquet.bench';
import plyBench from '@loaders.gl/ply/test/ply-loader.bench';
import shapefileBench from '@loaders.gl/shapefile/test/shapefile.bench';
import shpBench from '@loaders.gl/shapefile/test/shp.bench';

import cryptoBench from '@loaders.gl/crypto/test/crypto.bench';
// import i3sLoaderBench from '@loaders.gl/i3s/test/i3s-loader.bench';

_addAliases(ALIASES);

/**
 * Adds module benchmarks that are compatible with the current runtime.
 * @param {import('@probe.gl/bench').Bench} suite Benchmark suite.
 * @param {string[]} filters Optional benchmark module filters.
 * @returns {Promise<void>} Resolves after all compatible benchmarks have been added.
 */
export async function addModuleBenchmarksToSuite(suite, filters = []) {
  const shouldRunBenchmark = createBenchmarkFilter(filters);

  if (shouldRunBenchmark('las')) {
    await lasBench(suite);
  }

  if (shouldRunBenchmark('gis')) {
    await gisBench(suite);
  }

  if (shouldRunBenchmark('shapefile')) {
    await shapefileBench(suite);
    await shpBench(suite);
  }
  if (shouldRunBenchmark('geopackage')) {
    await geopackageBench(suite);
  }
  if (shouldRunBenchmark('flatgeobuf')) {
    await flatgeobufBench(suite);
  }
  if (shouldRunBenchmark('kml')) {
    await kmlBench(suite);
  }

  if (shouldRunBenchmark('csv')) {
    await csvBench(suite);
  }

  if (shouldRunBenchmark('core')) {
    await coreBench(suite);
  }

  if (shouldRunBenchmark('parquet')) {
    await parquetBench(suite);
  }
  if (shouldRunBenchmark('ply')) {
    await plyBench(suite);
  }

  if (shouldRunBenchmark('json')) {
    await jsonBench(suite);
  }

  if (shouldRunBenchmark('3d-tiles')) {
    await tiles3DBench(suite);
  }

  // await mvtBench(suite);
  if (shouldRunBenchmark('loader-utils')) {
    await loaderUtilsBench(suite);
  }

  if (shouldRunBenchmark('images')) {
    await imageBench(suite);
  }
  if (shouldRunBenchmark('crypto')) {
    await cryptoBench(suite);
  }

  if (shouldRunBenchmark('draco')) {
    await dracoBench(suite);
  }
  if (shouldRunBenchmark('excel')) {
    await excelBench(suite);
  }

  // await i3sLoaderBench(suite);
}

/**
 * Creates a matcher for optional benchmark module filters.
 * @param {string[]} filters User-provided filters from the benchmark command line.
 * @returns {(moduleName: string) => boolean} Whether a module benchmark should run.
 */
function createBenchmarkFilter(filters) {
  const normalizedFilters = filters
    .filter(filter => !filter.startsWith('-'))
    .map(filter => filter.toLowerCase());
  if (normalizedFilters.length === 0) {
    return () => true;
  }
  return moduleName =>
    normalizedFilters.some(filter => filter.includes(moduleName) || moduleName.includes(filter));
}
