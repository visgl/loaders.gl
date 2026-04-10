// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {validateLoader} from 'test/common/conformance';

import {PLYArrowLoader} from '@loaders.gl/ply';
import {fetchFile, parse} from '@loaders.gl/core';

const PLY_CUBE_ATT_URL = '@loaders.gl/ply/test/data/cube_att.ply';

test('PLYArrowLoader#loader conformance', t => {
  validateLoader(t, PLYArrowLoader, 'PLYArrowLoader');
  t.end();
});

test('PLYArrowLoader#parse indexed cube', async t => {
  const table = await parse(fetchFile(PLY_CUBE_ATT_URL), PLYArrowLoader);

  t.equal(table.shape, 'arrow-table', 'table has arrow-table shape');
  t.deepEqual(
    table.data.schema.fields.map(field => field.name),
    ['POSITION', 'indices', 'NORMAL'],
    'indexed schema fields are first'
  );

  const indicesColumn = table.data.getChild('indices');
  t.ok(indicesColumn, 'indices column was found');
  t.equal(indicesColumn.get(0).length, 36, 'indices were found in row 0');
  t.equal(indicesColumn.get(1), null, 'indices are null after row 0');

  t.end();
});
