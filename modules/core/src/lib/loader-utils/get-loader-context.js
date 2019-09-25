// "sub" loaders invoked by other loaders get a "context" injected on `this`
// The context will inject core methods like `parse` and contain information
// about loaders and options passed in to the top-level `parse` call.

export function getLoaderContext(context, options, previousContext) {
  // For recursive calls, we already have a context
  // TODO - add any additional loaders to context?
  if (previousContext) {
    return previousContext;
  }
  context = {
    // TODO - determine how to inject fetch, fetch in options etc
    fetch: context.fetch || (typeof window !== 'undefined' && window.fetch),
    ...context
  };

  // Make context available to parse functions by binding it to `this`
  if (context.parse) {
    context.parse = context.parse.bind(context);
  }
  if (context.parseSync) {
    context.parseSync = context.parseSync.bind(context);
  }
  if (context.parseInBatches) {
    context.parseInBatches = context.parseInBatches.bind(context);
  }
  if (context.parseInBatchesSync) {
    context.parseInBatchesSync = context.parseSync.bind(context);
  }

  return context;
}

export function getLoaders(loaders, context) {
  // A single non-array loader disables lookup in context
  if (!Array.isArray(loaders)) {
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
  return candidateLoaders;
}
