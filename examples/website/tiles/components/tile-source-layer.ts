// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {CompositeLayer, Layer, DefaultProps} from '@deck.gl/core';
import {TileLayer, TileLayerProps} from '@deck.gl/geo-layers';
import {MVTLayer, MVTLayerProps} from '@deck.gl/geo-layers';
import {BitmapLayer, GeoJsonLayer, PathLayer} from '@deck.gl/layers';

import type {Feature, BinaryFeatureCollection} from '@loaders.gl/schema';
import type {TileSource} from '@loaders.gl/loader-utils';
import type {ImageTileSource, VectorTileSource} from '@loaders.gl/loader-utils';

// deck.gl audit while working on TileSourceLayer
// - PropTypes system undocumented, not even typescript comments, hard to understand
//
// - MVTLayer - doesn't allow override if tileSource.getTileData?
// - MVTLayer - does it support overriding renderSubLayers? TBD
// - MVTLayer - uniquePropertyId vs highlightedFeatureId - why named differently (propertyId vs featureId)?
//    (featureId or rowId is better if we take the tabular view... property subobject is GeoJSON specific)
// - MVTLayer - ability to support non-local coordinates?
// - MVTLayer docs - slightly high context, overly compact wording.
//
// - TileLayer
//   - Should we upstream TileSource support into the TileLayer. As a (recommended?) alternative to 'getTileData()`?
//   - Offer better ad-hoc / template type Sources?
//   - getTileData() - somewhat confusing props. Offer a `getTile()` more aligned with
//
// - Tileset2D
//   - Construct Tileset2D directly from a TileSource, instead of overriding getTileData()?
//   - Could we share TileSource between Tileset2Ds?
//   - Could we share Tileset2D between layers?

/** TODO - Internal helper layer: MVTLayer doesn't allow override if tileSource.getTileData? */
type MVTSourceLayerProps = Omit<MVTLayerProps, 'data'> & {
  data: VectorTileSource;
};

/** TODO - Internal helper layer: MVTLayer doesn't allow override if tileSource.getTileData? */
class MVTSourceLayer extends MVTLayer {
  static defaultProps: DefaultProps<MVTSourceLayerProps> = {
    data: {type: 'object', optional: false, value: null, async: false}
  };

  state: {
    // In case we wanted to auto-create tile sources, we need to save them on state
    vectorTileSource: VectorTileSource | null;
  };

  constructor(props: MVTLayerProps) {
    super(props);
  }

  updateState(params) {
    super.updateState(params);

    const {props, changeFlags} = params;
    if (changeFlags.dataChanged && props.data) {
      this.setState({
        vectorTileSource: props.data,
        // TODO - add support for binary VectorTileSources
        binary: false
      });
    }
  }

  async getTileData(parameters: any): Promise<Feature[] | BinaryFeatureCollection> {
    const vectorTileSource = this.state.vectorTileSource;
    const tile = await vectorTileSource.getTileData(parameters);
    return tile;
  }

 renderSubLayers(
    props: TileSourceLayerProps & {tile: {index; bbox: {west; south; east; north}}}
  ) {
    const layers = super.renderSubLayers(props);
    return layers;
  }
}

export type TileSourceLayerProps = Omit<TileLayerProps, 'data'> & {
  data: VectorTileSource | ImageTileSource;
  /** A source of vector or image tiles */
  tileSource: VectorTileSource | ImageTileSource; // TileSource<any>;
  /** Show borders around tiles. Currently only works in 'tile' mode */
  showTileBorders?: boolean;
  /** A unique id for each feature/row. Associates parts of a geometry in different tiles. */
  uniquePropertyId?: string;
  /** The currently highlighted unique property id */
  highlightedFeatureId?: string;
};

/**
 * A deck.gl layer that renders a tile source
 * Auto discovers type of content (vector tile, bitmap, ...)
 * Can render debug borders around tiles
 * TODO 
 *   - More robust support for switching TileSources.
 */
export class TileSourceLayer extends CompositeLayer<TileSourceLayerProps> {
  static layerName = 'TileSourceLayer';
  static defaultProps = {
    ...TileLayer.defaultProps,
    layerMode: 'tile',
    showTileBorders: true
  };

  state: {
    tileSource: TileSource<any> | null;
  };

  initializeState() {
    this.setState({
      tileSource: null
    });
  }

  updateState({props, changeFlags}) {
    this.setState({
      tileSource: props.tileSource
    });
  }

  renderLayers() {
    const {tileSource} = this.state;

    if (this.sourceSupportsMVTLayer()) {
      // TODO - Currently only TileSource that supports CRS override is TableTileSource
      // @ts-expect-error
      tileSource.props.coordinates = 'local';
      return this.renderMVTLayer();
    }

    // TODO - Currently only TileSource that supports CRS override is TableTileSource
    // @ts-expect-error
    tileSource.props.coordinates = 'wgs84';
    return this.renderTileLayer();
  }

