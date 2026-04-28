export * from '../index';
import {createLoaderWorker} from '@loaders.gl/loader-utils';
import {LERCLoaderWithParser} from '../lerc-loader-with-parser';

createLoaderWorker({
  lerc: LERCLoaderWithParser
});
