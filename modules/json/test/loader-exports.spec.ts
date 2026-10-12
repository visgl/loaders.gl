// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import * as json from '@loaders.gl/json';
import {FastJSONLoader} from '@loaders.gl/json/fast-json-loader';

test('JSON root retains primary loaders without the fast backend', () => {
  expect(json.JSONLoader.id).toBe('json');
  expect(json.JSONTableLoader).toBeDefined();
  expect(json.GeoJSONLoader).toBeDefined();
  expect(json).not.toHaveProperty('_FastJSONLoader');
  expect(json).not.toHaveProperty('FastJSONLoader');
});

test('Fast JSON parser is available through its public subpath', () => {
  expect(FastJSONLoader.parseTextSync('{"value": 42}')).toEqual({value: 42});
});
