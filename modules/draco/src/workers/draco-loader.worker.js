// __VERSION__ is injected by babel-plugin-version-inline
/* global __VERSION__ */
import {createWorker} from '@loaders.gl/loader-utils';

import {DracoLoader} from '../draco-loader';
import draco3d from 'draco3d';

const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

// Define a loader object that bundles the draco3d module
// (instead of loading draco3d WASM modules dynamically, as is done on the main thread)
const BundledDracoLoader = {
  ...DracoLoader,

  options: {
    ...DracoLoader.options,
    modules: {
      draco3d // Bundle full draco in worker to avoid tricky relative path loading from scripts
    }
  }
};

createWorker(BundledDracoLoader);
