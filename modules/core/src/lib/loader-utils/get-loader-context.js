export function getLoaderContext(context, options) {
  context = {
    fetch: typeof window !== 'undefined' && window.fetch,
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
