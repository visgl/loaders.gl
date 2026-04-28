export * from '../index';
import {createLoaderWorker} from '@loaders.gl/loader-utils';
import {DBFArrowLoaderWithParser} from '../dbf-arrow-loader-with-parser';
import {DBFLoaderWithParser} from '../dbf-loader-with-parser';
import {SHPLoaderWithParser} from '../shp-loader-with-parser';

createLoaderWorker({
  dbf: DBFLoaderWithParser,
  'dbf-arrow': DBFArrowLoaderWithParser,
  shp: SHPLoaderWithParser
});
