export * from '../index';
import {createLoaderWorker} from '@loaders.gl/loader-utils';
import {FlatGeobufLoaderWithParser} from '../flatgeobuf-loader-with-parser';

createLoaderWorker({
  flatgeobuf: FlatGeobufLoaderWithParser
});
