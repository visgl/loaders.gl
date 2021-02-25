import {DataType, WorkerLoaderObject, LoaderObject} from '@loaders.gl/loader-utils';
/**
 * Parses `data` using a specified loader
 * @param data
 * @param loaders
 * @param options
 * @param context
 */
export function load(
  url: string | DataType,
  loaders: WorkerLoaderObject | LoaderObject | (WorkerLoaderObject | LoaderObject)[],
  options?: object,
  context?: object
): Promise<any>;
