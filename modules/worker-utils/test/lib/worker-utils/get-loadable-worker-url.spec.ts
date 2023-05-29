import test from 'tape-promise/tape';
import {isBrowser} from '@loaders.gl/worker-utils';
import {getLoadableWorkerURL} from '../../../src/lib/worker-utils/get-loadable-worker-url';

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

const LOCAL_WORKER_URL = 'modules/worker-utils/dist/null-worker.js';

const REMOTE_WORKER_URL = 'https://unpkg.com/loaders.gl/worker-utils/dist/null-worker.js';

test('getLoadableWorkerURL', (t) => {
  if (!isBrowser) {
    t.end();
  }

  let workerURL;
  workerURL = getLoadableWorkerURL({source: WORKER_SOURCE});
  t.ok(workerURL.startsWith('blob:'), 'Worker source generates Object URL');

  workerURL = getLoadableWorkerURL({url: LOCAL_WORKER_URL});
  t.equal(workerURL, LOCAL_WORKER_URL, 'Local worker URL is returned unchanged');

  workerURL = getLoadableWorkerURL({url: REMOTE_WORKER_URL});
  t.ok(workerURL.startsWith('blob:'), 'Remote worker URL generates Object URL');

  t.throws(
    () => getLoadableWorkerURL({source: WORKER_SOURCE, url: REMOTE_WORKER_URL}),
    'Throws when supplying both source and url'
  );
  t.throws(
    () => getLoadableWorkerURL({source: WORKER_SOURCE, url: LOCAL_WORKER_URL}),
    'Throws when supplying both source and url'
  );

  t.end();
});
