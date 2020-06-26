import {LoaderContext} from '@loaders.gl/loader-utils';

/**
 *
 * @param context
 * @param options
 * @param previousContext
 */
export function getLoaderContext(context: object, options: object, previousContext?: LoaderContext | null): LoaderContext;

export function getLoaders(loaders, context);

/**
 * Extracts a fetch function from options, context or defaults to `fetchFile`
 * @param options
 * @param context
 */
export function getFetchFunction(options: object, context?: object): (url: string) => Response;
