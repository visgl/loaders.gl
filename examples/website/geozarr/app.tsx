// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import React, {useEffect, useMemo, useState} from 'react';
import {createRoot} from 'react-dom/client';

import DeckGL from '@deck.gl/react';
import {MapController} from '@deck.gl/core';
import type {MapViewState} from '@deck.gl/core';

import {SourceLayer} from '@loaders.gl/deck-layers';
import type {RasterBoundingBox, RasterData} from '@loaders.gl/loader-utils';
import {GeoZarrSourceLoader, type GeoZarrSourceMetadata} from '@loaders.gl/zarr';

import {Map} from 'react-map-gl';
import maplibregl from 'maplibre-gl';

const DATA_URL =
  'https://nasa-power.s3.us-west-2.amazonaws.com/syn1deg/spatial/power_syn1deg_climatology_spatial_utc.zarr';
const DATA_ARRAY = 'ALLSKY_SFC_SW_DWN';
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const INITIAL_TIME_INDEX = 6;
const INITIAL_OPACITY = 0.65;
const GEOZARR_LOADERS = [GeoZarrSourceLoader];
const GEOZARR_SOURCE_OPTIONS = {
  geozarr: {
    array: DATA_ARRAY,
    defaultSelection: {time: INITIAL_TIME_INDEX}
  }
};
const COLOR_DOMAIN: [minimum: number, maximum: number] = [0, 350];
const TIME_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
  'Annual mean'
];

const COLOR_STOPS: Array<{position: number; color: [number, number, number]}> = [
  {position: 0, color: [10, 24, 74]},
  {position: 0.2, color: [52, 66, 145]},
  {position: 0.4, color: [48, 129, 166]},
  {position: 0.6, color: [85, 184, 125]},
  {position: 0.8, color: [238, 196, 72]},
  {position: 1, color: [246, 103, 48]}
];

const INITIAL_VIEW_STATE: MapViewState = {
  longitude: 0,
  latitude: 18,
  zoom: 1.15,
  minZoom: 0,
  maxZoom: 7,
  pitch: 0,
  bearing: 0
};

type AppProps = {
  /** Hides the example panel when embedded in another UI. */
  hideChrome?: boolean;
  /** Optional explanatory content rendered below the title. */
  children?: React.ReactNode;
};

type RasterRenderState = {
  /** Colorized raster pixels. */
  canvas: HTMLCanvasElement;
  /** Geographic bitmap bounds. */
  bounds: [west: number, south: number, east: number, north: number];
  /** Smallest finite source value. */
  minimum: number;
  /** Largest finite source value. */
  maximum: number;
};

/**
 * Deck.gl example that reads a public NASA POWER climatology variable directly from Zarr.
 */
export default function App(props: AppProps = {}) {
  const [timeIndex, setTimeIndex] = useState(INITIAL_TIME_INDEX);
  const [opacity, setOpacity] = useState(INITIAL_OPACITY);
  const [playing, setPlaying] = useState(false);
  const [metadata, setMetadata] = useState<GeoZarrSourceMetadata | null>(null);
  const [rasterState, setRasterState] = useState<RasterRenderState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const rasterParameters = useMemo(() => ({selection: {time: timeIndex}}), [timeIndex]);
  const bitmapLayerProps = useMemo(() => ({opacity}), [opacity]);

  useEffect(() => {
    if (!playing || loading) {
      return;
    }
    const timeout = globalThis.setTimeout(
      () => setTimeIndex(currentTimeIndex => (currentTimeIndex + 1) % TIME_LABELS.length),
      1200
    );
    return () => globalThis.clearTimeout(timeout);
  }, [loading, playing, timeIndex]);

  const layers = [
    new SourceLayer({
      id: 'nasa-power-geozarr',
      data: DATA_URL,
      loaders: GEOZARR_LOADERS,
      sourceOptions: GEOZARR_SOURCE_OPTIONS,
      rasterParameters,
      bitmapLayerProps,
      colorizeRaster: (raster, {metadata: sourceMetadata}) => {
        const nextRasterState = renderRaster(raster, sourceMetadata as GeoZarrSourceMetadata);
        setRasterState(nextRasterState);
        setError(null);
        return {image: nextRasterState.canvas, bounds: nextRasterState.bounds};
      },
      onMetadataLoad: sourceMetadata =>
        setMetadata(sourceMetadata as GeoZarrSourceMetadata),
      onLoadingStateChange: setLoading,
      onSourceError: sourceError => {
        setLoading(false);
        setError(sourceError.message);
      },
      onRasterLoadError: (_requestId, sourceError) => {
        setLoading(false);
        setError(sourceError.message);
      }
    })
  ];

  return (
    <div style={{position: 'relative', height: '100%', background: '#07101f'}}>
      <DeckGL
        controller={{type: MapController}}
        initialViewState={INITIAL_VIEW_STATE}
        layers={layers}
      >
        <Map reuseMaps mapLib={maplibregl as never} mapStyle={MAP_STYLE} />
      </DeckGL>
      {loading && !rasterState ? <LoadingSpinner /> : null}
      {!props.hideChrome ? (
        <InfoPanel
          error={error}
          loading={loading}
          metadata={metadata}
          opacity={opacity}
          playing={playing}
          rasterState={rasterState}
          timeIndex={timeIndex}
          onPlayingChange={setPlaying}
          onOpacityChange={setOpacity}
          onTimeIndexChange={setTimeIndex}
        >
          {props.children}
        </InfoPanel>
      ) : null}
    </div>
  );
}

