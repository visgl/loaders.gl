export * from '../index';
import {createLoaderWorker} from '@loaders.gl/loader-utils';
import {MTLLoaderWithParser} from '../mtl-loader-with-parser';
import {OBJLoaderWithParser} from '../obj-loader-with-parser';

createLoaderWorker({
  mtl: MTLLoaderWithParser,
  obj: OBJLoaderWithParser
});
