// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type * as arrow from 'apache-arrow';
import {
  CompositeLayer,
  type CompositeLayerProps,
  type DefaultProps,
  type Layer
} from '@deck.gl/core';
import {
  GeoJsonLayer,
  type GeoJsonLayerProps,
  type PathLayerProps,
  type ScatterplotLayerProps,
  type SolidPolygonLayerProps
} from '@deck.gl/layers';
import {type GeometryColumnBinaryFeatureCollectionScratch} from '@loaders.gl/gis';
import {convertGeoArrowTableToBinaryFeatureCollection} from './geoarrow-table-adapter';

/** Props for {@link GeoArrowLayer}. */
export type GeoArrowLayerProps = CompositeLayerProps & {
  /** GeoArrow Apache Arrow table to render. */
  data: arrow.Table;
  /** Optional geometry column name when the table contains multiple geometry columns. */
  geometryColumn?: string;
  /** Optional props forwarded to the scatterplot sublayer for point geometries. */
  pointLayerProps?: Partial<ScatterplotLayerProps>;
  /** Optional props forwarded to the path sublayer for line geometries. */
  pathLayerProps?: Partial<PathLayerProps>;
  /** Optional props forwarded to the solid polygon sublayer for polygon geometries. */
  solidPolygonLayerProps?: Partial<SolidPolygonLayerProps>;
};

const defaultProps: DefaultProps<GeoArrowLayerProps> = {
  id: 'geoarrow-layer',
  pointLayerProps: {type: 'object', compare: false, value: {}},
  pathLayerProps: {type: 'object', compare: false, value: {}},
  solidPolygonLayerProps: {type: 'object', compare: false, value: {}}
};

/**
 * Compatibility layer that renders a GeoArrow Apache Arrow table through deck.gl `GeoJsonLayer`.
 */
export class GeoArrowLayer extends CompositeLayer<GeoArrowLayerProps> {
  /** deck.gl layer name used in debugging output. */
  static layerName = 'GeoArrowLayer';

  /** Default props shared across GeoArrow-backed layers. */
  static defaultProps: DefaultProps = defaultProps;

  /** Reusable scratch buffers for WKB/WKT conversion. */
  private geometryScratch: GeometryColumnBinaryFeatureCollectionScratch = {};

  /** Renders the GeoArrow table through deck.gl's binary `GeoJsonLayer` path. */
  renderLayers(): Layer | null {
    return new GeoJsonLayer({
      ...this.getSubLayerProps({id: 'geojson'}),
      ...createGeoJsonLayerProps(
        this.props.pointLayerProps,
        this.props.pathLayerProps,
        this.props.solidPolygonLayerProps
      ),
      data: convertGeoArrowTableToBinaryFeatureCollection(this.props.data, {
        geometryColumn: this.props.geometryColumn,
        scratch: this.geometryScratch
      })
    }) as unknown as Layer;
  }
}

/**
 * Builds `GeoJsonLayer` props from the legacy `GeoArrowLayer` sublayer prop surface.
 * @param pointLayerProps Point styling props.
 * @param pathLayerProps Line styling props.
 * @param solidPolygonLayerProps Polygon styling props.
 * @returns GeoJsonLayer props matching the GeoArrowLayer compatibility surface.
 */
export function createGeoJsonLayerProps(
  pointLayerProps?: Partial<ScatterplotLayerProps>,
  pathLayerProps?: Partial<PathLayerProps>,
  solidPolygonLayerProps?: Partial<SolidPolygonLayerProps>
): Partial<GeoJsonLayerProps> {
  return {
    pointType: 'circle',
    filled: solidPolygonLayerProps?.filled ?? true,
    extruded: solidPolygonLayerProps?.extruded,
    wireframe: solidPolygonLayerProps?.wireframe,
    getFillColor: (pointLayerProps?.getFillColor ??
      solidPolygonLayerProps?.getFillColor) as GeoJsonLayerProps['getFillColor'],
    getLineColor: (pathLayerProps?.getColor ??
      pointLayerProps?.getLineColor ??
      solidPolygonLayerProps?.getLineColor) as GeoJsonLayerProps['getLineColor'],
    getLineWidth: (pathLayerProps?.getWidth ??
      pointLayerProps?.getLineWidth) as GeoJsonLayerProps['getLineWidth'],
    lineWidthUnits: pathLayerProps?.widthUnits,
    lineWidthScale: pathLayerProps?.widthScale,
    lineWidthMinPixels: pathLayerProps?.widthMinPixels,
    lineWidthMaxPixels: pathLayerProps?.widthMaxPixels,
    getPointRadius: pointLayerProps?.getRadius,
    pointRadiusScale: pointLayerProps?.radiusScale,
    pointRadiusUnits: pointLayerProps?.radiusUnits,
    pointRadiusMinPixels: pointLayerProps?.radiusMinPixels,
    pointRadiusMaxPixels: pointLayerProps?.radiusMaxPixels,
    getElevation: solidPolygonLayerProps?.getElevation
  };
}
