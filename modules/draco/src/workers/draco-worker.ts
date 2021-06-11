import {createLoaderWorker} from '@loaders.gl/loader-utils';

import {DracoLoader} from '../draco-loader';

// Define a loader object that bundles the draco3d module
// (instead of loading draco3d WASM modules dynamically, as is done on the main thread)
const BundledDracoLoader = {
  ...DracoLoader
};

createLoaderWorker(BundledDracoLoader);
