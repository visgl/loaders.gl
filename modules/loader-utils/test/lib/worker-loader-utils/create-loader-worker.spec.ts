// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import type {LoaderWithParser} from '../../../src';
import {selectLoaderForWorkerMessage} from '../../../src/lib/worker-loader-utils/create-loader-worker';

function createTestLoader(id: string): LoaderWithParser {
  return {
    name: id,
    id,
    module: 'loader-utils',
    version: 'latest',
    category: 'test',
    extensions: [],
    mimeTypes: [],
    tests: [],
    options: {},
    parseSync: arrayBuffer => arrayBuffer
  } as LoaderWithParser;
}

test('selectLoaderForWorkerMessage dispatches registry loaders by loaderId', () => {
  const jsonLoader = createTestLoader('json');
  const geojsonLoader = createTestLoader('geojson');

  expect(selectLoaderForWorkerMessage({json: jsonLoader, geojson: geojsonLoader}, 'geojson')).toBe(
    geojsonLoader
  );
});

test('selectLoaderForWorkerMessage dispatches array loaders by loaderId', () => {
  const jsonLoader = createTestLoader('json');
  const geojsonLoader = createTestLoader('geojson');

  expect(selectLoaderForWorkerMessage([jsonLoader, geojsonLoader], 'json')).toBe(jsonLoader);
});

test('selectLoaderForWorkerMessage requires loaderId for combined workers', () => {
  const jsonLoader = createTestLoader('json');
  const geojsonLoader = createTestLoader('geojson');

  expect(() => selectLoaderForWorkerMessage({json: jsonLoader, geojson: geojsonLoader})).toThrow(
    'loaderId is required when using a combined loader worker'
  );
});

test('selectLoaderForWorkerMessage rejects unknown loaderId for combined workers', () => {
  const jsonLoader = createTestLoader('json');
  const geojsonLoader = createTestLoader('geojson');

  expect(() =>
    selectLoaderForWorkerMessage({json: jsonLoader, geojson: geojsonLoader}, 'unknown')
  ).toThrow('No loader registered for loaderId unknown');
});

test('selectLoaderForWorkerMessage keeps single-loader worker compatibility', () => {
  const jsonLoader = createTestLoader('json');

  expect(selectLoaderForWorkerMessage(jsonLoader)).toBe(jsonLoader);
});
