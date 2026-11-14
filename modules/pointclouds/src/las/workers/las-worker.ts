// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createLoaderWorker} from '@loaders.gl/core/loader-utils';
import {LASColumnLoader} from '../las-loader';

createLoaderWorker({
  ...LASColumnLoader,
  /** Decodes worker output as transferable columns; caller formatting follows hydration. */
  parse(input, options) {
    return LASColumnLoader.parse(input, {
      ...options,
      las: {...options?.las, shape: 'arrow', colorFormat: 'uint8norm'}
    });
  },
  /** Keeps the primary TypeScript decoder alive for the full input stream. */
  parseInBatches(input, options) {
    return LASColumnLoader.parseInBatches(input, {
      ...options,
      las: {...options?.las, shape: 'arrow', colorFormat: 'uint8norm'}
    });
  }
});
