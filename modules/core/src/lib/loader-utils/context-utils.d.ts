import {LoaderContext} from '@loaders.gl/loader-utils';

/**
 * "sub" loaders invoked by other loaders get a "context" injected on `this`
 * The context will inject core methods like `parse` and contain information
 * about loaders and options passed in to the top-level `parse` call.
 *
 * @param context
 * @param options
 * @param previousContext
 */
export function getLoaderContext(
  context: object,
  options: object,
  previousContext?: LoaderContext | null
): LoaderContext;

export function getLoaders(loaders, context);
