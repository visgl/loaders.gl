// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Override aliases to point to publicly accessible github
// TODO maybe setPathPrefix is enough?
import ALIASES from '../aliases';
import {_addAliases} from '@loaders.gl/core/loader-utils';
_addAliases(ALIASES);

/**
 * Adds module benchmarks that are compatible with the current runtime.
 * @param {import('probe.gl/bench').Bench} suite Benchmark suite.
 * @param {string[]} filters Optional benchmark module filters.
 * @param {Record<string, string>} fixtureAliases Optional fixture path aliases.
 * @returns {Promise<void>} Resolves after all compatible benchmarks have been added.
 */
export async function addModuleBenchmarksToSuite(suite, filters = [], fixtureAliases = ALIASES) {
  _addAliases(fixtureAliases);
  const shouldRunBenchmark = createBenchmarkFilter(filters);

  if (shouldRunBenchmark('compression')) {
    const {default: compressionBench} = await import(
      '../../modules/compression/test/compression.bench'
    );
    compressionBench(suite);
  }

  if (shouldRunBenchmark('las')) {
    const {default: lasBench} = await import('../../modules/pointclouds/test/las/las-loader.bench');
    await lasBench(suite);
  }

  if (shouldRunBenchmark('geoarrow')) {
    const {default: geoarrowBench} = await import(
      '../../modules/core/test/geoarrow/binary-features/geoarrow.bench'
    );
    await geoarrowBench(suite);
  }

  if (shouldRunBenchmark('shapefile')) {
    const {default: shapefileBench} = await import(
      '../../modules/geospatial/test/shapefile/shapefile.bench'
    );
    const {default: shpBench} = await import('../../modules/geospatial/test/shapefile/shp.bench');
    await shapefileBench(suite);
    await shpBench(suite);
  }
  if (shouldRunBenchmark('geopackage')) {
    const {default: geopackageBench} = await import(
      '../../modules/geospatial/test/geopackage/geopackage.bench'
    );
    await geopackageBench(suite);
  }
  if (shouldRunBenchmark('flatgeobuf')) {
    const {default: flatgeobufBench} = await import(
      '../../modules/geospatial/test/flatgeobuf/flatgeobuf.bench'
    );
    await flatgeobufBench(suite);
  }
  if (shouldRunBenchmark('kml')) {
    const {default: kmlBench} = await import('../../modules/geospatial/test/kml/kml.bench');
    await kmlBench(suite);
  }

  if (shouldRunBenchmark('csv')) {
    const {default: csvBench} = await import('../../modules/tables/test/csv/csv.bench');
    await csvBench(suite);
  }

  if (shouldRunBenchmark('core')) {
    const {default: coreBench} = await import('../../modules/core/test/core.bench');
    await coreBench(suite);
  }

  if (shouldRunBenchmark('parquet')) {
    const {parquetBench} = await import('../../modules/tables/test/parquet/parquet.bench');
    await parquetBench(suite);
  }
  if (shouldRunBenchmark('ply')) {
    const {default: plyBench} = await import('../../modules/pointclouds/test/ply/ply-loader.bench');
    await plyBench(suite);
  }

  if (shouldRunBenchmark('json')) {
    const {default: jsonBench} = await import('../../modules/tables/test/json/json-loader.bench');
    await jsonBench(suite);
  }

  if (shouldRunBenchmark('3d-tiles')) {
    const {default: tiles3dBench} = await import(
      '../../modules/tiles-3d/test/3d-tiles/tiles-3d-loader.bench'
    );
    await tiles3dBench(suite);
  }

  // await mvtBench(suite);
  if (shouldRunBenchmark('loader-utils')) {
    const {default: loaderUtilsBench} = await import(
      '../../modules/core/test/loader-utils-package/loader-utils.bench'
    );
    await loaderUtilsBench(suite);
  }

  if (shouldRunBenchmark('images')) {
    const {default: imageBench} = await import('../../modules/images/test/images.bench');
    await imageBench(suite);
  }
  if (shouldRunBenchmark('crypto')) {
    const {default: cryptoBench} = await import('../../modules/crypto/test/crypto.bench');
    await cryptoBench(suite);
  }

  if (shouldRunBenchmark('draco')) {
    const {default: dracoBench} = await import('../../modules/scene/test/draco/draco.bench');
    await dracoBench(suite);
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
