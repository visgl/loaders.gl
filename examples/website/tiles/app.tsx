// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// React
import React, {useRef, useState, useEffect} from 'react';
import {createRoot} from 'react-dom/client';

// loaders.gl sources and loaders
import type {
  VectorTileSource,
  ImageTileSource,
  TileRangeRequestEvent
} from '@loaders.gl/loader-utils';
import {createDataSource} from '@loaders.gl/core';
import {PMTilesSource} from '@loaders.gl/pmtiles';
import {MVTSource, TableTileSource} from '@loaders.gl/mvt';
import {MLTSource} from '@loaders.gl/mlt';
import {_GeoJSONLoader as GeoJSONLoader} from '@loaders.gl/json';

// D\deck.gl + layers
import DeckGL from '@deck.gl/react';
import {MapView} from '@deck.gl/core';
import {TileSourceLayer} from './components/tile-source-layer';

// Basemap
import {Map} from 'react-map-gl';
import maplibregl from 'maplibre-gl';

// CUT IF YOU COPY THIS EXAMPLE
import {Example, ExamplePanel, Attributions, MetadataViewer} from './components/example-panel';
import {EXAMPLES, INITIAL_CATEGORY_NAME, INITIAL_EXAMPLE_NAME} from './examples';
import {INITIAL_MAP_STYLE} from './examples';
// END CUT

/** Arbitrary initial view state */
const INITIAL_VIEW_STATE = {latitude: 47.65, longitude: 7, zoom: 2, maxZoom: 20};

/** Application props (used by website MDX pages to configure example */
type AppProps = {
  /** Controls which examples are shown */
  format?: string;
  /** Show tile borders */
  showTileBorders?: boolean;
  /** On tiles load */
  onTilesLoad?: Function;
  /** Any informational text to display in the overlay */
  children?: React.Children;
};

/** Application state */
type AppState = {
  /** Currently active tile source */
  tileSource: VectorTileSource | ImageTileSource;
  /** Metadata loaded from active tile source */
  metadata: string;
  /**Current view state */
  viewState: Record<string, number>;
  /** Data-source, metadata, or tile-load error to show in the example overlay. */
  error: string | null;
};

type RangeStats = {
  logicalRanges: number;
  rangeBatches: number;
  transportRanges: number;
  completedTransportRanges: number;
  coalescedRanges: number;
  requestedBytes: number;
  transportBytes: number;
  responseBytes: number;
  overfetchBytes: number;
  failedTransportRanges: number;
  abortedLogicalRanges: number;
  fullResponseFallbacks: number;
};

