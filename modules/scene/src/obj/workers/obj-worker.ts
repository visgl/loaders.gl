// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createLoaderWorker} from '@loaders.gl/core/loader-utils';
import {OBJLoaderWithParser} from '../obj-loader';

createLoaderWorker({
  ...OBJLoaderWithParser,
  /** Always returns columnar data; legacy mesh conversion runs on the caller. */
  parse(input, options) {
    return OBJLoaderWithParser.parse(input, {
      ...options,
      obj: {...options?.obj, shape: 'arrow-table'}
    });
  },
  /** Keeps one columnar parser alive for the entire worker input stream. */
  parseInBatches(input, options) {
    return OBJLoaderWithParser.parseInBatches(input, {
      ...options,
      obj: {...options?.obj, shape: 'arrow-table'}
    });
  }
});
