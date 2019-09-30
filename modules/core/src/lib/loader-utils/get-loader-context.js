// "sub" loaders invoked by other loaders get a "context" injected on `this`
// The context will inject core methods like `parse` and contain information
// about loaders and options passed in to the top-level `parse` call.
import {fetchFile} from '../fetch/fetch-file';

export function getLoaderContext(context, options, previousContext) {
  // For recursive calls, we already have a context
  // TODO - add any additional loaders to context?
  if (previousContext) {
    return previousContext;
  }
  context = {
    // TODO - determine how to inject fetch, fetch in options etc
    fetch: context.fetch || fetchFile,
    ...context
  };

  // Recursive loading does not use single loader
  if (!Array.isArray(context.loaders)) {
    context.loaders = null;
  }

  return context;
}

export function getLoaders(loaders, context) {
  // A single non-array loader is force selected, but only on top-level (context === null)
  if (!context && !Array.isArray(loaders)) {
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
