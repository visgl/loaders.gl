// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Override aliases to point to publicly accessible github
// TODO maybe setPathPrefix is enough?
import ALIASES from '../../test/aliases';
import {_addAliases} from '@loaders.gl/loader-utils';

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
    const {default: lasBench} = await import('@loaders.gl/las/test/las-loader.bench');
    await lasBench(suite);
  }

  if (shouldRunBenchmark('gis')) {
    const {default: gisBench} = await import('@loaders.gl/gis/test/binary-features/gis.bench');
    await gisBench(suite);
  }

  if (shouldRunBenchmark('shapefile')) {
    const {default: shapefileBench} = await import('@loaders.gl/shapefile/test/shapefile.bench');
    const {default: shpBench} = await import('@loaders.gl/shapefile/test/shp.bench');
    await shapefileBench(suite);
    await shpBench(suite);
  }
  if (shouldRunBenchmark('geopackage')) {
    const {default: geopackageBench} = await import('@loaders.gl/geopackage/test/geopackage.bench');
    await geopackageBench(suite);
  }
  if (shouldRunBenchmark('flatgeobuf')) {
    const {default: flatgeobufBench} = await import('@loaders.gl/flatgeobuf/test/flatgeobuf.bench');
    await flatgeobufBench(suite);
  }
  if (shouldRunBenchmark('kml')) {
    const {default: kmlBench} = await import('@loaders.gl/kml/test/kml.bench');
    await kmlBench(suite);
  }

  if (shouldRunBenchmark('csv')) {
    const {default: csvBench} = await import('@loaders.gl/csv/test/csv.bench');
    await csvBench(suite);
  }

  if (shouldRunBenchmark('core')) {
    const {default: coreBench} = await import('@loaders.gl/core/test/core.bench');
    await coreBench(suite);
  }

  if (shouldRunBenchmark('parquet')) {
    const {parquetBench} = await import('@loaders.gl/parquet/test/parquet.bench');
    await parquetBench(suite);
  }
  if (shouldRunBenchmark('ply')) {
    const {default: plyBench} = await import('@loaders.gl/ply/test/ply-loader.bench');
    await plyBench(suite);
  }

  if (shouldRunBenchmark('json')) {
    const {default: jsonBench} = await import('@loaders.gl/json/test/json-loader.bench');
    await jsonBench(suite);
  }

  if (shouldRunBenchmark('loader-utils')) {
    const {default: loaderUtilsBench} = await import(
      '@loaders.gl/loader-utils/test/loader-utils.bench'
    );
    await loaderUtilsBench(suite);
  }

  if (shouldRunBenchmark('images')) {
    const {default: imageBench} = await import('@loaders.gl/images/test/images.bench');
    await imageBench(suite);
  }
  if (shouldRunBenchmark('crypto')) {
    const {default: cryptoBench} = await import('@loaders.gl/crypto/test/crypto.bench');
    await cryptoBench(suite);
  }

  if (shouldRunBenchmark('draco')) {
    const {default: dracoBench} = await import('@loaders.gl/draco/test/draco.bench');
    await dracoBench(suite);
  }
  if (shouldRunBenchmark('excel')) {
    const {default: excelBench} = await import('@loaders.gl/excel/test/excel.bench');
    await excelBench(suite);
  }
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
