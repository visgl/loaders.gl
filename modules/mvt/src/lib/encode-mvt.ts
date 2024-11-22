// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {fromGeojson} from './mapbox-vt-pbf/to-vector-tile';

export function encodeMVT(data, options) {
  return fromGeojson(data, options);
}
