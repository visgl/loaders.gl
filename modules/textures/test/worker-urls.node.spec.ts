// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {getWorkerURL} from '@loaders.gl/worker-utils';
import {BasisLoader, KTX2BasisWriterWorker} from '../src';

test.each([
  {worker: BasisLoader, filename: 'basis-worker-node.cjs'},
  {worker: KTX2BasisWriterWorker, filename: 'ktx2-basis-writer-worker-node.cjs'}
])('$worker.id resolves its published Node worker bundle', ({worker, filename}) => {
  expect(new URL(getWorkerURL(worker)).pathname.split('/').pop()).toBe(filename);
});
