import {SyncDataType, LoaderObject} from '@loaders.gl/loader-utils';
/**
 * Parses `data` using a specified loader
 * @param data
 * @param loaders
 * @param options
 * @param context
 */
export function parseSync(
  data: SyncDataType,
  loaders?: LoaderObject | LoaderObject[],
  options?: object,
  context?: object
): any;
