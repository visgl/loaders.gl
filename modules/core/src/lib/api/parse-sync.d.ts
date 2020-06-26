import {SyncDataType, LoaderObject} from '../common';
/**
 * Parses `data` using a specified loader
 * @param data
 * @param loaders
 * @param options
 * @param context
 */
export function parseSync(data: SyncDataType, loaders: LoaderObject | LoaderObject[], options?: object, context?: object): any;

/** @deprecated parse with URL as last parameter is deprecated */
export function parseSync(data: SyncDataType, loaders: LoaderObject | LoaderObject[], options: object, url: string): any;
