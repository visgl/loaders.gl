// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import * as jsonModule from '@loaders.gl/tables';
import {FastJSONLoader} from '@loaders.gl/tables/json';

test('Tables root retains primary JSON metadata loaders without the fast backend', () => {
  expect(jsonModule.JSONLoader.id).toBe('json');
  expect(jsonModule.JSONTableLoader).toBeDefined();
  expect(jsonModule.GeoJSONLoader).toBeDefined();
  expect(jsonModule).not.toHaveProperty('_FastJSONLoader');
  expect(jsonModule).not.toHaveProperty('FastJSONLoader');
});

test('Fast JSON parser is available through the JSON format entrypoint', () => {
  expect(FastJSONLoader.parseTextSync('{"value": 42}')).toEqual({value: 42});
});
