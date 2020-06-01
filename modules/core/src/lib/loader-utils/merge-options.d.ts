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