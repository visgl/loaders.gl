import {DataType, LoaderObject} from '../common';
/**
 * Parses `data` using a specified loader
 * @param data
 * @param loaders
 * @param options
 * @param context
 */
export function load(url: string | ArrayBuffer | File | Blob | Response | ReadableStream, loaders: LoaderObject | LoaderObject[], options?: object, context?: object): Promise<any>;
