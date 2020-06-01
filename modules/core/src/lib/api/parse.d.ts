import {DataType, LoaderObject} from '../common';
/**
 * Parses `data` using a specified loader
 * @param data
 * @param loaders
 * @param options
 * @param context
 */
export function parse(
  data: DataType | Promise<DataType>,
  loaders: LoaderObject | LoaderObject[],
  options?: object,
  context?: object
): Promise<any>;

/** @deprecated parse with URL as last parameter is deprecated */
export function parse(
  data: DataType | Promise<DataType>,
  loaders: LoaderObject | LoaderObject[],
  options: object,
  url: string
): Promise<any>;