export default function App(props: AppProps = {}) {
  const rangeStatsRef = useRef<RangeStats>(createEmptyRangeStats());
  const [rangeStats, setRangeStats] = useState<RangeStats>(rangeStatsRef.current);
  const [currentExample, setCurrentExample] = useState<Example | null>(null);
  const [state, setState] = useState<AppState>({
    tileSource: null,
    metadata: null,
    viewState: INITIAL_VIEW_STATE,
    // TODO - handle errors
    error: null
  });

  const {tileSource, metadata} = state;
  const tileLayer =
    tileSource &&
    new TileSourceLayer({
      data: tileSource,
      tileSource,
      showTileBorders: true,
      // @ts-expect-error
      metadata,
      onTileError: onTileLoadError,
      onTilesLoad: props.onTilesLoad,
      pickable: true,
      autoHighlight: true
      // custom props
    });

  return (
    <div style={{position: 'relative', height: '100%'}}>
      <ExamplePanel
        title="Tileset Metadata"
        examples={EXAMPLES}
        format={props.format}
        initialCategoryName={INITIAL_CATEGORY_NAME}
        initialExampleName={INITIAL_EXAMPLE_NAME}
        onExampleChange={onExampleChange}
      >
        <MetadataViewer metadata={metadata} />
        <ErrorViewer error={state.error} example={currentExample} />
        <RangeStatsViewer rangeStats={rangeStats} />
        <LocalRangeServerNote example={currentExample} />
        {props.children}
        {/* error ? <div style={{color: 'red'}}>{error}</div> : '' */}
        <pre style={{textAlign: 'center', margin: 0}}>
          {/* long/lat: {viewState.longitude.toFixed(5)}, {viewState.latitude.toFixed(5)}, zoom:{' '} */}
          {/* viewState.zoom.toFixed(2) */}
        </pre>
      </ExamplePanel>

      <DeckGL
        layers={[tileLayer]}
        views={new MapView({repeat: true})}
        initialViewState={state.viewState}
        controller={true}
        getTooltip={getTooltip}
      >
        <Map mapLib={maplibregl} mapStyle={INITIAL_MAP_STYLE} />
        <Attributions attributions={metadata?.attributions} />
      </DeckGL>
    </div>
  );

  async function onExampleChange(args: {
    categoryName: string;
    exampleName: string;
    example: Example;
  }) {
    const {categoryName, exampleName, example} = args;

    const url = example.data;
    try {
      rangeStatsRef.current = createEmptyRangeStats();
      setRangeStats(rangeStatsRef.current);
      setCurrentExample(example);

      let tileSource = createTileSource(example, onTileRangeRequest);

      setState((state) => ({
        ...state,
        tileSource,
        metadata: null,
        error: null
      }));

      (async () => {
        const metadata = await tileSource.getMetadata();
        let initialViewState = {...state.viewState, ...example.viewState};
        initialViewState = adjustViewStateToMetadata(initialViewState, metadata);

        setState((state) => ({
          ...state,
          initialViewState,
          error: null,
          metadata: metadata ? JSON.stringify(metadata, null, 2) : ''
        }));
      })().catch((error) => {
        console.error('Failed to load metadata', url, error);
        setState((state) => ({
          ...state,
          metadata: null,
          error: `Could not load metadata for ${exampleName}: ${getErrorMessage(error)}`
        }));
      });
    } catch (error) {
      console.error('Failed to load data', url, error);
      setState((state) => ({...state, error: `Could not load ${exampleName}: ${getErrorMessage(error)}`}));
    }
  }

  function onTileLoadError(error: unknown, tileParameters?: unknown): void {
    console.error('Failed to load tile', tileParameters, error);
    setState((state) => ({
      ...state,
      error: `Could not load one or more tiles: ${getErrorMessage(error)}`
    }));
  }

  function onTileRangeRequest(event: TileRangeRequestEvent): void {
    const rangeStats = updateRangeStats(rangeStatsRef.current, event);
    rangeStatsRef.current = rangeStats;

    if (event.type === 'batch' || event.type === 'response' || event.type === 'error' || event.type === 'abort') {
      setRangeStats(rangeStats);
    }
  }
}

function ErrorViewer({error, example}: {error: string | null; example: Example | null}) {
  if (!error) {
    return null;
  }

  return (
    <div
      style={{
        background: '#ffe6e6',
        color: '#700',
        lineHeight: 1.4,
        marginBottom: 8,
        padding: 8,
        whiteSpace: 'pre-wrap'
      }}
    >
      <b>Tile example error</b>
      <div>{error}</div>
      {example?.localRangeServer ? (
        <div>
          If you are testing the local PMTiles entry, start the range server in the loaders.gl
          repository root:
          <pre style={{whiteSpace: 'pre-wrap'}}>
            yarn serve-range --root ./modules/pmtiles/test/data/pmtiles-v3 --port 9000
          </pre>
        </div>
      ) : null}
    </div>
  );
}

function getTooltip(info) {
  if (info.tile) {
    const {x, y, z} = info.tile.index;
    return `tile: x: ${x}, y: ${y}, z: ${z}`;
  }
  return null;
}

export function renderToDOM(container: HTMLElement) {
  createRoot(container).render(<App />);
}

// Helpers

/** Create a source from the example url */
function createTileSource(
  example: Example,
  onTileRangeRequest: (event: TileRangeRequestEvent) => void
): VectorTileSource | ImageTileSource {
  const url = example.data;
  return createDataSource(
    url,
    [PMTilesSource, TableTileSource, MVTSource, MLTSource],
    {
      core: {
        attributions: example.attributions,
        loaders: [GeoJSONLoader],
        // Make the Schema more presentable by limiting the number of values per column the field metadata
        loadOptions: {
          tilejson: {maxValues: 10}
        }
      },
      pmtiles: {
      },
      tileRangeRequest: {
        batchDelayMs: 50,
        onEvent: onTileRangeRequest
      },
      table: {
        generateId: true,
      },
      mvt: {},
      mlt: {}
    }
  );
}

