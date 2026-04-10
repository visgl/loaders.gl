// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Polyfills increases the bundle size significantly. Use it for NodeJS worker only
import '@loaders.gl/polyfills';
import {WorkerBody, WorkerMessagePayload} from '@loaders.gl/worker-utils';
import {KTX2BasisWriter, KTX2BasisWriterOptions} from '../ktx2-basis-writer';

(async () => {
  // Check that we are actually in a worker thread
  if (!(await WorkerBody.inWorkerThread())) {
    return;
  }

  WorkerBody.onmessage = async (type, payload: WorkerMessagePayload) => {
    switch (type) {
      case 'process':
        try {
          const {input, options} = payload;
          const result = await KTX2BasisWriter.encode?.(input, options as KTX2BasisWriterOptions);
          WorkerBody.postMessage('done', {result});
        } catch (error) {
          const message = error instanceof Error ? error.message : '';
          WorkerBody.postMessage('error', {error: message});
        }
        break;
      default:
    }
  };
})();
