import {DataType, LoaderObject} from '@loaders.gl/loader-utils';
/**
 * Parses `data` using a specified loader
 * @param data
 * @param loaders
 * @param options
 * @param context
 */
export function load(url: string | DataType, loaders: LoaderObject | LoaderObject[], options?: object, context?: object): Promise<any>;