/** Mounts the example into a DOM container. */
export function renderToDOM(container = document.body): void {
  createRoot(container).render(<App />);
}

/** Colorizes one typed GeoZarr raster and flips south-to-north grids for bitmap display. */
function renderRaster(
  raster: RasterData,
  metadata: GeoZarrSourceMetadata
): RasterRenderState {
  const canvas = document.createElement('canvas');
  canvas.width = raster.width;
  canvas.height = raster.height;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas 2D rendering is unavailable.');
  }

  const imageData = context.createImageData(raster.width, raster.height);
  const source = raster.data as ArrayLike<number>;
  const flipVertically = metadata.transform[4] > 0;
  let minimum = Number.POSITIVE_INFINITY;
  let maximum = Number.NEGATIVE_INFINITY;

  for (let row = 0; row < raster.height; row++) {
    const targetRow = flipVertically ? raster.height - row - 1 : row;
    for (let column = 0; column < raster.width; column++) {
      const sourceIndex = row * raster.width + column;
      const targetIndex = (targetRow * raster.width + column) * 4;
      const value = source[sourceIndex];
      if (!Number.isFinite(value) || value === raster.noData) {
        imageData.data[targetIndex + 3] = 0;
        continue;
      }

      minimum = Math.min(minimum, value);
      maximum = Math.max(maximum, value);
      const [red, green, blue] = getColor(value);
      imageData.data[targetIndex] = red;
      imageData.data[targetIndex + 1] = green;
      imageData.data[targetIndex + 2] = blue;
      imageData.data[targetIndex + 3] = 245;
    }
  }

  context.putImageData(imageData, 0, 0);
  return {
    canvas,
    bounds: flattenBoundingBox(raster.boundingBox || metadata.boundingBox!),
    minimum,
    maximum
  };
}

/** Interpolates the example's perceptual solar-radiation color ramp. */
function getColor(value: number): [number, number, number] {
  const normalized = Math.max(
    0,
    Math.min(1, (value - COLOR_DOMAIN[0]) / (COLOR_DOMAIN[1] - COLOR_DOMAIN[0]))
  );
  const stopIndex = Math.min(
    COLOR_STOPS.length - 2,
    Math.floor(normalized * (COLOR_STOPS.length - 1))
  );
  const left = COLOR_STOPS[stopIndex];
  const right = COLOR_STOPS[stopIndex + 1];
  const progress = (normalized - left.position) / (right.position - left.position);
  return left.color.map((channel, channelIndex) =>
    Math.round(channel + (right.color[channelIndex] - channel) * progress)
  ) as [number, number, number];
}

/** Flattens the common raster bounding-box representation for deck.gl. */
function flattenBoundingBox(
  boundingBox: RasterBoundingBox
): [west: number, south: number, east: number, north: number] {
  return [
    boundingBox[0][0],
    boundingBox[0][1],
    boundingBox[1][0],
    boundingBox[1][1]
  ];
}

