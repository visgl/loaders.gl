// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WriterOptions} from '@loaders.gl/loader-utils';
import {Table} from 'apache-arrow';
import {encodeMVTArrow} from './encode-mvt-arrow';
import {fromGeojson} from './mapbox-vt-pbf/to-vector-tile';

export type MVTWriterOptions = WriterOptions & {
  mvt?: {
    /** GeoArrow WKB column; inferred from extension or GeoParquet metadata. */
    geometryColumn?: string;
    /** Arrow attribute columns; defaults to all non-geometry columns. */
    propertyColumns?: readonly string[];
    /** Optional column providing nonnegative, safe integer feature IDs. */
    idColumn?: string;
    /** Explicit Arrow geometry space; normalized local by default. */
    coordinates?: 'local' | 'tile' | 'wgs84';
    /** Maximum Arrow rows per encoded tile; default 100,000. */
    maxFeatures?: number;
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

/** Encodes legacy GeoJSON or a GeoArrow WKB tile without materializing Arrow attributes as GeoJSON. */
export function encodeMVT(data, options?: MVTWriterOptions): ArrayBuffer {
  if (data instanceof Table || (data?.shape === 'arrow-table' && data.data instanceof Table))
    return encodeMVTArrow(data, options ?? {});
  const {mvt} = options || {};
  const encodeOptions = {
    layerName: mvt?.layerName || 'geojsonLayer',
    version: mvt?.version || 1,
    extent: mvt?.extent || 4096,
    tileIndex: mvt?.tileIndex
  };

  return fromGeojson(data, encodeOptions);
}
