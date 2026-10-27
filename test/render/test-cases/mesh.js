// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {load} from '@loaders.gl/core';
import {PLYLoader} from '@loaders.gl/pointclouds/ply';
import {getModel, drawModelInViewport} from '../test-utils/get-model';
import {LOADERS_GL_RAW_FIXTURE_URL} from '@loaders.gl/core/constants';

const PLY_BINARY_URL = `${LOADERS_GL_RAW_FIXTURE_URL}modules/pointclouds/test/ply/data/bun_zipper.ply`;

export default [
  {
    name: 'PLYLoader',
    goldenImage: './test/render/golden-images/ply-loader.png',
    onInitialize: async ({gl}) => {
      const model = getModel(gl, await load(PLY_BINARY_URL, PLYLoader));
      return {model};
    },
    onRender: ({model, done}) => {
      drawModelInViewport(model, {zoom: 50, lookAt: [0, 0.11, 0]}, {opacity: 0.5});
      done();
    }
  }
];
