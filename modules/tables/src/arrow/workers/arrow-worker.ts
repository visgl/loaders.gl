// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {parseArrowInBatches, parseArrowSync} from '../lib/parsers/parse-arrow';
import {createLoaderWorker} from '@loaders.gl/core/loader-utils';
import {preloadArrowCompressionDecoders} from '../lib/parsers/arrow-compression';
import {ArrowLoaderWithParser} from '../arrow-loader';

createLoaderWorker({
  ...ArrowLoaderWithParser,
  /** Keeps the worker batch payload in the shared column transport format. */
  parseInBatches(input, options) {
    return parseArrowInBatches(input, {
      ...options,
      arrow: {...options?.arrow, shape: undefined}
    });
  },
  /** Always decodes columnar data; requested row conversion belongs to the caller. */
  async parse(input) {
    await preloadArrowCompressionDecoders();
    return parseArrowSync(input, {shape: 'arrow-table'});
  }
});
