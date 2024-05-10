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
import jsonBench from '@loaders.gl/json/test/json-loader.bench';
// import mvtBench from '@loaders.gl/mvt/test/mvt-loader.bench';
import {parquetBench} from '@loaders.gl/parquet/test/parquet.bench';
import shapefileBench from '@loaders.gl/shapefile/test/shapefile.bench';

import cryptoBench from '@loaders.gl/crypto/test/crypto.bench';
// import i3sLoaderBench from '@loaders.gl/i3s/test/i3s-loader.bench';

_addAliases(ALIASES);

// add benchmarks
export async function addModuleBenchmarksToSuite(suite) {
  await coreBench(suite);

  await parquetBench(suite);

  await jsonBench(suite);

  // await shapefileBench(suite);

  // await mvtBench(suite);
  await loaderUtilsBench(suite);

  await imageBench(suite);
  await cryptoBench(suite);

  await dracoBench(suite);
  await csvBench(suite);
  await excelBench(suite);

  // await i3sLoaderBench(suite);
}
