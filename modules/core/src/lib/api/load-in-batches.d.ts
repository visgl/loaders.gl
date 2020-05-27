import {DataType, LoaderObject} from '../common';
/**
 * Parses `data` using a specified loader
 * @param data
 * @param loaders
 * @param options
 * @param context
 */
export function loadInBatches(url: string | File| Blob, loaders: LoaderObject | LoaderObject[], options?: object, context?: object): Promise<any>;
