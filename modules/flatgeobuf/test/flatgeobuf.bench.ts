// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {fetchFile, load} from '@loaders.gl/core';
import {FlatGeobufLoader} from '@loaders.gl/flatgeobuf';

const FLATGEOBUF_COUNTRIES_DATA_URL = '@loaders.gl/flatgeobuf/test/data/countries.fgb';
const ROW_BENCHMARK_OPTIONS = {multiplier: 179, unit: 'rows'};

export default async function flatgeobufBench(suite) {
  const response = await fetchFile(FLATGEOBUF_COUNTRIES_DATA_URL);
  const arrayBuffer = await response.arrayBuffer();

  suite = suite.group('FlatGeobufLoader');

  suite.addAsync('load arrow-table geoarrow.wkb', ROW_BENCHMARK_OPTIONS, async () => {
    await load(arrayBuffer.slice(0), FlatGeobufLoader, {
      core: {worker: false},
      flatgeobuf: {shape: 'arrow-table'}
    });
  });

  suite.addAsync('load geojson-table', ROW_BENCHMARK_OPTIONS, async () => {
    await load(arrayBuffer.slice(0), FlatGeobufLoader, {
      core: {worker: false},
      flatgeobuf: {shape: 'geojson-table'}
    });
  });
}
