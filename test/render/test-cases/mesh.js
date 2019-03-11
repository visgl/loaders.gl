import {parseFileSync} from '@loaders.gl/core';
import {PLYLoader} from '@loaders.gl/ply';

import {getModel, drawModelInViewport} from '../test-utils/get-model';

const PLY_BINARY =
  // loadBinaryFile(path.resolve(__dirname, '../../ply/data/bun_zipper.ply')) ||
  require('@loaders.gl/ply/test/data/bun_zipper.ply');

export default [
  {
    name: 'PLYLoader',
    goldenImage: './test/render/golden-images/ply-loader.png',
    onRender: ({gl}) => {
      const model = getModel(gl, parseFileSync(PLY_BINARY, PLYLoader));
      drawModelInViewport(model, {zoom: 50, lookAt: [0, 0.11, 0]}, {opacity: 0.5});
    }
  }
];
