import {LoaderObject} from '@loaders.gl/loader-utils';

/**
 * Set global loader options
 * @param options 
 */
export function setGlobalOptions(options: object): void;
  
/**
 * Merges options with global opts and loader defaults, also injects baseUri
 * @param loader 
 * @param options 
 * @param url 
 */
export function mergeOptions(loader: LoaderObject, options: object, url?: string): object;

/**
 * Global state for loaders.gl. Stored on `global.loaders._state`
 */
type GlobalLoaderState = {
  loaderRegistry: LoaderObject[];
  globalOptions: {[key: string]: any};
}

/**
 * Internal helper for safely accessing global loaders.gl variables
 */
export function getGlobalLoaderState(): GlobalLoaderState;
