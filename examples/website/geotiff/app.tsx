// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import React, {useMemo, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import DeckGL from '@deck.gl/react';
import {MapController, type MapViewState} from '@deck.gl/core';
import {SourceLayer} from '@loaders.gl/deck-layers';
import {GeoTIFFSourceLoader} from '@loaders.gl/geotiff';
import type {RangeRequestEvent, RangeStats, RasterSourceMetadata} from '@loaders.gl/loader-utils';
import {createRangeStats, getRangeStats} from '@loaders.gl/loader-utils';
import {Map} from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import {createDeckFullscreenWidget, createDeckStatsWidget} from '../shared/create-deck-stats-widget';

const DATA_URL = '/gfw-azores.tif';
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
const INITIAL_VIEW_STATE: MapViewState = {
  longitude: -27.2,
  latitude: 38.9,
  zoom: 5.4,
  minZoom: 1,
  maxZoom: 12,
  pitch: 0,
  bearing: 0
};

type AppProps = {
  hideChrome?: boolean;
  children?: React.ReactNode;
};

/** Website demo for URL-plus-loader GeoTIFF rendering through SourceLayer. */
export default function App(props: AppProps = {}) {
  const rangeStatsObjectRef = useRef(createRangeStats('geotiff-example-range-transport'));
  const [viewState, setViewState] = useState<MapViewState>(INITIAL_VIEW_STATE);
  const [metadata, setMetadata] = useState<RasterSourceMetadata | null>(null);
  const [rangeStats, setRangeStats] = useState<RangeStats>(
    getRangeStats(rangeStatsObjectRef.current)
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const layers = [
    new SourceLayer({
      id: 'geotiff-source',
      data: DATA_URL,
      loaders: [GeoTIFFSourceLoader],
      sourceOptions: {
        geotiff: {
          rangeSchedulerProps: {
            batchDelayMs: 50,
            stats: rangeStatsObjectRef.current,
            onEvent: onRangeRequest
          }
        }
      },
      rasterParameters: {resampleMethod: 'nearest'},
      bitmapLayerProps: {opacity: 0.78},
      onMetadataLoad: nextMetadata => {
        setMetadata(nextMetadata as RasterSourceMetadata);
        setError(null);
      },
      onLoadingStateChange: setLoading,
      onRasterLoad: () => setLoading(false),
      onSourceError: sourceError => {
        setLoading(false);
        setError(sourceError.message);
      },
      onRasterLoadError: (_requestId, rasterError) => {
        setLoading(false);
        setError(rasterError.message);
      }
    })
  ];

  const widgets = useMemo(
    () =>
      props.hideChrome
        ? []
        : [
            createDeckFullscreenWidget('geotiff-fullscreen'),
            createDeckStatsWidget('geotiff-stats')
          ],
    [props.hideChrome]
  );

  return (
    <div style={{position: 'relative', height: '100%'}}>
      <DeckGL
        controller={{type: MapController}}
        layers={layers}
        viewState={viewState}
        widgets={widgets}
        onViewStateChange={({viewState: nextViewState}) =>
          setViewState(nextViewState as MapViewState)
        }
      >
        <Map reuseMaps mapLib={maplibregl as never} mapStyle={MAP_STYLE} />
      </DeckGL>
      {loading ? <div style={STATUS_STYLE}>Loading GeoTIFF viewport…</div> : null}
      {!props.hideChrome ? (
        <div style={INFO_STYLE}>
          <strong>GeoTIFF RasterSource</strong>
          <div>{error || metadata?.title || metadata?.name || DATA_URL}</div>
          <div>
            {metadata
              ? `${metadata.width}×${metadata.height}, ${metadata.bandCount} band(s), ${metadata.dtype}`
              : 'Discovering metadata…'}
          </div>
          <div>
            {rangeStats.requestCount} range requests · {formatBytes(rangeStats.requestedBytes)}
          </div>
          {props.children}
        </div>
      ) : null}
    </div>
  );

  function onRangeRequest(event: RangeRequestEvent): void {
    if (['batch', 'response', 'error', 'abort'].includes(event.type)) {
      setRangeStats(getRangeStats(rangeStatsObjectRef.current));
    }
  }
}

/** Mounts the demo into a DOM container. */
export function renderToDOM(container = document.body) {
  createRoot(container).render(<App />);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KiB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} MiB`;
}

const STATUS_STYLE: React.CSSProperties = {
  position: 'absolute',
  left: 12,
  top: 12,
  padding: '8px 10px',
  borderRadius: 4,
  background: 'rgba(255,255,255,0.9)'
};

const INFO_STYLE: React.CSSProperties = {
  position: 'absolute',
  right: 12,
  top: 12,
  maxWidth: 360,
  padding: 12,
  borderRadius: 6,
  lineHeight: 1.5,
  background: 'rgba(255,255,255,0.92)'
};
