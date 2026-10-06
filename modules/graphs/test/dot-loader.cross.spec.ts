// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {parse, parseSync} from '@loaders.gl/core';
import {DOTLoader} from '../src';
import {DOTLoaderWithParser} from '../src/dot-loader';

const DOCUMENT = 'digraph Example { a -> b [weight=2]; }';

test('DOT root loader agrees with direct parser entrypoints', async () => {
  expect('parseSync' in DOTLoader).toBe(true);
  const text = parseSync(DOCUMENT, DOTLoaderWithParser);
  const buffer = new TextEncoder().encode(DOCUMENT).buffer;
  expect(await parse(DOCUMENT, DOTLoader)).toEqual(text);
  expect(parseSync(buffer, DOTLoaderWithParser)).toEqual(text);
  expect(await DOTLoaderWithParser.parse(buffer)).toEqual(text);
  expect(text.nodes.map((node) => node.id)).toEqual(['a', 'b']);
  expect(text.edges[0]).toMatchObject({
    sourceId: 'a',
    targetId: 'b',
    directed: true,
    attributes: {weight: 2}
  });
});
