export * from '../index';
import {createLoaderWorker} from '@loaders.gl/loader-utils';
import {PLYLoaderWithParser} from '../ply-loader-with-parser';

createLoaderWorker({
  ply: PLYLoaderWithParser
});
