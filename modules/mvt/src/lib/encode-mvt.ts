// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WriterOptions} from '@loaders.gl/loader-utils';
import {fromGeojson} from './mapbox-vt-pbf/to-vector-tile';

export type MVTWriterOptions = WriterOptions & {
  mvt?: {
    /** Name of the single layer that will be written into the tile */
    layerName?: string;
    /** Vector tile specification version */
    version?: number;
    /** Extent of the vector tile grid */
    extent?: number;
    /** Optional tile index for projecting WGS84 coordinates into tile space */
    tileIndex?: {x: number; y: number; z: number};
  };
};

export function encodeMVT(data, options?: MVTWriterOptions) {
  const {mvt} = options || {};
  const encodeOptions = {
    layerName: mvt?.layerName || 'geojsonLayer',
    version: mvt?.version || 1,
    extent: mvt?.extent || 4096,
    tileIndex: mvt?.tileIndex
  };

  return fromGeojson(data, encodeOptions);
}
