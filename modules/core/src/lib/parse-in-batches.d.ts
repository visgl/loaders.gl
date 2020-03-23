import {DataType, LoaderObject} from './common';
/**
 * Parses `data` using a specified loader
 * @param data
 * @param loaders
 * @param options
 * @param context
 */
export function parseInBatches(data: DataType, loaders: LoaderObject | LoaderObject[], options?: object, context?: object): Promise<any>;
