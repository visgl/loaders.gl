// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Polyfills provide Node file loading helpers used by the shared library loader.
import '@loaders.gl/polyfills';
import {createWorker} from '@loaders.gl/worker-utils';
import {encodeDraco, encodeDracoInBatchesLocally} from '../draco-writer';

createWorker(
  async (input, options) => (await encodeDraco(input, options)).data,
  encodeDracoInBatchesLocally
);
