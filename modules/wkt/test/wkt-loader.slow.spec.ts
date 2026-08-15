// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {test} from 'vitest';
import {parseSync} from '@loaders.gl/core';
import {WKTLoader} from '@loaders.gl/wkt/bundled';
import fuzzer from 'fuzzer';

const WKT_FUZZ_INPUTS = [
  'MULTIPOLYGON (((30 20, 10 40, 45 40, 30 20)), ((15 5, 40 10, 10 20, 5 10, 15 5)))',
  'POINT(1.1 1.1)',
  'LINESTRING (30 10, 10 30, 40 40)',
  'GeometryCollection(POINT(4 6),\nLINESTRING(4 6,7 10))'
];

test('WKTLoader#deterministic 10,000-iteration fuzz corpus', () => {
  fuzzer.seed(0);
  for (const source of WKT_FUZZ_INPUTS) {
    for (let iteration = 0; iteration < 10_000; iteration++) {
      const input = fuzzer.mutate.string(source);
      try {
        parseSync(input, WKTLoader);
      } catch (error) {
        throw new Error(`Could not parse ${input}`, {cause: error});
      }
    }
  }
});
