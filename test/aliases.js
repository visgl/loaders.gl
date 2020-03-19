// Copyright (c) 2015 - 2017 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');

// NOTE - Replace with a transform of ocular-dev-tools aliases?
const makeAliases = () => ({
  test: path.resolve(__dirname, '../test'),
  '@loaders.gl/3d-tiles/test': path.resolve(__dirname, '../modules/3d-tiles/test'),
  '@loaders.gl/arrow/test': path.resolve(__dirname, '../modules/arrow/test'),
  '@loaders.gl/basis/test': path.resolve(__dirname, '../modules/basis/test'),
  '@loaders.gl/core/test': path.resolve(__dirname, '../modules/core/test'),
  '@loaders.gl/csv/test': path.resolve(__dirname, '../modules/csv/test'),
  '@loaders.gl/draco/test': path.resolve(__dirname, '../modules/draco/test'),
  '@loaders.gl/images/test': path.resolve(__dirname, '../modules/images/test'),
  '@loaders.gl/gis/test': path.resolve(__dirname, '../modules/gis/test'),
  '@loaders.gl/gltf/test': path.resolve(__dirname, '../modules/gltf/test'),
  '@loaders.gl/json/test': path.resolve(__dirname, '../modules/json/test'),
  '@loaders.gl/kml/test': path.resolve(__dirname, '../modules/kml/test'),
  '@loaders.gl/i3s/test': path.resolve(__dirname, '../modules/i3s/test'),
  '@loaders.gl/las/test': path.resolve(__dirname, '../modules/las/test'),
  '@loaders.gl/mvt/test': path.resolve(__dirname, '../modules/mvt/test'),
  '@loaders.gl/obj/test': path.resolve(__dirname, '../modules/obj/test'),
  '@loaders.gl/pcd/test': path.resolve(__dirname, '../modules/pcd/test'),
  '@loaders.gl/ply/test': path.resolve(__dirname, '../modules/ply/test'),
  '@loaders.gl/potree/test': path.resolve(__dirname, '../modules/potree/test'),
  '@loaders.gl/tables/test': path.resolve(__dirname, '../modules/tables/test'),
  '@loaders.gl/terrain/test': path.resolve(__dirname, '../modules/terrain/test'),
  '@loaders.gl/tiles/test': path.resolve(__dirname, '../modules/tiles/test'),
  '@loaders.gl/wkt/test': path.resolve(__dirname, '../modules/wkt/test'),
  '@loaders.gl/zip/test': path.resolve(__dirname, '../modules/zip/test')
});

const ALIASES = makeAliases();

module.exports = ALIASES;
