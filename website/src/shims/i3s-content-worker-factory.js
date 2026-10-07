/** Creates the website's I3S worker from the same source revision as its main-thread loaders. */
export const I3S_CONTENT_WORKER_LOAD_WORKER = () =>
  typeof Worker === 'function'
    ? new Worker(
        new URL('../../../modules/i3s/src/workers/i3s-content-worker.ts', import.meta.url),
        {type: 'module'}
      )
    : null;
