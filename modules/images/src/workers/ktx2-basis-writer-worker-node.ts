// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import '@loaders.gl/core/polyfills';
import {createWorker} from '@loaders.gl/core/worker-utils';
import {KTX2BasisWriter, type KTX2BasisWriterOptions} from '../ktx2-basis-writer';

createWorker(async (input, options) =>
  KTX2BasisWriter.encode!(input, options as KTX2BasisWriterOptions)
);
