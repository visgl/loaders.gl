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
function makeAliases(basename = __dirname) {
  return {
    test: path.resolve(basename, '../test'),
    '@loaders.gl/3d-tiles/test': path.resolve(basename, '../modules/3d-tiles/test'),
    '@loaders.gl/arrow/test': path.resolve(basename, '../modules/arrow/test'),
    '@loaders.gl/basis/test': path.resolve(basename, '../modules/basis/test'),
    '@loaders.gl/compression/test': path.resolve(basename, '../modules/compression/test'),
    '@loaders.gl/crypto/test': path.resolve(basename, '../modules/crypto/test'),
    '@loaders.gl/core/test': path.resolve(basename, '../modules/core/test'),
    '@loaders.gl/csv/test': path.resolve(basename, '../modules/csv/test'),
    '@loaders.gl/draco/test': path.resolve(basename, '../modules/draco/test'),
    '@loaders.gl/gis/test': path.resolve(basename, '../modules/gis/test'),
    '@loaders.gl/gltf/test': path.resolve(basename, '../modules/gltf/test'),
    '@loaders.gl/i3s/test': path.resolve(basename, '../modules/i3s/test'),
    '@loaders.gl/images/test': path.resolve(basename, '../modules/images/test'),
    '@loaders.gl/json/test': path.resolve(basename, '../modules/json/test'),
    '@loaders.gl/kml/test': path.resolve(basename, '../modules/kml/test'),
    '@loaders.gl/las/test': path.resolve(basename, '../modules/las/test'),
    '@loaders.gl/mvt/test': path.resolve(basename, '../modules/mvt/test'),
    '@loaders.gl/obj/test': path.resolve(basename, '../modules/obj/test'),
    '@loaders.gl/pcd/test': path.resolve(basename, '../modules/pcd/test'),
    '@loaders.gl/ply/test': path.resolve(basename, '../modules/ply/test'),
    '@loaders.gl/polyfills/test': path.resolve(basename, '../modules/polyfills/test'),
    '@loaders.gl/potree/test': path.resolve(basename, '../modules/potree/test'),
    '@loaders.gl/shapefile/test': path.resolve(basename, '../modules/shapefile/test'),
    '@loaders.gl/tables/test': path.resolve(basename, '../modules/tables/test'),
    '@loaders.gl/terrain/test': path.resolve(basename, '../modules/terrain/test'),
    '@loaders.gl/tiles/test': path.resolve(basename, '../modules/tiles/test'),
    '@loaders.gl/video/test': path.resolve(basename, '../modules/video/test'),
    '@loaders.gl/wkt/test': path.resolve(basename, '../modules/wkt/test'),
    '@loaders.gl/zip/test': path.resolve(basename, '../modules/zip/test')
  };
}

module.exports = makeAliases();
