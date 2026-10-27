// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createLoaderWorker} from '@loaders.gl/core/loader-utils';
import {ArrowLoaderWithParser} from '../arrow-loader';

createLoaderWorker({
  ...ArrowLoaderWithParser,
  /** Always decodes columnar data; requested row conversion belongs to the caller. */
  parse(input, options) {
    return ArrowLoaderWithParser.parse(input, {
      ...options,
      arrow: {...options?.arrow, shape: 'arrow-table'}
    });
  }
});
