// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import React, {useEffect, useMemo, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';

import DeckGL from '@deck.gl/react';
import {MapController, WebMercatorViewport} from '@deck.gl/core';
import type {MapViewState} from '@deck.gl/core';
import {BitmapLayer} from '@deck.gl/layers';

import {createDataSource} from '@loaders.gl/core';
import type {
  RasterBoundingBox,
  RasterData,
  RangeRequestEvent,
  RangeStats,
  RasterSource,
  RasterSourceMetadata,
  RasterViewport,
  GetRasterParameters,
  RasterOverview
} from '@loaders.gl/loader-utils';
import {
  createRangeStats,
  getRangeStats,
  getRasterViewportBoundingBox
} from '@loaders.gl/loader-utils';
import {GeoTIFFSourceLoader} from '@loaders.gl/geotiff';
import type {RasterSetRequest} from '@loaders.gl/tiles';
import {RasterSet} from '@loaders.gl/tiles';

import {Map} from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import {createDeckFullscreenWidget, createDeckStatsWidget} from '../shared/create-deck-stats-widget';

const DATA_URL = '/gfw-azores.tif';
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
const REFETCH_SHARPENING_THRESHOLD = 0.75;

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

type RasterRenderState = {
  canvas: HTMLCanvasElement | null;
  bounds: [number, number, number, number] | null;
  stats: RasterStatistics | null;
};

type RasterStatistics = {
  minimum: number;
  maximum: number;
  lowerBound: number;
  upperBound: number;
};

/**
 * Website demo for the viewport-driven GeoTIFF raster source.
 */
