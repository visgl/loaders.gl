// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import React, {useEffect, useMemo, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {OrthographicView} from '@deck.gl/core';
import {BitmapLayer} from '@deck.gl/layers';
import type {BitmapBoundingBox} from '@deck.gl/layers';
import DeckGL from '@deck.gl/react';

import {createDataSource} from '@loaders.gl/core';
import type {RasterData} from '@loaders.gl/loader-utils';
import type {OMETiffImageSource, OMETiffSourceLoaderMetadata} from '@loaders.gl/geotiff';
import {OMETiffSourceLoader} from '@loaders.gl/geotiff';
import {createDeckFullscreenWidget, createDeckStatsWidget} from '../shared/create-deck-stats-widget';

const DATA_URL = '/multi-channel.ome.tif';

type AppProps = {
  hideChrome?: boolean;
  children?: React.ReactNode;
};

type RasterStatistics = {
  minimum: number;
  maximum: number;
  lowerBound: number;
  upperBound: number;
};

type RasterCanvasState = {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  stats: RasterStatistics | null;
};

type DisplayMode = 'rgb' | `channel-${number}`;

type OrthographicViewState = {
  target: [number, number];
  zoom: number;
  minZoom: number;
  maxZoom: number;
};

type RasterDimensions = {
  width: number;
  height: number;
};

const DEFAULT_VIEW_STATE: OrthographicViewState = {
  target: [0, 0],
  zoom: 0,
  minZoom: -4,
  maxZoom: 12
};

/**
 * Website demo for non-geospatial OME-TIFF plane rendering.
 */
