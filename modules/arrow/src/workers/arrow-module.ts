export * from '../index';
import {createLoaderWorker} from '@loaders.gl/loader-utils';
import {ArrowLoaderWithParser} from '../arrow-loader-with-parser';

createLoaderWorker({
  arrow: ArrowLoaderWithParser
});
