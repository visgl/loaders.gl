// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {CompositeLayer, Layer} from '@deck.gl/core';
import {TileLayer, TileLayerProps} from '@deck.gl/geo-layers';
import {BitmapLayer, GeoJsonLayer, PathLayer} from '@deck.gl/layers';
import type {TileSource} from '@loaders.gl/loader-utils';

/* global window */
const devicePixelRatio = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;

export type TileSourceLayerProps = TileLayerProps & {
  tileSource: TileSource;
  showTileBorders?: boolean;
};

/**
 * A Deck.gl layer that renders a tile source
 * Autodiscovers type of content (vector tile, bitmap, ...)
 * Can render debug borders around tiles
 * TODO - Change debug border color based on zoom level
 */
export class TileSourceLayer extends CompositeLayer<TileSourceLayerProps> {
  static layerName = 'TileSourceLayer';
  static defaultProps = {
    ...TileLayer.defaultProps,
    showTileBorders: true
  };

  state: {
    tileSource: TileSource | null;
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
