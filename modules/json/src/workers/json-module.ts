export * from '../index';
import {createLoaderWorker} from '@loaders.gl/loader-utils';
import {GeoJSONLoaderWithParser} from '../geojson-loader-with-parser';

createLoaderWorker({
  geojson: GeoJSONLoaderWithParser
});
