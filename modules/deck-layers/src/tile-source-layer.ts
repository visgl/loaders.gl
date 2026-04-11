// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {CompositeLayer} from '@deck.gl/core';
import {MVTLayer, TileLayer, type TileLayerProps} from '@deck.gl/geo-layers';
import {BitmapLayer, GeoJsonLayer, PathLayer} from '@deck.gl/layers';

import type {GetTileDataParameters, TileSource, TileSourceMetadata} from '@loaders.gl/loader-utils';

/**
 * Runtime shape used by the example layer adapter.
 *
 * Some tile source implementations add deck.gl-specific flags such as
 * `localCoordinates`, MIME type metadata, and mutable table coordinate options.
 */
export type TileSourceRuntime = TileSource & {
  /** Indicates that vector tiles can be rendered in local coordinates. */
  localCoordinates?: boolean;
  /** MIME type that identifies vector or image payload handling. */
  mimeType: string | null;
  /** Mutable source options forwarded to loaders.gl tile fetches. */
  options: {
    table?: {
      /** Coordinate mode requested for table-backed tiles. */
      coordinates?: string;
    };
  };
  /** Source URL used for stable layer ids. */
  url?: string;
};

/** Internal helper layer for routing tile fetches through a `VectorTileSource`. */
class MVTSourceLayer extends MVTLayer<any> {
  /** Sync the cached vector tile source whenever deck.gl reports a data change. */
  updateState(params: any): void {
    super.updateState(params);

    const {props, changeFlags} = params;
    if (changeFlags.dataChanged && props.data) {
      this.setState({
        vectorTileSource: props.data,
        binary: false
      });
    }
  }

  /** Fetch tile payloads directly from the wrapped loaders.gl tile source. */
  async getTileData(parameters: GetTileDataParameters): Promise<any> {
    try {
      const vectorTileSource = (this.state as any).vectorTileSource as TileSourceRuntime | null;
      return vectorTileSource ? await vectorTileSource.getTileData(parameters) : null;
    } catch (error) {
      this.props.onTileError?.(error, parameters);
      return null;
    }
  }

  /** Render standard `MVTLayer` sublayers after the custom fetch path resolves. */
  renderSubLayers(props: any) {
    return super.renderSubLayers(props);
  }
}

/**
 * Props for `TileSourceLayer`.
 *
 * This layer adapts loaders.gl `TileSource` instances for deck.gl rendering.
 */
export type TileSourceLayerProps = Omit<TileLayerProps, 'data'> & {
  /** A source of vector or image tiles. */
  data: TileSourceRuntime;
  /** Optional tileset metadata used for zoom bounds and attribution. */
  metadata?: TileSourceMetadata | null;
  /** Show borders around tiles. Currently only works in tile mode. */
  showTileBorders?: boolean;
  /** A unique id for each feature or row. Associates parts of a geometry across tiles. */
  uniquePropertyId?: string;
  /** The currently highlighted unique property id. */
  highlightedFeatureId?: string;
  /** Called when a tile payload cannot be fetched or parsed. */
  onTileError?: (error: unknown, tileParameters?: unknown) => void;
  /** Called when deck.gl reports tiles loaded. */
  onTilesLoad?: (...args: any[]) => void;
};

/**
 * A deck.gl layer that renders a loaders.gl tile source.
 *
 * It automatically switches between vector-tile and bitmap rendering paths and
 * can draw debug tile borders.
 */
export class TileSourceLayer extends CompositeLayer<TileSourceLayerProps> {
  /** deck.gl layer name used in debugging output. */
  static layerName = 'TileSourceLayer';

  /** Default props shared by the vector and raster rendering paths. */
  static defaultProps = {
    ...TileLayer.defaultProps,
    layerMode: 'tile',
    showTileBorders: true
  };

  /** Initialize local state before props are first rendered. */
  initializeState(): void {
    this.setState({
      tileSource: null
    });
  }

  /** Mirror the latest `data` prop into layer state. */
  updateState({props}: any): void {
    this.setState({
      tileSource: props.data
    });
  }

  /** Render either the vector-tile or generic tile path for the current source. */
  renderLayers() {
    const {tileSource} = this.state as {tileSource: TileSourceRuntime | null};

    if (!tileSource) {
      return null;
    }

    if (this.sourceSupportsMVTLayer()) {
      // TODO - Currently only TileSource that supports CRS override is TableTileSource
      tileSource.options.table = tileSource.options.table || {};
      tileSource.options.table.coordinates = 'local';
      return this.renderMVTLayer();
    }

    // TODO - Currently only TileSource that supports CRS override is TableTileSource
    tileSource.options.table = tileSource.options.table || {};
    tileSource.options.table.coordinates = 'wgs84';
    return this.renderTileLayer();
  }

