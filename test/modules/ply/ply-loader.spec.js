/* eslint-disable max-len */
import test from 'tape-catch';
import {loadBinaryFile} from '@loaders.gl/core';
import {PLYLoader} from '@loaders.gl/ply';
import path from 'path';

import PLY_ASCII from 'test-data/ply/cube_att.ply.js';

const PLY_BINARY =
  loadBinaryFile(path.resolve(__dirname, '../../data/ply/bun_zipper.ply')) ||
  require('test-data/ply/bun_zipper.ply');

test('PLYLoader#parseText', t => {
  const data = PLYLoader.parseText(PLY_ASCII);

  // Check loader specific results
  t.ok(data.loaderData.header, 'Original header found');

  // Check normalized

  t.ok(data.header, 'header found');
  t.equal(data.indices.value.length, 36, 'Indices found');

  const POSITION = data.glTFAttributeMap.POSITION;
  const NORMAL = data.glTFAttributeMap.NORMAL;
  t.equal(data.attributes[POSITION].value.length, 72, 'POSITION attribute was found');
  t.equal(data.attributes[NORMAL].value.length, 72, 'NORMAL attribute was found');

  t.end();
});

test('PLYLoader#parseBinary', t => {
  const data = PLYLoader.parseText(PLY_BINARY);

  // Check loader specific results
  t.ok(data.loaderData.header, 'Original header found');

  const POSITION = data.glTFAttributeMap.POSITION;
  t.equal(data.attributes[POSITION].value.length, 107841, 'POSITION attribute was found');

  t.end();
});
