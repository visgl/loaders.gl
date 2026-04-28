export * from '../index';
import {createLoaderWorker} from '@loaders.gl/loader-utils';
import {MVTLoaderWithParser} from '../mvt-loader-with-parser';
import {TileJSONLoaderWithParser} from '../tilejson-loader-with-parser';

createLoaderWorker({
  mvt: MVTLoaderWithParser,
  tilejson: TileJSONLoaderWithParser
});
