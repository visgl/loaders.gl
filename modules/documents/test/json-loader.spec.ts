// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {parse, parseSync} from '@loaders.gl/core';
import {JSONLoader, JSONFormat} from '@loaders.gl/documents';
import {JSONLoaderWithParser} from '@loaders.gl/documents/json-loader';

test.each([
  'null',
  'false',
  '42',
  '"text"',
  '[1,{"x":true}]',
  '{"rows":[{"x":1}]}'
])('generic JSON preserves the JSON value in %s', async text => {
  expect(await parse(text, JSONLoader)).toEqual(JSON.parse(text));
  expect(parseSync(text, JSONLoaderWithParser)).toEqual(JSON.parse(text));
  expect(await JSONLoaderWithParser.parse(new TextEncoder().encode(text).buffer)).toEqual(
    JSON.parse(text)
  );
});

test('generic JSON stays lazy, supports a BOM and never materializes tables', () => {
  expect(JSONLoader).toMatchObject(JSONFormat);
  expect(JSONLoader).not.toHaveProperty('parse');
  expect(JSONLoaderWithParser.parseTextSync('\uFEFF{"x":1}')).toEqual({x: 1});
  expect(JSONLoaderWithParser.parseTextSync('{"__proto__":{"safe":true}}')).toEqual(
    JSON.parse('{"__proto__":{"safe":true}}')
  );
  expect(() => JSONLoaderWithParser.parseTextSync('{broken')).toThrow(SyntaxError);
  expect(() => JSONLoaderWithParser.parseTextSync('1 2')).toThrow(SyntaxError);
});