/** Displays dataset controls, metadata, and color-ramp context. */
function InfoPanel(props: {
  /** Child content supplied by the website page. */
  children?: React.ReactNode;
  /** Current loading error. */
  error: string | null;
  /** Whether a metadata or raster request is active. */
  loading: boolean;
  /** Normalized source metadata. */
  metadata: GeoZarrSourceMetadata | null;
  /** Raster layer opacity. */
  opacity: number;
  /** Whether month playback is active. */
  playing: boolean;
  /** Current colorized raster statistics. */
  rasterState: RasterRenderState | null;
  /** Selected climatology time index. */
  timeIndex: number;
  /** Updates playback state. */
  onPlayingChange: (playing: boolean) => void;
  /** Updates raster layer opacity. */
  onOpacityChange: (opacity: number) => void;
  /** Updates the climatology time index. */
  onTimeIndexChange: (timeIndex: number) => void;
}) {
  const {
    children,
    error,
    loading,
    metadata,
    opacity,
    onOpacityChange,
    onPlayingChange,
    onTimeIndexChange,
    playing,
    rasterState,
    timeIndex
  } = props;

  return (
    <aside
      style={{
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 10,
        width: 340,
        maxWidth: 'calc(100% - 40px)',
        padding: 18,
        border: '1px solid rgba(151, 187, 255, 0.28)',
        borderRadius: 14,
        background: 'rgba(7, 16, 31, 0.9)',
        boxShadow: '0 16px 50px rgba(0, 0, 0, 0.38)',
        color: '#edf5ff',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 13,
        lineHeight: 1.45,
        backdropFilter: 'blur(12px)'
      }}
    >
      <div style={{color: '#8db9ff', fontSize: 11, fontWeight: 700, letterSpacing: 1.2}}>
        NASA POWER · REMOTE ZARR
      </div>
      <h2 style={{fontSize: 20, lineHeight: 1.15, margin: '5px 0 8px'}}>
        Global solar irradiance
      </h2>
      <div style={{marginBottom: 14, color: '#c9d9ee'}}>{children}</div>

      <div style={{display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8}}>
        <button
          type="button"
          onClick={() => onPlayingChange(!playing)}
          style={buttonStyle}
        >
          {playing ? 'Pause' : 'Play'}
        </button>
        <strong style={{fontSize: 15}}>{TIME_LABELS[timeIndex]}</strong>
        {loading ? <span style={{marginLeft: 'auto', color: '#8db9ff'}}>Loading…</span> : null}
      </div>
      <input
        aria-label="Climatology month"
        type="range"
        min={0}
        max={TIME_LABELS.length - 1}
        step={1}
        value={timeIndex}
        onChange={event => {
          onPlayingChange(false);
          onTimeIndexChange(Number(event.target.value));
        }}
        style={{width: '100%', accentColor: '#8db9ff'}}
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          margin: '1px 0 14px',
          color: '#8ea1ba',
          fontSize: 11
        }}
      >
        <span>Jan</span>
        <span>Jun</span>
        <span>Dec</span>
        <span>Annual</span>
      </div>

      <label
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto',
          alignItems: 'center',
          gap: 10,
          marginBottom: 14,
          color: '#c9d9ee'
        }}
      >
        <span>Raster opacity</span>
        <input
          aria-label="Raster opacity"
          type="range"
          min={0.1}
          max={1}
          step={0.05}
          value={opacity}
          onInput={event => onOpacityChange(Number(event.currentTarget.value))}
          style={{width: '100%', accentColor: '#8db9ff'}}
        />
        <span style={{minWidth: 34, textAlign: 'right', color: '#9fb1c8'}}>
          {Math.round(opacity * 100)}%
        </span>
      </label>

      <div
        style={{
          height: 12,
          borderRadius: 6,
          background:
            'linear-gradient(90deg, rgb(10,24,74), rgb(52,66,145), rgb(48,129,166), rgb(85,184,125), rgb(238,196,72), rgb(246,103,48))'
        }}
      />
      <div style={{display: 'flex', justifyContent: 'space-between', color: '#9fb1c8', fontSize: 11}}>
        <span>0</span>
        <span>175</span>
        <span>350 W m⁻²</span>
      </div>

      {rasterState ? (
        <div style={{marginTop: 12, color: '#c9d9ee'}}>
          Current range: {rasterState.minimum.toFixed(1)}–{rasterState.maximum.toFixed(1)} W m⁻²
        </div>
      ) : null}
      {metadata ? (
        <div style={{display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10}}>
          <Badge>{metadata.width} × {metadata.height}</Badge>
          <Badge>1° global grid</Badge>
          <Badge>{metadata.crs}</Badge>
          <Badge>CF/xarray</Badge>
        </div>
      ) : null}
      {error ? (
        <div style={{marginTop: 12, padding: 10, borderRadius: 8, background: '#481925', color: '#ffc7d1'}}>
          {error}
        </div>
      ) : null}
      <p style={{margin: '14px 0 0', color: '#8ea1ba', fontSize: 11}}>
        Drag and zoom with deck.gl. Each selection fetches one compressed Zarr chunk directly from
        the public NASA S3 bucket, then colorizes it in the browser.
      </p>
    </aside>
  );
}

const buttonStyle: React.CSSProperties = {
  appearance: 'none',
  minWidth: 58,
  padding: '6px 10px',
  border: '1px solid rgba(151, 187, 255, 0.42)',
  borderRadius: 7,
  background: 'rgba(89, 138, 222, 0.22)',
  color: '#edf5ff',
  cursor: 'pointer',
  font: 'inherit',
  fontWeight: 650
};

/** Renders a compact metadata badge. */
function Badge({children}: {children: React.ReactNode}) {
  return (
    <span
      style={{
        padding: '3px 7px',
        borderRadius: 999,
        background: 'rgba(141, 185, 255, 0.12)',
        color: '#bcd4f6',
        fontSize: 11
      }}
    >
      {children}
    </span>
  );
}

/** Displays a centered loading indicator before the first raster is available. */
function LoadingSpinner() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        pointerEvents: 'none',
        color: '#d9e8ff',
        fontFamily: 'system-ui, sans-serif'
      }}
    >
      <div style={{padding: '10px 14px', borderRadius: 9, background: 'rgba(7, 16, 31, 0.82)'}}>
        Loading NASA POWER Zarr…
      </div>
    </div>
  );
}
