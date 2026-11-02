// SPDX-License-Identifier: MIT
import {createWorker, type WorkerContext} from '../../../src/worker-utils';

createWorker(
  async (input, options = {}, context, jobContext) => {
    if (options.estimate) return {execution: 'worker', byteLength: input.byteLength};
    if (options.echoZip) return options.zip;
    if (options.nested) return await requestNested(options, context);
    if (options.echoFetch)
      return new TextEncoder().encode(
        JSON.stringify({core: options.core.fetch, legacy: options.fetch})
      );
    if (options.fail) throw new TypeError('task failed');
    if (options.delay) await new Promise(resolve => setTimeout(resolve, options.delay));
    context?.reportProgress?.({phase: 'parse', completed: 1, total: 1, unit: 'items'});
    if (options.callback)
      return await context?.process?.(input, {...options, worker: false}, jobContext);
    return {input, context: jobContext};
  },
  async function* (inputs, options = {}, context, jobContext) {
    if (options.nested) {
      yield await requestNested(options, context);
      return;
    }
    let batchIndex = 0;
    for await (const input of inputs) {
      context?.reportProgress?.({phase: 'parse', completed: ++batchIndex, unit: 'batches'});
      yield {input, batchIndex, context: jobContext, option: options.marker};
    }
  }
);

/** Requests a selected nested loader without carrying callbacks over the task boundary. */
async function requestNested(options: Record<string, any>, context?: WorkerContext) {
  if (!context?.process) throw new Error('No calling-thread processor');
  return await context.process(
    new ArrayBuffer(1),
    {core: {worker: false}},
    options.emptyContext
      ? {}
      : {_loaderIds: options.loaderIds, _loaderIsArray: options.loaderIsArray, url: 'nested'}
  );
}
