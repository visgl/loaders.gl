import {LoaderObject, LoaderContext} from '@loaders.gl/loader-utils';

/**
 * Global state for loaders.gl. Stored on `global.loaders._state`
 */
type GlobalLoaderState = {
  loaderRegistry: LoaderObject[];
  globalOptions: {[key: string]: any};
};

/**
 * Helper for safely accessing global loaders.gl variables
 */
export function getGlobalLoaderState(): GlobalLoaderState;

/**
 * Set global loader options
 * @param options
 */
export function setGlobalOptions(options: object): void;

/**
 * Merges options with global opts and loader defaults, also injects baseUri
 * @param options
 * @param loader
 * @param loaders
 * @param url
 */
export function normalizeOptions(
  options: object,
  loader: LoaderObject,
  loaders?: LoaderObject[],
  url?: string
): object;

/**
 * Gets the current fetch function from options and context
 * @param options
 * @param context
 */
export function getFetchFunction(options: object, context?: LoaderContext);