export default function App(props: AppProps = {}) {
  const sourceRef = useRef<OMETiffImageSource | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  if (!sourceRef.current) {
    sourceRef.current = createDataSource(DATA_URL, [OMETiffSourceLoader], {
      core: {type: 'ometiff'},
      ometiff: {}
    }) as OMETiffImageSource;
  }

  const [metadata, setMetadata] = useState<OMETiffSourceLoaderMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState(0);
  const [selectedTime, setSelectedTime] = useState(0);
  const [selectedZ, setSelectedZ] = useState(0);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('rgb');
  const [stats, setStats] = useState<RasterStatistics | null>(null);
  const [rasterCanvas, setRasterCanvas] = useState<HTMLCanvasElement | null>(null);
  const [rasterDimensions, setRasterDimensions] = useState<RasterDimensions | null>(null);
  const [viewportSize, setViewportSize] = useState<RasterDimensions>({width: 1, height: 1});
  const [viewState, setViewState] = useState<OrthographicViewState>(DEFAULT_VIEW_STATE);
  const showLoadingSpinner = loading;

  useEffect(() => {
    const viewportElement = viewportRef.current;
    if (!viewportElement) {
      return;
    }

    const updateViewportSize = () => {
      setViewportSize({
        width: Math.max(1, Math.round(viewportElement.clientWidth)),
        height: Math.max(1, Math.round(viewportElement.clientHeight))
      });
    };

    updateViewportSize();

    const resizeObserver = new ResizeObserver(updateViewportSize);
    resizeObserver.observe(viewportElement);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadMetadata = async () => {
      setLoading(true);
      try {
        const nextMetadata = await sourceRef.current!.getMetadata();
        if (cancelled) {
          return;
        }

        setMetadata(nextMetadata);
        setDisplayMode(nextMetadata.bandCount >= 3 ? 'rgb' : 'channel-0');
        setError(null);
      } catch (nextError) {
        console.error('OME-TIFF example metadata load failed', nextError);
        if (!cancelled) {
          setError(getErrorMessage(nextError));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadMetadata();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!metadata) {
      return;
    }

    const abortController = new AbortController();

    const loadRaster = async () => {
      setLoading(true);
      try {
        const raster = await sourceRef.current!.getRaster({
          level: selectedLevel,
          t: selectedTime,
          z: selectedZ,
          channels: getRequestedChannels(metadata, displayMode),
          signal: abortController.signal
        });
        if (abortController.signal.aborted) {
          return;
        }

        const nextRasterCanvas = renderRasterToCanvas(raster);
        setRasterCanvas(nextRasterCanvas.canvas);
        setRasterDimensions({width: nextRasterCanvas.width, height: nextRasterCanvas.height});
        setStats(nextRasterCanvas.stats);
        setError(null);
      } catch (nextError) {
        if (abortController.signal.aborted) {
          return;
        }
        console.error('OME-TIFF example raster load failed', nextError);
        setError(getErrorMessage(nextError));
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void loadRaster();

    return () => abortController.abort();
  }, [displayMode, metadata, selectedLevel, selectedTime, selectedZ]);

  useEffect(() => {
    if (!rasterDimensions) {
      return;
    }

    setViewState(createInitialViewState(rasterDimensions, viewportSize));
  }, [rasterDimensions, viewportSize.height, viewportSize.width]);

  const displayModes = useMemo(() => {
    if (!metadata) {
      return [];
    }

    return [
      ...(metadata.bandCount >= 3 ? [{label: 'RGB composite', value: 'rgb' as const}] : []),
      ...Array.from({length: metadata.bandCount}, (_, index) => ({
        label: metadata.channels[index]?.name || `Channel ${index}`,
        value: `channel-${index}` as const
      }))
    ];
  }, [metadata]);

  const deckView = useMemo(
    () =>
      new OrthographicView({
        id: 'ome-tiff-view',
        controller: true,
        flipY: true
      }),
    []
  );

  const layers = useMemo(() => {
    if (!rasterCanvas || !rasterDimensions) {
      return [];
    }

    return [
      new BitmapLayer({
        id: 'ome-tiff-layer',
        image: rasterCanvas,
        bounds: getRasterBounds(rasterDimensions),
        opacity: 1
      })
    ];
  }, [rasterCanvas, rasterDimensions]);

  const widgets = useMemo(() => {
    if (props.hideChrome) {
      return [];
    }

    return [createDeckFullscreenWidget('ometiff-fullscreen'), createDeckStatsWidget('ometiff-stats')];
  }, [props.hideChrome]);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: props.hideChrome ? '1fr' : 'minmax(0, 1fr) 340px',
        height: '100%',
        background: '#111827',
        color: '#111827'
      }}
    >
      <div
        ref={viewportRef}
        style={{
          position: 'relative',
          overflow: 'hidden',
          background:
            'linear-gradient(45deg, rgba(255,255,255,0.06) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.06) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.06) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.06) 75%)',
          backgroundSize: '28px 28px',
          backgroundPosition: '0 0, 0 14px, 14px -14px, -14px 0'
        }}
      >
        <DeckGL
          layers={layers}
          views={deckView}
          viewState={viewState}
          widgets={widgets}
          onViewStateChange={({viewState: nextViewState}) =>
            setViewState(normalizeViewState(nextViewState))
          }
          getCursor={({isDragging}) => (isDragging ? 'grabbing' : 'grab')}
          style={{position: 'absolute', left: '0', top: '0', width: '100%', height: '100%'}}
        />
        {showLoadingSpinner ? <LoadingSpinner /> : null}
      </div>
      {!props.hideChrome ? (
        <InfoPanel
          metadata={metadata}
          error={error}
          loading={loading}
          stats={stats}
          selectedLevel={selectedLevel}
          selectedTime={selectedTime}
          selectedZ={selectedZ}
          displayMode={displayMode}
          displayModes={displayModes}
          onLevelChange={setSelectedLevel}
          onTimeChange={setSelectedTime}
          onZChange={setSelectedZ}
          onDisplayModeChange={value => setDisplayMode(value as DisplayMode)}
        >
          {props.children}
        </InfoPanel>
      ) : null}
    </div>
  );
}

/**
 * Mounts the demo into a DOM container.
 */
export function renderToDOM(container = document.body) {
  createRoot(container).render(<App />);
}

/**
 * Requests the channels needed for the active display mode.
 */
function getRequestedChannels(
  metadata: OMETiffSourceLoaderMetadata,
  displayMode: DisplayMode
): number[] {
  if (displayMode === 'rgb') {
    return metadata.bandCount >= 3 ? [0, 1, 2] : [0];
  }

  return [Number(displayMode.replace('channel-', ''))];
}

/**
 * Converts typed raster data into an upload-ready canvas for DeckGL.
 */
function renderRasterToCanvas(raster: RasterData): RasterCanvasState {
  const canvas = document.createElement('canvas');
  canvas.width = raster.width;
  canvas.height = raster.height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Could not create 2D canvas context for OME-TIFF rendering.');
  }

  const imageData = context.createImageData(raster.width, raster.height);
  const stats = writeRasterColors(imageData.data, raster);
  context.putImageData(imageData, 0, 0);

  return {
    canvas,
    width: raster.width,
    height: raster.height,
    stats
  };
}

