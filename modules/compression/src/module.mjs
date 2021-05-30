// Backwards compatibility. Add to global `loaders` object
import * as moduleExports from './index';
globalThis.loaders = globalThis.loaders || {};
Object.assign(globalThis.loaders, moduleExports);

// Export all symbols
export * from './index';
export {startWorker as _startWorker} from './workers/worker';

// Experimental - Auto start worker if in worker thread
import {startWorker} from './workers/worker';
startWorker();
