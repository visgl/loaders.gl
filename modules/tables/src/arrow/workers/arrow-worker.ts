// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {parseArrowSync} from '../lib/parsers/parse-arrow';
import {createLoaderWorker} from '@loaders.gl/core/loader-utils';
import {preloadArrowCompressionDecoders} from '../lib/parsers/arrow-compression';
import {ArrowLoaderWithParser} from '../arrow-loader';

createLoaderWorker({
  ...ArrowLoaderWithParser,
  /** Decodes columns for caller-side conversion. */
  async parse(input) {
    await preloadArrowCompressionDecoders();
    return parseArrowSync(input, {shape: 'arrow'});
  }
});