  // INTERNAL METHODS

  /** Check if the current source supports MVT layer (vector tiles with local coordinates) */
  sourceSupportsMVTLayer(): boolean {
    // TODO - use tilesource from props or state???
    const {tileSource} = this.props;
    return (
      // @ts-expect-error localCoordinates property on sources is a HACK
      tileSource.mimeType === 'application/vnd.mapbox-vector-tile' && tileSource.localCoordinates
    );
  }

  /** Best rendering of vector tiles is through MVTLayer. However local coordinate support is needed */
  renderMVTLayer() {
    // TODO - use tilesource from props or state???
    const {tileSource, showTileBorders, metadata, onTilesLoad} = this.props;
    const minZoom = metadata?.minZoom || 0;
    const maxZoom = metadata?.maxZoom || 30;

    const devicePixelRatio = this.context.device.getCanvasContext().getDevicePixelRatio();

    return [
      new MVTSourceLayer({
        // HACK: Trigger new layer via id prop to force clear tile cache
        id: String(tileSource.url),
        data: tileSource,

        getLineColor: [0, 0, 0],
        getLineWidth: 1,
        getFillColor: [100, 120, 140],
        lineWidthUnits: 'pixels',
        pickable: true,
        autoHighlight: true,

        onViewportLoad: onTilesLoad,

        minZoom,
        maxZoom,
        tileSize: 256,
        // TOOD - why is this needed?
        zoomOffset: devicePixelRatio === 1 ? -1 : 0,

        // Custom prop
        // tileSource,
        showTileBorders
      })
    ];
  }

  /** TileLayer configured to render both image tiles and vector tiles */
  renderTileLayer() {
    const {tileSource, showTileBorders, metadata, onTilesLoad} = this.props;
    const minZoom = metadata?.minZoom || 0;
    const maxZoom = metadata?.maxZoom || 30;

    return [
      new TileLayer({
        // HACK: Trigger new layer via id prop to force clear tile cache
        // TODO - not sufficient, we need better mechanism
        id: String(tileSource.url),
        // TODO - should we upstream tile source support into the TileLayer?
        getTileData: tileSource.getTileData,
        // Assume the pmtiles file support HTTP/2, so we aren't limited by the browser to a certain number per domain.
        maxRequests: 20,

        pickable: true,
        autoHighlight: showTileBorders,

        onViewportLoad: onTilesLoad,

        minZoom,
        maxZoom,
        tileSize: 256,
        // TOOD - why is this needed?
        zoomOffset: devicePixelRatio === 1 ? -1 : 0,
        renderSubLayers,

        // Custom prop
        tileSource,
        showTileBorders
      })
    ];
  }
}

/** 
 * Sublayer render callback for the top-level TileLayer 
 * Renders:
 * GeoJSONLayer for vector tiles 
 *  BitmapLayer for image tiles
 *  PathLayer for debug borders
 */
function renderSubLayers(
  props: TileSourceLayerProps & {tile: {index; bbox: {west; south; east; north}}}
) {
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

  const layers: Layer[] = [];

  const borderColor = zoom <= minZoom || zoom >= maxZoom ? [255, 0, 0, 255] : [0, 0, 255, 255];

  switch (tileSource.mimeType) {
    case 'application/vnd.mapbox-vector-tile':
      layers.push(
        new GeoJsonLayer({
          id: `${props.id}-geojson`,
          data: props.data,
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
          data: null,
          image: props.data,
          bounds: [west, south, east, north],
          pickable: true
        })
      );
      break;

    default:
      console.error('Unknown tile mimeType', tileSource?.mimeType);
  }

  // Debug tile borders
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
        getPath: (d) => d,
        getColor: borderColor,
        widthMinPixels: 4
      })
    );
  }

  return layers;
}

///

// const {Deck, MVTLayer} = deck;

/** Renders GeoJSON with client-side generated tiles *
class TiledGeoJsonLayer extends MVTLayer {
  static defaultProps = {
    data: {type: 'data', value: null, async: true}
  };

  updateState(params) {
    super.updateState(params);
    
    const {props, changeFlags} = params;
    if (changeFlags.dataChanged && props.data) {
      this.setState({
        source: geojsonvt(props.data, {
          generateId: true
        }),
        binary: false
      });
    }
  }
  
const deckInstance = new Deck({
  initialViewState: {
    longitude: 0,
    latitude: 0,
    zoom: 1
  },
  controller: true,
  layers: [
    new TiledGeoJsonLayer({
      // source: Natural Earth http://www.naturalearthdata.com/ via geojson.xyz
      data: 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_admin_0_scale_rank.geojson',
      getLineColor: [0, 0, 0],
      getLineWidth: 1,
      getFillColor: [100, 120, 140],
      lineWidthUnits: 'pixels',
      pickable: true,
      autoHighlight: true
    })
  ]
});
*/
