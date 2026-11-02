import {destroyWorkerTasks} from '@loaders.gl/core/worker-utils';

/** Installs task-runner cleanup when webpack invalidates a worker source module. */
export function installWorkerHMR() {
  if (typeof module !== 'undefined' && module.hot) {
    module.hot.dispose(() => {
      void destroyWorkerTasks(new Error('Worker source was invalidated by HMR'));
    });
  }
}
