export * from '../index';
import {createLoaderWorker} from '@loaders.gl/loader-utils';
import {ExcelLoaderWithParser} from '../excel-loader-with-parser';

createLoaderWorker({
  excel: ExcelLoaderWithParser
});