/**
 * Returns a raster-aligned bitmap quadrilateral in image pixel coordinates.
 */
function getRasterBounds(rasterDimensions: RasterDimensions): BitmapBoundingBox {
  return [
    [0, rasterDimensions.height],
    [0, 0],
    [rasterDimensions.width, 0],
    [rasterDimensions.width, rasterDimensions.height]
  ];
}

/**
 * Normalizes DeckGL view-state updates into the shape used by the example.
 */
function normalizeViewState(nextViewState: Record<string, unknown>): OrthographicViewState {
  const target = Array.isArray(nextViewState.target)
    ? [Number(nextViewState.target[0] || 0), Number(nextViewState.target[1] || 0)]
    : DEFAULT_VIEW_STATE.target;

  return {
    target: [target[0], target[1]],
    zoom: Number(nextViewState.zoom ?? DEFAULT_VIEW_STATE.zoom),
    minZoom: Number(nextViewState.minZoom ?? DEFAULT_VIEW_STATE.minZoom),
    maxZoom: Number(nextViewState.maxZoom ?? DEFAULT_VIEW_STATE.maxZoom)
  };
}

/**
 * Converts one-band or three-band OME-TIFF data into RGBA pixels.
 */
function writeRasterColors(target: Uint8ClampedArray, raster: RasterData): RasterStatistics | null {
  if (Array.isArray(raster.data) && raster.data.length >= 3) {
    return writeRgbBands(target, raster.data);
  }

  const source = Array.isArray(raster.data) ? raster.data[0] : raster.data;
  return writeSingleBand(target, source);
}

/**
 * Writes one scalar channel using a blue-to-yellow ramp.
 */
function writeSingleBand(target: Uint8ClampedArray, data: ArrayLike<number>): RasterStatistics | null {
  const stats = computeRasterStatistics(data);
  if (!stats) {
    return null;
  }

  for (let index = 0; index < data.length; index++) {
    const normalized = clamp((data[index] - stats.lowerBound) / (stats.upperBound - stats.lowerBound));
    const [red, green, blue] = sampleColorRamp(Math.sqrt(normalized));
    const outputIndex = index * 4;
    target[outputIndex] = red;
    target[outputIndex + 1] = green;
    target[outputIndex + 2] = blue;
    target[outputIndex + 3] = 255;
  }

  return stats;
}

/**
 * Writes three bands as an RGB composite.
 */
function writeRgbBands(target: Uint8ClampedArray, bands: ArrayLike<number>[]): RasterStatistics | null {
  const statistics = bands.slice(0, 3).map(computeRasterStatistics);

  for (let index = 0; index < bands[0].length; index++) {
    const outputIndex = index * 4;
    target[outputIndex] = scaleToByte(bands[0][index], statistics[0]);
    target[outputIndex + 1] = scaleToByte(bands[1][index], statistics[1]);
    target[outputIndex + 2] = scaleToByte(bands[2][index], statistics[2]);
    target[outputIndex + 3] = 255;
  }

  return statistics[0];
}

/**
 * Computes robust display statistics from sampled values.
 */
