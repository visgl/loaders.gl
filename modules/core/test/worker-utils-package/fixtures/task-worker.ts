// SPDX-License-Identifier: MIT
import {createWorker} from '../../../src/worker-utils';

createWorker(
  async (input, options = {}, context, jobContext) => {
    if (options.echoFetch)
      return new TextEncoder().encode(
        JSON.stringify({core: options.core.fetch, legacy: options.fetch})
      );
    if (options.fail) throw new TypeError('task failed');
    if (options.delay) await new Promise(resolve => setTimeout(resolve, options.delay));
    context?.reportProgress?.({phase: 'parse', completed: 1, total: 1, unit: 'items'});
    if (options.callback)
      return await context?.process?.(input, {...options, worker: false}, undefined, jobContext);
    return {input, context: jobContext};
  },
  async function* (inputs, options = {}, context, jobContext) {
    let batchIndex = 0;
    for await (const input of inputs) {
      context?.reportProgress?.({phase: 'parse', completed: ++batchIndex, unit: 'batches'});
      yield {input, batchIndex, context: jobContext, option: options.marker};
    }
  }
);
