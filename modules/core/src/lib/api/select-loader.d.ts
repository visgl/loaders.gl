import {LoaderObject, LoaderContext} from '@loaders.gl/loader-utils';

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
  data?: Response | Blob | ArrayBuffer | string,
  loaders?: LoaderObject[] | LoaderObject,
  options?: {
    nothrow?: boolean;
  },
  context?: LoaderContext | null
): Promise<LoaderObject>;

/**
 * Find a loader that matches file extension and/or initial file content
 * Search the loaders array argument for a loader that matches url extension or initial data
 * Returns: a normalized loader
 * @param data data to assist
 * @param loaders
 * @param options
 * @param context context object
 */
export function selectLoaderSync(
  data?: Response | Blob | ArrayBuffer | string,
  loaders?: LoaderObject[] | LoaderObject,
  options?: {
    nothrow?: boolean;
  },
  context?: LoaderContext | null
): LoaderObject;