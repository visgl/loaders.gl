// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createWorker} from '@loaders.gl/worker-utils';
import {encodeDraco, encodeDracoInBatchesLocally} from '../draco-writer';

createWorker(
  async (input, options) => (await encodeDraco(input, options)).data,
  encodeDracoInBatchesLocally
);
