// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createLoaderWorker} from '@loaders.gl/core/loader-utils';
import {GeoArrowLoaderWithParser} from '../geoarrow-loader';

createLoaderWorker({
  ...GeoArrowLoaderWithParser,
  /** Always decodes columnar data; requested row conversion belongs to the caller. */
  parse(input, options) {
    return GeoArrowLoaderWithParser.parse(input, {
      ...options,
      arrow: {...options?.arrow, shape: 'arrow-table'}
    });
  }
});
