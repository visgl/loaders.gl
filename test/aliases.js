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

const path = require('path');
const {addAliases} = require('@loaders.gl/core/read-file/file-aliases');

// NOTE - this cannot be replaced with ocular-dev-tools because it is required in browser
const makeAliases = () => ({
  test: path.resolve(__dirname, '../test'),
  '@loaders.gl/core': path.resolve(__dirname, '../modules/core'),
  '@loaders.gl/draco': path.resolve(__dirname, '../modules/draco'),
  '@loaders.gl/experimental': path.resolve(__dirname, '../modules/experimental'),
  '@loaders.gl/images': path.resolve(__dirname, '../modules/images'),
  '@loaders.gl/gltf': path.resolve(__dirname, '../modules/gltf'),
  '@loaders.gl/kml': path.resolve(__dirname, '../modules/kml'),
  '@loaders.gl/las': path.resolve(__dirname, '../modules/las'),
  '@loaders.gl/obj': path.resolve(__dirname, '../modules/obj'),
  '@loaders.gl/pcd': path.resolve(__dirname, '../modules/pcd'),
  '@loaders.gl/ply': path.resolve(__dirname, '../modules/ply'),
  '@loaders.gl/zip': path.resolve(__dirname, '../modules/zip'),
  '@loaders.gl/arrow': path.resolve(__dirname, '../modules/arrow')
});

const ALIASES = makeAliases();

addAliases(ALIASES);

module.exports = ALIASES;
