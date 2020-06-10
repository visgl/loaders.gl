import {BatchableDataType, LoaderObject} from '../common';
/**
 * Parses `data` using a specified loader
 * @param data
 * @param loaders
 * @param options
 * @param context
 */
export function parseInBatches(
  data: BatchableDataType,
  loaders: LoaderObject | LoaderObject[],
  options?: object, url?: string
): Promise<any>;
