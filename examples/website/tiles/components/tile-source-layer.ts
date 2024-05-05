// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {CompositeLayer, Layer, LayersList} from '@deck.gl/core';
import {TileLayer, TileLayerProps} from '@deck.gl/geo-layers';
import {MVTLayer, MVTLayerProps} from '@deck.gl/geo-layers';
import {BitmapLayer, GeoJsonLayer, PathLayer} from '@deck.gl/layers';

import type {Feature} from '@loaders.gl/schema';
import type {TileSource} from '@loaders.gl/loader-utils';
import type {ImageTileSource, VectorTileSource} from '@loaders.gl/loader-utils';

/* global window */
const devicePixelRatio = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;

/**
 * TODO - MVTLayer doesn't allow us to override tileSource.getTileData?
 * getTileData: tileSource.getTileData,
 */
class MVTSourceLayer extends MVTLayer {
  static defaultProps = {
    data: {type: 'data', value: null, async: true}
  };

  updateState(params) {
    super.updateState(params);

    const {props, changeFlags} = params;
    if (changeFlags.dataChanged && props.data) {
      this.setState({
        tileSource: props.tileSource,
        binary: false
      });
    }
  }

  async getTileData(parameters: any): Promise<Feature[]> {
    // @ts-expect-error
    const tileSource = this.state.tileSource;
    const tile = await tileSource.getTileData(parameters);
    console.log(tile);
    return tile;
  }
}

export type TileSourceLayerProps = Omit<TileLayerProps, 'data'> & {
  data: VectorTileSource | ImageTileSource;
  /** A source of vector or image tiles */
  tileSource: VectorTileSource | ImageTileSource; // TileSource<any>;
  /** Use a MVT Layer (better for vector tiles) or Tile+GeoJSON+Bitmap layer (images, outlines etc) */
  layerMode?: 'mvt' | 'tile';
  /** Only works in 'tile' mode */
  showTileBorders?: boolean;
};

/**
 * A Deck.gl layer that renders a tile source
 * Auto discovers type of content (vector tile, bitmap, ...)
 * Can render debug borders around tiles
 * TODO - Change debug border color based on zoom level
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
    const sourceSupportsMVTLayer =
      // @ts-expect-error
      tileSource.mimeType === 'application/vnd.mapbox-vector-tile' && tileSource.localCoordinates;
      
    if (sourceSupportsMVTLayer) {
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

  renderMVTLayer() {
    // @ts-expect-error
    const {tileSource, showTileBorders, metadata, onTilesLoad} = this.props;
    const minZoom = metadata?.minZoom || 0;
    const maxZoom = metadata?.maxZoom || 30;

    return [
      new MVTSourceLayer({
        // HACK: Trigger new layer via id prop to force clear tile cache
        id: String(tileSource.url),
        data: 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_admin_0_scale_rank.geojson',
        tileSource,

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

  renderTileLayer() {
    const {tileSource, showTileBorders, metadata, onTilesLoad} = this.props;
    const minZoom = metadata?.minZoom || 0;
    const maxZoom = metadata?.maxZoom || 30;

    return [
      new TileLayer({
        // HACK: Trigger new layer via id prop to force clear tile cache
        id: String(tileSource.url),
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
