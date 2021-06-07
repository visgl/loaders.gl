import {createLoaderWorker} from '../lib/worker-loader-utils/create-loader-worker';
import {NullLoader} from '../null-loader';

createLoaderWorker(NullLoader);
