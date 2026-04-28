import '@loaders.gl/polyfills';
export * from '../index';
import {createLoaderWorker} from '@loaders.gl/loader-utils';
import {DracoLoaderWithParser} from '../draco-loader-with-parser';

createLoaderWorker({
  draco: DracoLoaderWithParser
});
