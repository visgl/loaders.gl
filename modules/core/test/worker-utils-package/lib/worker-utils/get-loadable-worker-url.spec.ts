import {expect, test} from 'vitest';
import {getLoadableWorkerURL} from '../../../../src/worker-utils/lib/worker-utils/get-loadable-worker-url';
const WORKER_SOURCE = `
  self.onmessage = function(event) {
    const messageData = {
      source: 'loaders.gl',
      type: 'done',
      payload: {output: event.data.payload.input}
    };
    setTimeout(function () { self.postMessage(messageData); }, 50);
  };
`;
const LOCAL_WORKER_URL = 'modules/core/dist/worker-utils/null-worker.js';
const REMOTE_WORKER_URL = 'https://unpkg.com/loaders.gl/worker-utils/dist/null-worker.js';
test('getLoadableWorkerURL', () => {
  let workerURL;
  workerURL = getLoadableWorkerURL({source: WORKER_SOURCE});
  expect(workerURL.startsWith('blob:'), 'Worker source generates Object URL').toBeTruthy();
  workerURL = getLoadableWorkerURL({url: LOCAL_WORKER_URL});
  expect(workerURL, 'Local worker URL is returned unchanged').toBe(LOCAL_WORKER_URL);
  workerURL = getLoadableWorkerURL({url: REMOTE_WORKER_URL});
  expect(workerURL.startsWith('blob:'), 'Remote worker URL generates Object URL').toBeTruthy();
  expect(
    () => getLoadableWorkerURL({source: WORKER_SOURCE, url: REMOTE_WORKER_URL}),
    'Throws when supplying both source and url'
  ).toThrow();
  expect(
    () => getLoadableWorkerURL({source: WORKER_SOURCE, url: LOCAL_WORKER_URL}),
    'Throws when supplying both source and url'
  ).toThrow();
});
