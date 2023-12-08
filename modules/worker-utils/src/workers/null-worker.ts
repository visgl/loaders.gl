// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createWorker} from '../lib/worker-api/create-worker';

createWorker(async (data) => {
  // @ts-ignore
  return data;
});
