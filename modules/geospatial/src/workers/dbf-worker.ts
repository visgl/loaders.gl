// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createLoaderWorker} from '@loaders.gl/core/loader-utils';
import type {DBFLoaderOptions} from '../shapefile/dbf-loader-types';
import {DBFColumnLoader} from '../shapefile/dbf-loader';
import {parseDBFArrowBatches} from '../shapefile/lib/parsers/parse-dbf-to-arrow';

createLoaderWorker({
  ...DBFColumnLoader,
  /** Decodes attributes directly into Arrow buffers for every requested output shape. */
  parse(input, options) {
    return DBFColumnLoader.parse!(input, {
      ...options,
      dbf: {...options?.dbf, shape: 'arrow'}
    });
  },
  /** Preserves legacy header events while returning only column buffers for row data. */
  parseInBatches(input, options) {
    return parseDBFArrowBatches(
      input,
      options,
      (options as DBFLoaderOptions)?.dbf?.shape !== 'arrow'
    );
  }
});
