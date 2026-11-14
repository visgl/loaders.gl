// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createLoaderWorker} from '@loaders.gl/core/loader-utils';
import {PCDColumnLoader} from '../pcd-loader';

createLoaderWorker({
  ...PCDColumnLoader,
  /** Always returns columnar data; legacy mesh conversion runs on the caller. */
  parse(input, options) {
    return PCDColumnLoader.parse(input, {
      ...options,
      pcd: {...options?.pcd, shape: 'arrow'}
    });
  },
  /** Keeps one columnar parser alive for the entire worker input stream. */
  parseInBatches(input, options) {
    return PCDColumnLoader.parseInBatches(input, {
      ...options,
      pcd: {...options?.pcd, shape: 'arrow'}
    });
  }
});
