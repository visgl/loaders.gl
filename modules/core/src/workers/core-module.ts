export * from '../index';
import {createLoaderWorker} from '@loaders.gl/loader-utils';
import {NullLoader} from '../null-loader';

createLoaderWorker({
  null: NullLoader
});
