// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import * as jsonModule from '@loaders.gl/tables/json';
import {FastJSONLoader} from '@loaders.gl/tables/json/bundled';

test('JSON format exposes the primary metadata loaders', () => {
  expect(jsonModule.JSONLoader.id).toBe('json');
  expect(jsonModule.JSONTableLoader).toBeDefined();
  expect(jsonModule.GeoJSONLoader).toBeDefined();
  expect(jsonModule).not.toHaveProperty('_FastJSONLoader');
});

test('Fast JSON parser is available through the JSON format entrypoint', () => {
  expect(FastJSONLoader.parseTextSync('{"value": 42}')).toEqual({value: 42});
});
