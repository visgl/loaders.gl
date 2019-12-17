import {load} from '@loaders.gl/core';
import {PLYLoader} from '@loaders.gl/ply';
import {getModel, drawModelInViewport} from '../test-utils/get-model';

const PLY_BINARY_URL =
  'https://raw.githubusercontent.com/uber-web/loaders.gl/master/modules/ply/test/data/bun_zipper.ply';

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