  /** Check if the current source supports MVT layer rendering with local coordinates. */
  sourceSupportsMVTLayer(): boolean {
    const {data} = this.props;
    return data.mimeType === 'application/vnd.mapbox-vector-tile' && Boolean(data.localCoordinates);
  }

  /** Render vector tiles through `MVTLayer` when local coordinate support is required. */
  renderMVTLayer() {
    const {data, showTileBorders, metadata, onTilesLoad, onTileError} = this.props;
    const minZoom = metadata?.minZoom || 0;
    const maxZoom = metadata?.maxZoom || 30;
    const devicePixelRatio = this.context.device.getCanvasContext().getDevicePixelRatio();

    return [
      new MVTSourceLayer({
        id: String(data.url),
        data: data as any,
        getLineColor: [0, 0, 0],
        getLineWidth: 1,
        getFillColor: [100, 120, 140],
        lineWidthUnits: 'pixels',
        pickable: true,
        autoHighlight: true,
        onViewportLoad: onTilesLoad,
        onTileError,
        minZoom,
        maxZoom,
        tileSize: 256,
        zoomOffset: devicePixelRatio === 1 ? -1 : 0,
        showTileBorders
      } as any)
    ];
  }

  /** Render image tiles and non-local vector tiles through `TileLayer`. */
  renderTileLayer() {
    const {data, showTileBorders, metadata, onTilesLoad, onTileError} = this.props;
    const minZoom = metadata?.minZoom || 0;
    const maxZoom = metadata?.maxZoom || 30;
    const devicePixelRatio = this.context.device.getCanvasContext().getDevicePixelRatio();

    return [
      new TileLayer({
        id: String(data.url),
        getTileData: async (parameters: GetTileDataParameters) => {
          try {
            return await data.getTileData(parameters);
          } catch (error) {
            onTileError?.(error, parameters);
            return null;
          }
        },
        maxRequests: 20,
        pickable: true,
        autoHighlight: showTileBorders,
        onViewportLoad: onTilesLoad,
        minZoom,
        maxZoom,
        tileSize: 256,
        zoomOffset: devicePixelRatio === 1 ? -1 : 0,
        renderSubLayers: renderSubLayers as any,
        tileSource: data as any,
        showTileBorders
      } as any)
    ];
  }
}

/**
 * Sublayer render callback for the top-level `TileLayer`.
 *
 * Renders vector tiles with `GeoJsonLayer`, image tiles with `BitmapLayer`, and
 * optional debug tile borders with `PathLayer`.
 *
 * @param props - Tile sublayer props supplied by deck.gl.
 * @returns A list of sublayers for the resolved tile payload.
 */
function renderSubLayers(props: any) {
  const {
    tileSource,
    showTileBorders,
    minZoom,
    maxZoom,
    tile: {
      index: {z: zoom},
      bbox: {west, south, east, north}
    }
  } = props;

  const layers: any[] = [];
  const resolvedMinZoom = minZoom ?? 0;
  const resolvedMaxZoom = maxZoom ?? 30;
  const borderColor =
    zoom <= resolvedMinZoom || zoom >= resolvedMaxZoom ? [255, 0, 0, 255] : [0, 0, 255, 255];

  switch (tileSource.mimeType) {
    case 'application/vnd.mapbox-vector-tile':
    case 'application/vnd.maplibre-tile':
      layers.push(
        new GeoJsonLayer({
          id: `${props.id}-geojson`,
          data: props.data as any,
          pickable: true,
          autoHighlight: true,
          lineWidthScale: 500,
          lineWidthMinPixels: 0.5,
          getFillColor: [100, 120, 140, 255],
          highlightColor: [0, 0, 200, 255]
        })
      );
      break;

    case 'image/png':
    case 'image/jpeg':
    case 'image/webp':
    case 'image/avif':
      layers.push(
        new BitmapLayer(props, {
          data: null as any,
          image: props.data,
          bounds: [west, south, east, north],
          pickable: true
        } as any)
      );
      break;

    default:
      console.error('Unknown tile mimeType', tileSource?.mimeType);
  }

  if (showTileBorders) {
    layers.push(
      new PathLayer({
        id: `${props.id}-border`,
        data: [
          [
            [west, north],
            [west, south],
            [east, south],
            [east, north],
            [west, north]
          ]
        ],
        getPath: data => data,
        getColor: borderColor as any,
        widthMinPixels: 4
      })
    );
  }

  return layers;
}
