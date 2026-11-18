// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {parseGeoArrowSync} from '../lib/parsers/parse-geoarrow';
import {preloadArrowCompressionDecoders} from '../lib/parsers/arrow-compression';
import {createLoaderWorker} from '@loaders.gl/core/loader-utils';
import {GeoArrowLoaderWithParser} from '../geoarrow-loader';

createLoaderWorker({
  ...GeoArrowLoaderWithParser,
  /** Decodes columns for caller-side conversion. */
  async parse(input) {
    await preloadArrowCompressionDecoders();
    return parseGeoArrowSync(input, {shape: 'arrow'});
  }
});
