import {getFetchFunction} from './option-utils';

export function getLoaderContext(context, options, previousContext = null) {
  // For recursive calls, we already have a context
  // TODO - add any additional loaders to context?
  if (previousContext) {
    return previousContext;
  }

  context = {
    fetch: getFetchFunction(options || {}, context),
    ...context
  };

  // Recursive loading does not use single loader
  if (!Array.isArray(context.loaders)) {
    context.loaders = null;
  }

  return context;
}

// eslint-disable-next-line complexity
export function getLoaders(loaders, context) {
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
