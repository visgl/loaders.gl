// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import * as jsonModule from '@loaders.gl/tables/json/index';
import {FastJSONLoader} from '@loaders.gl/tables/fast-json-loader';

test('JSON root retains primary loaders without the fast backend', () => {
  expect(jsonModule.JSONLoader.id).toBe('json');
  expect(jsonModule.JSONTableLoader).toBeDefined();
  expect(jsonModule.GeoJSONLoader).toBeDefined();
  expect(jsonModule).not.toHaveProperty('_FastJSONLoader');
  expect(jsonModule).not.toHaveProperty('FastJSONLoader');
});

test('Fast JSON parser is available through its public subpath', () => {
  expect(FastJSONLoader.parseTextSync('{"value": 42}')).toEqual({value: 42});
});
