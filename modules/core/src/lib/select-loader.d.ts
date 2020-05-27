import {LoaderObject, LoaderContext} from './common';

/**
 * Find a loader that matches file extension and/or initial file content
 * Search the loaders array argument for a loader that matches url extension or initial data
 * Returns: a normalized loader
 * @param data data to assist
 * @param loaders 
 * @param options 
 * @param context context object
 */
export function selectLoader(
  loaders: LoaderObject[] | LoaderObject, 
  url?: string,
  data?: Response | ArrayBuffer | string, 
  options?: {
    nothrow?: boolean;
  }, 
);
