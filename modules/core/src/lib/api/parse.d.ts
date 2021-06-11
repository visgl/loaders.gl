import {DataType, LoaderObject, LoaderContext} from '@loaders.gl/loader-utils';
/**
 * Parses `data` using a specified loader
 * @param data
 * @param loaders
 * @param options
 * @param context
 */
export function parse(
  data: DataType | Promise<DataType>,
  loaders?: LoaderObject | LoaderObject[],
  options?: object,
  context?: LoaderContext
): Promise<any>;
