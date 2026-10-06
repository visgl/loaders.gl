// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {parse, parseSync} from '@loaders.gl/core';
import {GEXFLoader} from '../src';
import {GEXFLoaderWithParser} from '../src/gexf-loader';

const DOCUMENT = '<gexf version="1.3"><graph><nodes><node id="n"/></nodes><edges/></graph></gexf>';

test('GEXF metadata preloads Arrow parsing and sync parsing supports object rows', async () => {
  expect(GEXFLoader).not.toHaveProperty('parse');
  expect(GEXFLoader.extensions).toEqual(['gexf']);
  expect(GEXFLoader.mimeTypes).toEqual(['application/gexf+xml']);
  const graph = await parse(DOCUMENT, GEXFLoader);
  expect(graph.shape).toBe('tables');
  if (graph.shape !== 'tables' || graph.tables[0].table.shape !== 'arrow-table')
    throw new Error('Expected Arrow output.');
  expect(graph.tables[0].table.data.getChild('id')!.get(0)).toBe('n');
  const rows = parseSync(DOCUMENT, GEXFLoaderWithParser, {gexf: {shape: 'object-row-table'}});
  if (rows.shape !== 'tables' || rows.tables[0].table.shape !== 'object-row-table')
    throw new Error('Expected object rows.');
  expect(rows.tables[0].table.data).toEqual([{id: 'n', label: null, attributes: {}}]);
});
