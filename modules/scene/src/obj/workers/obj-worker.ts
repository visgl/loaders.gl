// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createLoaderWorker} from '@loaders.gl/core/loader-utils';
import {OBJColumnLoader} from '../obj-loader';

createLoaderWorker({
  ...OBJColumnLoader,
  /** Always returns columnar data; legacy mesh conversion runs on the caller. */
  parse(input, options) {
    return OBJColumnLoader.parse(input, {
      ...options,
      obj: {...options?.obj, shape: 'arrow'}
    });
  },
  /** Keeps one columnar parser alive for the entire worker input stream. */
  parseInBatches(input, options) {
    return OBJColumnLoader.parseInBatches(input, {
      ...options,
      obj: {...options?.obj, shape: 'arrow'}
    });
  }
});
