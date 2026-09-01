import {WorkerFarm} from '@loaders.gl/worker-utils';

/** Installs worker-farm cleanup when webpack invalidates a worker source module. */
export function installWorkerHMR() {
  if (typeof module !== 'undefined' && module.hot) {
    module.hot.dispose(() => {
      WorkerFarm.getWorkerFarm().destroy(new Error('Worker source was invalidated by HMR'));
    });
  }
}
