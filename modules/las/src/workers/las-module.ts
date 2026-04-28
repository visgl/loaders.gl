export * from '../index';
import {createLoaderWorker} from '@loaders.gl/loader-utils';
import {LAZPerfLoaderWithParser} from '../lazperf-loader-with-parser';

createLoaderWorker({
  las: LAZPerfLoaderWithParser
});
