// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {readFile} from 'node:fs/promises';

import {COPCSource} from '@loaders.gl/copc';

import {ellipsoidFilename} from './index';

test('COPCSource#Blob', async t => {
  const data = await readFile(ellipsoidFilename);
  const source = COPCSource.createDataSource(new Blob([data]), {});

  const metadata = await source.getMetadata();
  t.ok(metadata.formatSpecificMetadata, 'returns COPC metadata');

  const schema = await source.getSchema();
  t.ok(schema.fields.length > 0, 'returns schema fields');

  const point = await source.getPoints({nodeIndex: {x: 0, y: 0, z: 0, d: 0}});
  t.ok(point, 'returns root-node point data');
  t.equal(point?.length, schema.fields.length, 'returns one value per schema field');

  t.end();
});
