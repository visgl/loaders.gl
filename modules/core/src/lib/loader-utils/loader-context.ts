import type {Loader, LoaderOptions, LoaderContext} from '@loaders.gl/loader-utils';
import {getFetchFunction} from './option-utils';

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
  context: Omit<LoaderContext, 'fetch'> & Partial<Pick<LoaderContext, 'fetch'>>,
  options?: LoaderOptions,
  previousContext: LoaderContext | null = null
): LoaderContext {
  // For recursive calls, we already have a context
  // TODO - add any additional loaders to context?
  if (previousContext) {
    return previousContext;
  }

  const resolvedContext: LoaderContext = {
    fetch: getFetchFunction(options, context),
    ...context
  };

  // Recursive loading does not use single loader
  if (!Array.isArray(resolvedContext.loaders)) {
    resolvedContext.loaders = null;
  }

  return resolvedContext;
}

// eslint-disable-next-line complexity
export function getLoadersFromContext(
  loaders: Loader[] | Loader | undefined,
  context?: LoaderContext
) {
  // A single non-array loader is force selected, but only on top-level (context === null)
  if (!context && loaders && !Array.isArray(loaders)) {
    return loaders;
  }

  // Create a merged list
  let candidateLoaders;
  if (loaders) {
    candidateLoaders = Array.isArray(loaders) ? loaders : [loaders];
  }
  if (context && context.loaders) {
    const contextLoaders = Array.isArray(context.loaders) ? context.loaders : [context.loaders];
    candidateLoaders = candidateLoaders ? [...candidateLoaders, ...contextLoaders] : contextLoaders;
  }
  // If no loaders, return null to look in globally registered loaders
  return candidateLoaders && candidateLoaders.length ? candidateLoaders : null;
}
