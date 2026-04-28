import '@loaders.gl/polyfills';
export * from '../index';
import {createLoaderWorker} from '@loaders.gl/loader-utils';
import {I3SContentLoaderWithParser} from '../i3s-content-loader-with-parser';

createLoaderWorker({
  'i3s-content': I3SContentLoaderWithParser
});
