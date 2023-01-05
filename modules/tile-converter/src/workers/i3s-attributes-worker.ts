import {createWorker} from '@loaders.gl/worker-utils';
import {convertAttributes} from '../i3s-converter/helpers/geometry-converter';

createWorker(
  async (data, options = {}) =>
    await convertAttributes(data, options.materialAndTextureList, options.useCartesianPositions)
);
