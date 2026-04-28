export * from '../index';
import {createLoaderWorker} from '@loaders.gl/loader-utils';
import {QuantizedMeshLoaderWithParser} from '../quantized-mesh-loader-with-parser';
import {TerrainLoaderWithParser} from '../terrain-loader-with-parser';

createLoaderWorker({
  'quantized-mesh': QuantizedMeshLoaderWithParser,
  terrain: TerrainLoaderWithParser
});
