/* eslint-disable max-len */
import test from 'tape-catch';
import {loadBinaryFile, PLYLoader} from 'loaders.gl';
import path from 'path';

import PLY_ASCII from '../data/ply/cube_att.ply.js';

const PLY_BINARY =
  loadBinaryFile(path.resolve(__dirname, '../data/ply/bun_zipper.ply')) ||
  require('../data/ply/bun_zipper.ply');

test('PLYLoader#parseText', t => {
  const data = PLYLoader.parseText(PLY_ASCII);

  // Check loader specific results
  t.ok(data.loaderData.header, 'Original header found');

  t.equal(data.loaderData.attributes.indices.length, 36, 'Index attribute was found');
  t.equal(data.loaderData.attributes.vertices.length, 72, 'vertices attribute was found');
  t.equal(data.loaderData.attributes.normals.length, 72, 'normals attribute was found');

  // Check loader specific results

  t.ok(data.header, 'header found');
  t.equal(data.indices.length, 36, 'Indices found');
  t.equal(data.attributes.POSITION.bufferView.length, 72, 'POSITION attribute was found');
  t.equal(data.attributes.NORMAL.bufferView.length, 72, 'NORMAL attribute was found');

  t.end();
});

test('PLYLoader#parseBinary', t => {
  const data = PLYLoader.parseText(PLY_BINARY);

  // Check loader specific results
  t.ok(data.loaderData.header, 'Original header found');

  t.end();
});