export default function App(props: AppProps = {}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rangeStatsObjectRef = useRef(createRangeStats('geotiff-example-range-transport'));
  const sourceRef = useRef<RasterSource | null>(null);
  const rasterSetRef = useRef<RasterSet | null>(null);

  if (!sourceRef.current) {
    sourceRef.current = createDataSource(DATA_URL, [GeoTIFFSourceLoader], {
      geotiff: {
        rangeSchedulerProps: {
          batchDelayMs: 50,
          stats: rangeStatsObjectRef.current,
          onEvent: onRangeRequest
        }
      }
    }) as RasterSource;
  }

  if (!rasterSetRef.current) {
    rasterSetRef.current = RasterSet.fromRasterSource(sourceRef.current, {
      shouldRefetch: ({currentRequest, metadata, nextParameters}) =>
        shouldRefetchGeoTIFFRaster({currentRequest, metadata, nextParameters})
    });
  }

  const [viewState, setViewState] = useState<MapViewState>(INITIAL_VIEW_STATE);
  const [metadata, setMetadata] = useState<RasterSourceMetadata | null>(null);
  const [rangeStats, setRangeStats] = useState<RangeStats>(
    getRangeStats(rangeStatsObjectRef.current)
  );
  const [viewportSize, setViewportSize] = useState({width: 0, height: 0});
  const [rasterState, setRasterState] = useState<RasterRenderState>({
    canvas: null,
    bounds: null,
    stats: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const showLoadingSpinner = loading || (!error && !rasterState.canvas);

  useEffect(() => {
    const rasterSet = rasterSetRef.current!;
    const unsubscribe = rasterSet.subscribe({
      onLoadingStateChange: isLoading => setLoading(isLoading),
      onMetadataLoad: nextMetadata => {
        setMetadata(nextMetadata);
        setError(null);
      },
      onMetadataLoadError: nextError => {
        console.error('GeoTIFF example metadata load failed', nextError);
        setError(getErrorMessage(nextError));
      },
      onRasterLoad: ({parameters, raster}) => {
        const {canvas, stats} = renderRasterToCanvas(raster);
        setRasterState({
          canvas,
          bounds: flattenBoundingBox(raster.boundingBox || parameters.viewport.bounds!),
          stats
        });
        setError(null);
      },
      onRasterLoadError: (_requestId, nextError) => {
        console.error('GeoTIFF example raster load failed', nextError);
        setError(getErrorMessage(nextError));
      }
    });

    void rasterSet.loadMetadata().catch(() => {});

    return () => {
      unsubscribe();
      rasterSet.finalize();
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const updateViewportSize = () => {
      setViewportSize({
        width: Math.max(1, Math.round(container.clientWidth)),
        height: Math.max(1, Math.round(container.clientHeight))
      });
    };

    updateViewportSize();

    const observer = new ResizeObserver(updateViewportSize);
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!metadata || !viewportSize.width || !viewportSize.height) {
      return;
    }

    const rasterViewport = createRasterViewport(
      viewState,
      viewportSize.width,
      viewportSize.height,
      metadata.crs
    );

    const parameters: GetRasterParameters = {
      viewport: rasterViewport,
      resampleMethod: 'nearest'
    };

    rasterSetRef.current.requestRaster(parameters);
  }, [metadata, viewState, viewportSize.height, viewportSize.width]);

  const layers = useMemo(() => {
    if (!rasterState.canvas || !rasterState.bounds) {
      return [];
    }

    return [
      new BitmapLayer({
        id: 'geotiff-raster-layer',
        image: rasterState.canvas,
        bounds: rasterState.bounds,
        opacity: 0.78
      })
    ];
  }, [rasterState.bounds, rasterState.canvas]);

  const widgets = useMemo(() => {
    if (props.hideChrome) {
      return [];
    }

    return [createDeckFullscreenWidget('geotiff-fullscreen'), createDeckStatsWidget('geotiff-stats')];
  }, [props.hideChrome]);

  return (
    <div ref={containerRef} style={{position: 'relative', height: '100%'}}>
      <DeckGL
        controller={{type: MapController}}
        layers={layers}
        viewState={viewState}
        widgets={widgets}
        onViewStateChange={({viewState: nextViewState}) =>
          setViewState(nextViewState as MapViewState)
        }
      >
        <Map
          reuseMaps
          mapLib={maplibregl as never}
          mapStyle={MAP_STYLE}
        />
      </DeckGL>
      {showLoadingSpinner ? <LoadingSpinner /> : null}
      {!props.hideChrome ? (
        <InfoPanel
          loading={loading}
          error={error}
          metadata={metadata}
          rangeStats={rangeStats}
          stats={rasterState.stats}
          viewState={viewState}
        >
          {props.children}
        </InfoPanel>
      ) : null}
    </div>
  );

  function onRangeRequest(event: RangeRequestEvent): void {
    if (
      event.type === 'batch' ||
      event.type === 'response' ||
      event.type === 'error' ||
      event.type === 'abort'
    ) {
      setRangeStats(getRangeStats(rangeStatsObjectRef.current));
    }
  }
}

/**
 * Mounts the demo into a DOM container.
 */
export function renderToDOM(container = document.body) {
  createRoot(container).render(<App />);
}

/**
 * Uses current raster coverage and GeoTIFF metadata to avoid redundant viewport refetches.
 */
function shouldRefetchGeoTIFFRaster(args: {
  currentRequest: RasterSetRequest | null;
  metadata: RasterSourceMetadata | null;
  nextParameters: GetRasterParameters;
}): boolean {
  const {currentRequest, metadata, nextParameters} = args;
  if (!currentRequest || !metadata?.boundingBox) {
    return true;
  }

  if (!hasMatchingRasterSelection(currentRequest.parameters, nextParameters)) {
    return true;
  }

  const currentBoundingBox =
    currentRequest.raster.boundingBox ||
    currentRequest.parameters.viewport.bounds ||
    getViewportBoundingBox(currentRequest.parameters);
  const nextBoundingBox = getViewportBoundingBox(nextParameters);
  const currentOverview = selectOverview(metadata, currentRequest.parameters);
  const nextOverview = selectOverview(metadata, nextParameters);

  if ((currentOverview?.index ?? 0) !== (nextOverview?.index ?? 0)) {
    return true;
  }

  const nativeResolution = getOverviewResolution(metadata, nextOverview);
  if (
    !nativeResolution ||
    !areBoundingBoxesEquivalent(
      currentBoundingBox,
      nextBoundingBox,
      nativeResolution.x * 0.5,
      nativeResolution.y * 0.5
    )
  ) {
    return true;
  }

  const currentResolution = getViewportResolution(
    currentBoundingBox,
    currentRequest.raster.width,
    currentRequest.raster.height
  );
  const nextResolution = getViewportResolution(
    nextBoundingBox,
    nextParameters.viewport.width,
    nextParameters.viewport.height
  );

  if (!requiresSharperRaster(currentResolution, nextResolution)) {
    return false;
  }

  return (
    currentResolution.x > nativeResolution.x * 1.02 ||
    currentResolution.y > nativeResolution.y * 1.02
  );
}

/**
 * Converts the current deck view state into a loaders.gl raster viewport.
 */
function createRasterViewport(
  viewState: MapViewState,
  width: number,
  height: number,
  crs?: string
): RasterViewport {
  const devicePixelRatio = globalThis.devicePixelRatio || 1;
  const sampleWidth = Math.min(Math.round(width * devicePixelRatio), 1024);
  const sampleHeight = Math.min(Math.round(height * devicePixelRatio), 1024);
  const deckViewport = new WebMercatorViewport({...viewState, width, height});
  const bounds = deckViewport.getBounds();

  return {
    id: 'geotiff-viewport',
    width: sampleWidth,
    height: sampleHeight,
    zoom: deckViewport.zoom,
    center: [deckViewport.longitude, deckViewport.latitude],
    crs,
    bounds: [
      [bounds[0], bounds[1]],
      [bounds[2], bounds[3]]
    ],
    getBounds: () => bounds as [number, number, number, number],
    project: (coordinates: number[]) => deckViewport.project(coordinates as [number, number]),
    unprojectPosition: (position: number[]) =>
      deckViewport.unprojectPosition(position as [number, number])
  };
}

/**
 * Returns `true` when a new request changes band/layout selection.
 */
function hasMatchingRasterSelection(
  currentParameters: GetRasterParameters,
  nextParameters: GetRasterParameters
): boolean {
  return (
    currentParameters.interleaved === nextParameters.interleaved &&
    currentParameters.resampleMethod === nextParameters.resampleMethod &&
    areBandsEqual(currentParameters.bands, nextParameters.bands)
  );
}

/**
 * Compares optional band selections.
 */
function areBandsEqual(leftBands?: number[], rightBands?: number[]): boolean {
  if (!leftBands && !rightBands) {
    return true;
  }
  if (!leftBands || !rightBands || leftBands.length !== rightBands.length) {
    return false;
  }
  return leftBands.every((band, index) => band === rightBands[index]);
}

/**
 * Resolves the requested viewport bounds.
 */
function getViewportBoundingBox(parameters: GetRasterParameters): RasterBoundingBox {
  return getRasterViewportBoundingBox(parameters.viewport);
}

/**
 * Returns `true` when both bounding boxes are equivalent within source-resolution tolerance.
 */
function areBoundingBoxesEquivalent(
  leftBoundingBox: RasterBoundingBox,
  rightBoundingBox: RasterBoundingBox,
  toleranceX: number,
  toleranceY: number
): boolean {
  return (
    Math.abs(leftBoundingBox[0][0] - rightBoundingBox[0][0]) <= toleranceX &&
    Math.abs(leftBoundingBox[0][1] - rightBoundingBox[0][1]) <= toleranceY &&
    Math.abs(leftBoundingBox[1][0] - rightBoundingBox[1][0]) <= toleranceX &&
    Math.abs(leftBoundingBox[1][1] - rightBoundingBox[1][1]) <= toleranceY
  );
}

/**
 * Computes viewport resolution in source units per output pixel.
 */
function getViewportResolution(
  boundingBox: RasterBoundingBox,
  width: number,
  height: number
): {x: number; y: number} {
  return {
    x: Math.abs(boundingBox[1][0] - boundingBox[0][0]) / Math.max(width, 1),
    y: Math.abs(boundingBox[1][1] - boundingBox[0][1]) / Math.max(height, 1)
  };
}

/**
 * Selects the coarsest overview that still satisfies the requested viewport resolution.
 */
function selectOverview(
  metadata: RasterSourceMetadata,
  parameters: GetRasterParameters
): RasterOverview | null {
  const overviews = getAvailableOverviews(metadata);
  if (!overviews.length) {
    return null;
  }

  const requestedResolution = getViewportResolution(
    getViewportBoundingBox(parameters),
    parameters.viewport.width,
    parameters.viewport.height
  );

  let selectedOverview = overviews[0];
  let selectedScore = Number.NEGATIVE_INFINITY;

  for (const overview of overviews) {
    const resolution = getOverviewResolution(metadata, overview);
    if (!resolution) {
      continue;
    }

    const score = Math.max(resolution.x, resolution.y);
    if (
      resolution.x <= requestedResolution.x &&
      resolution.y <= requestedResolution.y &&
      score > selectedScore
    ) {
      selectedOverview = overview;
      selectedScore = score;
    }
  }

  return selectedOverview;
}

/**
 * Lists overview metadata, falling back to the full-resolution image when needed.
 */
function getAvailableOverviews(metadata: RasterSourceMetadata): RasterOverview[] {
  if (metadata.overviews?.length) {
    return metadata.overviews;
  }

  return [
    {
      index: 0,
      width: metadata.width,
      height: metadata.height
    }
  ];
}

/**
 * Computes overview resolution in source units per pixel.
 */
function getOverviewResolution(
  metadata: RasterSourceMetadata,
  overview: RasterOverview | null
): {x: number; y: number} | null {
  if (!overview || !metadata.boundingBox) {
    return null;
  }

  if (overview.resolution) {
    return {
      x: Math.abs(overview.resolution[0]),
      y: Math.abs(overview.resolution[1])
    };
  }

  return getViewportResolution(metadata.boundingBox, overview.width, overview.height);
}

/**
 * Returns `true` when the next request materially increases required sharpness.
 */
function requiresSharperRaster(
  currentResolution: {x: number; y: number},
  nextResolution: {x: number; y: number}
): boolean {
  return (
    nextResolution.x < currentResolution.x * REFETCH_SHARPENING_THRESHOLD ||
    nextResolution.y < currentResolution.y * REFETCH_SHARPENING_THRESHOLD
  );
}

/**
 * Renders raster data into a canvas and computes display statistics.
 */
function renderRasterToCanvas(raster: RasterData): {
  canvas: HTMLCanvasElement;
  stats: RasterStatistics | null;
} {
  const canvas = document.createElement('canvas');
  canvas.width = raster.width;
  canvas.height = raster.height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Could not create 2D canvas context for raster rendering.');
  }

  const imageData = context.createImageData(raster.width, raster.height);
  const stats = writeRasterColors(imageData.data, raster);

  context.putImageData(imageData, 0, 0);
  return {canvas, stats};
}

/**
 * Writes raster colors into the image output buffer.
 */
function writeRasterColors(target: Uint8ClampedArray, raster: RasterData): RasterStatistics | null {
  if (Array.isArray(raster.data)) {
    if (raster.data.length >= 3) {
      return writeRgbBands(target, raster);
    }
    return writeSingleBand(target, raster.data[0], raster.noData);
  }

  if (raster.bandCount >= 3 && raster.interleaved) {
    return writeInterleavedRgb(target, raster);
  }

  return writeSingleBand(target, raster.data, raster.noData);
}

/**
 * Writes a single-band raster using a color ramp.
 */
function writeSingleBand(
  target: Uint8ClampedArray,
  data: ArrayLike<number>,
  noData?: number | null
): RasterStatistics | null {
  const stats = computeRasterStatistics(data, noData);
  if (!stats) {
    return null;
  }

  for (let index = 0; index < data.length; index++) {
    const value = data[index];
    const outputIndex = index * 4;

    if (!Number.isFinite(value) || value === noData) {
      target[outputIndex + 3] = 0;
      continue;
    }

    const normalized = clamp((value - stats.lowerBound) / (stats.upperBound - stats.lowerBound));
    const [red, green, blue] = sampleColorRamp(Math.sqrt(normalized));
    target[outputIndex] = red;
    target[outputIndex + 1] = green;
    target[outputIndex + 2] = blue;
    target[outputIndex + 3] = 210;
  }

  return stats;
}

/**
 * Writes three separate bands as RGB output.
 */
function writeRgbBands(target: Uint8ClampedArray, raster: RasterData): RasterStatistics | null {
  const [redBand, greenBand, blueBand] = raster.data as ArrayLike<number>[];
  const redStats = computeRasterStatistics(redBand, raster.noData);
  const greenStats = computeRasterStatistics(greenBand, raster.noData);
  const blueStats = computeRasterStatistics(blueBand, raster.noData);

  for (let index = 0; index < redBand.length; index++) {
    const outputIndex = index * 4;
    const redValue = redBand[index];
    const greenValue = greenBand[index];
    const blueValue = blueBand[index];

    if (
      !Number.isFinite(redValue) ||
      !Number.isFinite(greenValue) ||
      !Number.isFinite(blueValue) ||
      redValue === raster.noData ||
      greenValue === raster.noData ||
      blueValue === raster.noData
    ) {
      target[outputIndex + 3] = 0;
      continue;
    }

    target[outputIndex] = scaleToByte(redValue, redStats);
    target[outputIndex + 1] = scaleToByte(greenValue, greenStats);
    target[outputIndex + 2] = scaleToByte(blueValue, blueStats);
    target[outputIndex + 3] = 220;
  }

  return redStats;
}

/**
 * Writes interleaved RGB data into the output buffer.
 */
function writeInterleavedRgb(target: Uint8ClampedArray, raster: RasterData): RasterStatistics | null {
  const data = raster.data as ArrayLike<number>;
  const step = raster.bandCount;

  for (let index = 0; index < raster.width * raster.height; index++) {
    const inputIndex = index * step;
    const outputIndex = index * 4;

    target[outputIndex] = clampByte(data[inputIndex]);
    target[outputIndex + 1] = clampByte(data[inputIndex + 1]);
    target[outputIndex + 2] = clampByte(data[inputIndex + 2]);
    target[outputIndex + 3] = 220;
  }

  return null;
}

/**
 * Computes robust display statistics using sampled percentiles.
 */
function computeRasterStatistics(
  values: ArrayLike<number>,
  noData?: number | null
): RasterStatistics | null {
  let minimum = Infinity;
  let maximum = -Infinity;
  const sample: number[] = [];
  const stride = Math.max(1, Math.floor(values.length / 4096));

  for (let index = 0; index < values.length; index += stride) {
    const value = values[index];
    if (!Number.isFinite(value) || value === noData) {
      continue;
    }
    minimum = Math.min(minimum, value);
    maximum = Math.max(maximum, value);
    sample.push(value);
  }

  if (!sample.length || !Number.isFinite(minimum) || !Number.isFinite(maximum)) {
    return null;
  }

  sample.sort((left, right) => left - right);
  const lowerBound = sample[Math.floor((sample.length - 1) * 0.02)];
  const upperBound = sample[Math.floor((sample.length - 1) * 0.98)];

  return {
    minimum,
    maximum,
    lowerBound,
    upperBound: upperBound === lowerBound ? upperBound + 1 : upperBound
  };
}

/**
 * Samples a compact blue-to-yellow color ramp.
 */
function sampleColorRamp(value: number): [number, number, number] {
  const stops = [
    [8, 29, 88],
    [32, 83, 150],
    [39, 145, 140],
    [100, 189, 99],
    [252, 217, 98]
  ] as const;

  const clampedValue = clamp(value);
  const scaledIndex = clampedValue * (stops.length - 1);
  const lowerIndex = Math.floor(scaledIndex);
  const upperIndex = Math.min(stops.length - 1, lowerIndex + 1);
  const mix = scaledIndex - lowerIndex;
  const lower = stops[lowerIndex];
  const upper = stops[upperIndex];

  return [
    Math.round(lower[0] + (upper[0] - lower[0]) * mix),
    Math.round(lower[1] + (upper[1] - lower[1]) * mix),
    Math.round(lower[2] + (upper[2] - lower[2]) * mix)
  ];
}

/**
 * Scales a numeric value into byte range using provided statistics.
 */
function scaleToByte(value: number, stats: RasterStatistics | null): number {
  if (!stats) {
    return clampByte(value);
  }

  const normalized = clamp((value - stats.lowerBound) / (stats.upperBound - stats.lowerBound));
  return Math.round(normalized * 255);
}

/**
 * Flattens a raster bounding box for BitmapLayer.
 */
function flattenBoundingBox(boundingBox: RasterBoundingBox): [number, number, number, number] {
  return [boundingBox[0][0], boundingBox[0][1], boundingBox[1][0], boundingBox[1][1]];
}

/**
 * Clamps a normalized value to [0, 1].
 */
function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/**
 * Clamps any numeric sample into [0, 255].
 */
function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

/**
 * Normalizes unknown error values for display.
 */
function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Loading indicator shown while viewport raster requests are in flight.
 */
function LoadingSpinner() {
  return (
    <div
      style={{
        position: 'absolute',
        left: 20,
        bottom: 20,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 12px',
        background: 'rgba(255, 255, 255, 0.92)',
        color: '#121212',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 13,
        lineHeight: 1.4
      }}
    >
      <div
        style={{
          width: 16,
          height: 16,
          border: '2px solid rgba(18, 18, 18, 0.18)',
          borderTopColor: '#121212',
          borderRadius: '50%',
          animation: 'geotiff-spinner 0.75s linear infinite'
        }}
      />
      <span>Loading raster</span>
      <style>{`
        @keyframes geotiff-spinner {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Compact metadata and status panel.
 */
function InfoPanel(props: {
  loading: boolean;
  error: string | null;
  metadata: RasterSourceMetadata | null;
  rangeStats: RangeStats;
  stats: RasterStatistics | null;
  viewState: MapViewState;
  children?: React.ReactNode;
}) {
  const {children, error, loading, metadata, rangeStats, stats, viewState} = props;

  return (
    <div
      style={{
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 10,
        width: 340,
        maxHeight: 'calc(100% - 40px)',
        overflow: 'auto',
        background: 'rgba(255, 255, 255, 0.95)',
        color: '#121212',
        padding: '12px 16px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.25)',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 13,
        lineHeight: 1.5
      }}
    >
      <h3 style={{margin: '0 0 8px'}}>GeoTIFF Raster Source</h3>
      {children}
      <p style={{margin: '0 0 8px'}}>
        Viewport requests stay in the source CRS and return typed raster values that this demo
        colorizes client-side.
      </p>
      <div
        style={{
          height: 10,
          borderRadius: 4,
          marginBottom: 8,
          background:
            'linear-gradient(90deg, rgb(8,29,88), rgb(32,83,150), rgb(39,145,140), rgb(100,189,99), rgb(252,217,98))'
        }}
      />
      {stats ? (
        <div style={{marginBottom: 8}}>
          Range: {stats.lowerBound.toFixed(2)} to {stats.upperBound.toFixed(2)}
          <br />
          Data extent: {stats.minimum.toFixed(2)} to {stats.maximum.toFixed(2)}
        </div>
      ) : null}
      <div style={{marginBottom: 8}}>
        View: {viewState.longitude.toFixed(3)}, {viewState.latitude.toFixed(3)} at zoom{' '}
        {viewState.zoom.toFixed(2)}
      </div>
      {loading ? <div style={{marginBottom: 8}}>Loading raster…</div> : null}
      {error ? <div style={{marginBottom: 8, color: '#b00020'}}>{error}</div> : null}
      <RangeStatsViewer rangeStats={rangeStats} />
      <pre
        style={{
          margin: 0,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          fontSize: 12,
          lineHeight: 1.4
        }}
      >
        {metadata ? JSON.stringify(metadata, null, 2) : 'Loading metadata…'}
      </pre>
    </div>
  );
}

/**
 * Renders byte-range coalescing counters for the remote GeoTIFF transport.
 */
function RangeStatsViewer({rangeStats}: {rangeStats: RangeStats}) {
  if (rangeStats.logicalRanges === 0) {
    return null;
  }

  return (
    <div
      style={{
        lineHeight: 1.4,
        marginBottom: 8,
        padding: '10px 12px',
        borderRadius: 8,
        background: 'rgba(246, 248, 252, 0.96)',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.14)'
      }}
    >
      <div style={{fontWeight: 600, marginBottom: 6}}>Range transport</div>
      <table style={{borderCollapse: 'collapse', width: '100%'}}>
        <tbody>
          <RangeStatsRow
            label="Ranges"
            value={`${rangeStats.logicalRanges} logical → ${rangeStats.completedTransportRanges}/${rangeStats.transportRanges} HTTP`}
          />
          <RangeStatsRow label="Batches" value={rangeStats.rangeBatches} />
          <RangeStatsRow label="Coalesced" value={rangeStats.coalescedRanges} />
          <RangeStatsRow label="Requested" value={formatBytes(rangeStats.requestedBytes)} />
          <RangeStatsRow label="Transport" value={formatBytes(rangeStats.transportBytes)} />
          <RangeStatsRow label="Received" value={formatBytes(rangeStats.responseBytes)} />
          <RangeStatsRow label="Overfetch" value={formatBytes(rangeStats.overfetchBytes)} />
          <RangeStatsRow label="Failures" value={rangeStats.failedTransportRanges} />
          <RangeStatsRow label="Aborted" value={rangeStats.abortedLogicalRanges} />
          <RangeStatsRow label="Full-file fallback" value={rangeStats.fullResponseFallbacks} />
        </tbody>
      </table>
    </div>
  );
}

function RangeStatsRow({label, value}: {label: string; value: React.ReactNode}) {
  return (
    <tr>
      <th
        style={{
          fontWeight: 400,
          paddingRight: 8,
          paddingTop: 2,
          paddingBottom: 2,
          textAlign: 'left',
          whiteSpace: 'nowrap'
        }}
      >
        {label}
      </th>
      <td
        style={{
          fontFamily: 'monospace',
          textAlign: 'right',
          paddingTop: 2,
          paddingBottom: 2
        }}
      >
        {value}
      </td>
    </tr>
  );
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
