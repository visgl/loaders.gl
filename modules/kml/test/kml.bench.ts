// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {fetchFile, load} from '@loaders.gl/core';
import {GPXLoader, KMLLoader, TCXLoader} from '@loaders.gl/kml';

const KML_URL = '@loaders.gl/kml/test/data/kml/KML_Samples.kml';
const GPX_URL = '@loaders.gl/kml/test/data/gpx/trek.gpx';
const TCX_URL = '@loaders.gl/kml/test/data/tcx/tcx_sample.tcx';
const ROW_BENCHMARK_OPTIONS = {multiplier: 1, unit: 'rows'};

export default async function kmlBench(suite) {
  suite = suite.group('KMLLoader');
  await addLoaderBenchmarks(suite, KMLLoader, KML_URL, 'kml');

  suite = suite.group('GPXLoader');
  await addLoaderBenchmarks(suite, GPXLoader, GPX_URL, 'gpx');

  suite = suite.group('TCXLoader');
  await addLoaderBenchmarks(suite, TCXLoader, TCX_URL, 'tcx');
}

async function addLoaderBenchmarks(suite, loader, url, optionName) {
  const response = await fetchFile(url);
  const text = await response.text();

  suite.addAsync('load arrow-table geoarrow.wkb', ROW_BENCHMARK_OPTIONS, async () => {
    await load(text, loader, {
      [optionName]: {shape: 'arrow-table'}
    });
  });

  suite.addAsync('load geojson-table', ROW_BENCHMARK_OPTIONS, async () => {
    await load(text, loader, {
      [optionName]: {shape: 'geojson-table'}
    });
  });
}
