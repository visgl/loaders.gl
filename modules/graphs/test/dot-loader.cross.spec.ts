// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {parse, parseSync} from '@loaders.gl/core';
import {DOTLoader} from '../src';
import {DOTLoaderWithParser} from '../src/dot-loader';

const PLAIN_OPTIONS = {dot: {shape: 'plain-graph-data' as const}};

const DOCUMENT = 'digraph Example { a -> b [weight=2]; }';

test('DOT metadata loader preloads through core and agrees with direct parser entrypoints', async () => {
  expect('parseSync' in DOTLoader).toBe(false);
  const text = parseSync(DOCUMENT, DOTLoaderWithParser, PLAIN_OPTIONS);
  const buffer = new TextEncoder().encode(DOCUMENT).buffer;
  expect(await parse(DOCUMENT, DOTLoader, PLAIN_OPTIONS)).toEqual(text);
  expect(parseSync(buffer, DOTLoaderWithParser, PLAIN_OPTIONS)).toEqual(text);
  expect(await DOTLoaderWithParser.parse(buffer, PLAIN_OPTIONS)).toEqual(text);
  if (text.shape !== 'plain-graph-data') throw new Error('Expected plain graph records');
  expect(text.nodes.map(node => node.id)).toEqual(['a', 'b']);
  expect(text.edges[0]).toMatchObject({
    sourceId: 'a',
    targetId: 'b',
    directed: true,
    attributes: {weight: 2}
  });
});
