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

  t.ok(data.header, 'Documents were found');
  t.equal(data.attributes.vertices.length, 72, 'position attribute was found');
  t.equal(data.attributes.normals.length, 72, 'Color attribute was found');
  t.equal(data.attributes.indices.length, 36, 'Color attribute was found');

  t.end();
});

test('PLYLoader#parseBinary', t => {
  const data = PLYLoader.parseText(PLY_BINARY);

  t.ok(data.header, 'Documents were found');

  t.end();
});
