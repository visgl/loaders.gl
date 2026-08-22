// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';

import {createBenchmarkPageUrl} from '../scripts/run-browser-benchmarks.mjs';

describe('browser benchmark runner', () => {
  test('passes selected benchmark modules to the browser', () => {
    const benchmarkUrl = new URL(
      createBenchmarkPageUrl('http://127.0.0.1:5173', ['parquet', 'loader-utils'])
    );

    expect(benchmarkUrl.pathname).toBe('/test/bench/index.html');
    expect(benchmarkUrl.searchParams.getAll('module')).toEqual(['parquet', 'loader-utils']);
  });
});
