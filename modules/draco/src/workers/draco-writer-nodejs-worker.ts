import {WorkerBody, WorkerMessagePayload} from '@loaders.gl/worker-utils';
import {DracoWriterNodeJS} from '../draco-writer-nodejs';

(() => {
  // Check that we are actually in a worker thread
  if (!WorkerBody.inWorkerThread()) {
    return;
  }

  WorkerBody.onmessage = async (type, payload: WorkerMessagePayload) => {
    switch (type) {
      case 'process':
        try {
          const {input, options} = payload;
          const result = await DracoWriterNodeJS.encode!(input, options);
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