function createEmptyRangeStats(): RangeStats {
  return {
    logicalRanges: 0,
    rangeBatches: 0,
    transportRanges: 0,
    completedTransportRanges: 0,
    coalescedRanges: 0,
    requestedBytes: 0,
    transportBytes: 0,
    responseBytes: 0,
    overfetchBytes: 0,
    failedTransportRanges: 0,
    abortedLogicalRanges: 0,
    fullResponseFallbacks: 0
  };
}

function updateRangeStats(rangeStats: RangeStats, event: TileRangeRequestEvent): RangeStats {
  const nextRangeStats = {...rangeStats};
  switch (event.type) {
    case 'queued':
      nextRangeStats.logicalRanges += event.logicalRequestCount || 0;
      nextRangeStats.requestedBytes += event.logicalBytes || 0;
      break;
    case 'batch':
      nextRangeStats.rangeBatches++;
      nextRangeStats.transportRanges += event.transportRequestCount || 0;
      nextRangeStats.transportBytes += event.transportBytes || 0;
      nextRangeStats.overfetchBytes += event.overfetchBytes || 0;
      nextRangeStats.coalescedRanges += Math.max(
        (event.logicalRequestCount || 0) - (event.transportRequestCount || 0),
        0
      );
      break;
    case 'response':
      nextRangeStats.completedTransportRanges++;
      nextRangeStats.responseBytes += event.responseBytes || 0;
      if (event.fullResponse) {
        nextRangeStats.fullResponseFallbacks++;
      }
      break;
    case 'error':
      nextRangeStats.failedTransportRanges++;
      break;
    case 'abort':
      nextRangeStats.abortedLogicalRanges += event.logicalRequestCount || 1;
      break;
    default:
  }
  return nextRangeStats;
}

function RangeStatsViewer({rangeStats}: {rangeStats: RangeStats}) {
  if (rangeStats.logicalRanges === 0) {
    return null;
  }

  return (
    <div style={{lineHeight: 1.4, marginBottom: 8}}>
      <b>Range transport</b>
      <table style={{borderCollapse: 'collapse', width: '100%'}}>
        <tbody>
          <RangeStatsRow
            label="Ranges"
            value={`${rangeStats.logicalRanges} logical → ${rangeStats.completedTransportRanges}/${rangeStats.transportRanges} HTTP`}
          />
          <RangeStatsRow label="Coalesced" value={rangeStats.coalescedRanges} />
          <RangeStatsRow label="Requested" value={formatBytes(rangeStats.requestedBytes)} />
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
      <th style={{fontWeight: 400, paddingRight: 8, textAlign: 'left', whiteSpace: 'nowrap'}}>{label}</th>
      <td style={{fontFamily: 'monospace', textAlign: 'right'}}>{value}</td>
    </tr>
  );
}

function LocalRangeServerNote({example}: {example: Example | null}) {
  if (!example?.localRangeServer) {
    return null;
  }

  return (
    <div style={{lineHeight: 1.4, marginBottom: 8}}>
      Run this command from the loaders.gl repository root:
      <pre style={{whiteSpace: 'pre-wrap'}}>
        yarn serve-range --root ./modules/pmtiles/test/data/pmtiles-v3 --port 9000
      </pre>
    </div>
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

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Helper function to adjust view state based on tileset metadata, keep zoom in visible range etc
 * TODO - perhaps TileSourceLayer could provide a callback to let app adjust view state to fit within available tile levels
 */
function adjustViewStateToMetadata(viewState, metadata) {
  if (!metadata) {
    return viewState;
  }

  // Copy to make sure we don't modify input
  viewState = {...viewState};

  // Ensure we are zoomed in to an available zoom level
  if (metadata.minZoom < viewState.zoom) {
    // TODO - basemap seems to get out of sync at too low zooms, so apply a lower bottom.
    viewState.zoom = Math.max(metadata.minZoom, 1.2);
  }
  if (metadata.minZoom > viewState.zoom) {
    viewState.zoom = metadata.maxZoom;
  }
  // If the tileset has a center, user it
  if (typeof metadata.center?.[0] === 'number' && typeof metadata.center?.[1] === 'number') {
    viewState = {
      ...viewState,
      longitude: metadata.center[0],
      latitude: metadata.center[1]
    };
  }
  return viewState;
}
