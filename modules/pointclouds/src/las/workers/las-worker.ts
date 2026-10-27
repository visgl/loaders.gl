// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createLoaderWorker} from '@loaders.gl/core/loader-utils';
import {LASLoaderWithParser} from '../las-loader';

createLoaderWorker({
  ...LASLoaderWithParser,
  /** Decodes worker output as transferable columns; caller formatting follows hydration. */
  parse(input, options) {
    return LASLoaderWithParser.parse(input, {
      ...options,
      las: {...options?.las, shape: 'arrow-table', colorFormat: 'uint8norm'}
    });
  },
  /** Keeps the primary TypeScript decoder alive for the full input stream. */
  parseInBatches(input, options) {
    return LASLoaderWithParser.parseInBatches(input, {
      ...options,
      las: {...options?.las, shape: 'arrow-table', colorFormat: 'uint8norm'}
    });
  }
});
