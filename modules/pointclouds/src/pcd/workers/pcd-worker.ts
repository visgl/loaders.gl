// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createLoaderWorker} from '@loaders.gl/core/loader-utils';
import {PCDLoaderWithParser} from '../pcd-loader';

createLoaderWorker({
  ...PCDLoaderWithParser,
  /** Always returns columnar data; legacy mesh conversion runs on the caller. */
  parse(input, options) {
    return PCDLoaderWithParser.parse(input, {
      ...options,
      pcd: {...options?.pcd, shape: 'arrow-table'}
    });
  },
  /** Keeps one columnar parser alive for the entire worker input stream. */
  parseInBatches(input, options) {
    return PCDLoaderWithParser.parseInBatches(input, {
      ...options,
      pcd: {...options?.pcd, shape: 'arrow-table'}
    });
  }
});