function computeRasterStatistics(values: ArrayLike<number>): RasterStatistics | null {
  let minimum = Infinity;
  let maximum = -Infinity;
  const sample: number[] = [];
  const stride = Math.max(1, Math.floor(values.length / 4096));

  for (let index = 0; index < values.length; index += stride) {
    const value = values[index];
    if (!Number.isFinite(value)) {
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
 * Scales a numeric value into byte range using display statistics.
 */
function scaleToByte(value: number, stats: RasterStatistics | null): number {
  if (!stats) {
    return clampByte(value);
  }

  const normalized = clamp((value - stats.lowerBound) / (stats.upperBound - stats.lowerBound));
  return Math.round(normalized * 255);
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

  const scaledIndex = clamp(value) * (stops.length - 1);
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
 * Normalizes unknown error values for display.
 */
function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
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
 * Creates the initial orthographic view state that fits the full raster in frame.
 */
function createInitialViewState(
  rasterDimensions: RasterDimensions,
  viewportSize: RasterDimensions
): OrthographicViewState {
  return {
    target: [rasterDimensions.width / 2, rasterDimensions.height / 2],
    zoom: getFitZoom(rasterDimensions, viewportSize),
    minZoom: -4,
    maxZoom: 12
  };
}

/**
 * Computes a zoom level that fits the full raster inside the viewport.
 */
function getFitZoom(rasterDimensions: RasterDimensions, viewportSize: RasterDimensions): number {
  const scale = Math.min(
    viewportSize.width / Math.max(1, rasterDimensions.width),
    viewportSize.height / Math.max(1, rasterDimensions.height)
  );

  return Math.log2(Math.max(scale, 1 / 1024));
}

/**
 * Loading indicator shown while OME-TIFF planes are in flight.
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
          animation: 'ometiff-spinner 0.75s linear infinite'
        }}
      />
      <span>Loading plane</span>
      <style>{`
        @keyframes ometiff-spinner {
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
 * Control and metadata panel for the OME-TIFF viewer.
 */
function InfoPanel(props: {
  metadata: OMETiffSourceLoaderMetadata | null;
  error: string | null;
  loading: boolean;
  stats: RasterStatistics | null;
  selectedLevel: number;
  selectedTime: number;
  selectedZ: number;
  displayMode: string;
  displayModes: Array<{label: string; value: string}>;
  onLevelChange: (value: number) => void;
  onTimeChange: (value: number) => void;
  onZChange: (value: number) => void;
  onDisplayModeChange: (value: string) => void;
  children?: React.ReactNode;
}) {
  const {
    metadata,
    error,
    loading,
    stats,
    selectedLevel,
    selectedTime,
    selectedZ,
    displayMode,
    displayModes,
    onLevelChange,
    onTimeChange,
    onZChange,
    onDisplayModeChange,
    children
  } = props;

  return (
    <div
      style={{
        overflow: 'auto',
        background: 'rgba(255, 255, 255, 0.97)',
        padding: '16px 18px',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 13,
        lineHeight: 1.5
      }}
    >
      <h3 style={{margin: '0 0 8px'}}>OME-TIFF Source</h3>
      {children}
      <p style={{margin: '0 0 12px'}}>
        This demo loads 2D planes from a non-geospatial OME-TIFF and renders them as either an RGB
        composite or a single-channel intensity image.
      </p>
      <div style={{marginBottom: 12, color: '#46536a'}}>Drag to pan. Use the mouse wheel to zoom.</div>
      <ControlGroup label="Display mode">
        <select value={displayMode} onChange={event => onDisplayModeChange(event.target.value)}>
          {displayModes.map(mode => (
            <option key={mode.value} value={mode.value}>
              {mode.label}
            </option>
          ))}
        </select>
      </ControlGroup>
      <ControlGroup label="Level">
        <select
          value={selectedLevel}
          onChange={event => onLevelChange(Number(event.target.value))}
          disabled={!metadata}
        >
          {metadata?.levels.map(level => (
            <option key={level.level} value={level.level}>
              {level.level} ({level.width}×{level.height})
            </option>
          ))}
        </select>
      </ControlGroup>
      <ControlGroup label="Time index">
        <select
          value={selectedTime}
          onChange={event => onTimeChange(Number(event.target.value))}
          disabled={!metadata}
        >
          {Array.from({length: metadata?.sizeT || 1}, (_, index) => (
            <option key={index} value={index}>
              {index}
            </option>
          ))}
        </select>
      </ControlGroup>
      <ControlGroup label="Z index">
        <select
          value={selectedZ}
          onChange={event => onZChange(Number(event.target.value))}
          disabled={!metadata}
        >
          {Array.from({length: metadata?.sizeZ || 1}, (_, index) => (
            <option key={index} value={index}>
              {index}
            </option>
          ))}
        </select>
      </ControlGroup>
      {stats ? (
        <div style={{marginBottom: 8}}>
          Range: {stats.lowerBound.toFixed(2)} to {stats.upperBound.toFixed(2)}
          <br />
          Data extent: {stats.minimum.toFixed(2)} to {stats.maximum.toFixed(2)}
        </div>
      ) : null}
      {loading ? <div style={{marginBottom: 8}}>Loading plane…</div> : null}
      {error ? <div style={{marginBottom: 8, color: '#b00020'}}>{error}</div> : null}
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
 * Small labeled control group.
 */
function ControlGroup(props: {label: string; children: React.ReactNode}) {
  return (
    <label style={{display: 'block', marginBottom: 10}}>
      <div style={{fontWeight: 600, marginBottom: 4}}>{props.label}</div>
      <div>{props.children}</div>
    </label>
  );
}
