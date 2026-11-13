// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {parseArrowInBatches} from '../lib/parsers/parse-arrow';
import {createLoaderWorker} from '@loaders.gl/core/loader-utils';
import {ArrowLoaderWithParser} from '../arrow-loader';

createLoaderWorker({
  ...ArrowLoaderWithParser,
  /** Keeps the worker batch payload in the shared column transport format. */
  parseInBatches(input, options) {
    return parseArrowInBatches(input, {
      ...options,
      arrow: {...options?.arrow, shape: 'arrow-table'}
    });
  },
  /** Always decodes columnar data; requested row conversion belongs to the caller. */
  parse(input, options) {
    return ArrowLoaderWithParser.parse(input, {
      ...options,
      arrow: {...options?.arrow, shape: 'arrow-table'}
    });
  }
});
