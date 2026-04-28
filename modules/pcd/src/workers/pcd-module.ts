export * from '../index';
import {createLoaderWorker} from '@loaders.gl/loader-utils';
import {PCDLoaderWithParser} from '../pcd-loader-with-parser';

createLoaderWorker({
  pcd: PCDLoaderWithParser
});
