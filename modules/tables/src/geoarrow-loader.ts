// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {GeoArrowLoader} from './arrow/geoarrow-loader-types.js';
import {GeoArrowLoaderWithParser as parser} from './arrow/geoarrow-loader.js';

/** Parser-bearing GeoArrow loader with its browser module worker factory. */
export const GeoArrowLoaderWithParser = {
  ...parser,
  loadWorker: GeoArrowLoader.loadWorker
};
