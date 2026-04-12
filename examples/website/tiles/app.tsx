// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// React
import React, {useMemo, useRef, useState, useEffect} from 'react';
import {createRoot} from 'react-dom/client';

// loaders.gl sources and loaders
import type {
  RangeStats,
  VectorTileSource,
  ImageTileSource,
  RangeRequestEvent
} from '@loaders.gl/loader-utils';
import {createRangeStats, getRangeStats} from '@loaders.gl/loader-utils';
import {createDataSource} from '@loaders.gl/core';
import {PMTilesSource} from '@loaders.gl/pmtiles';
import {MVTSource, TableTileSource} from '@loaders.gl/mvt';
import {MLTSource} from '@loaders.gl/mlt';
import {_GeoJSONLoader as GeoJSONLoader} from '@loaders.gl/json';

// D\deck.gl + layers
import DeckGL from '@deck.gl/react';
import {MapView} from '@deck.gl/core';
import {Tile2DSourceLayer} from '@loaders.gl/deck-layers';

// Basemap
import {Map} from 'react-map-gl';
import maplibregl from 'maplibre-gl';

// CUT IF YOU COPY THIS EXAMPLE
import {Example, ExamplePanel, Attributions, MetadataViewer} from './components/example-panel';
import {EXAMPLES, INITIAL_CATEGORY_NAME, INITIAL_EXAMPLE_NAME} from './examples';
import {INITIAL_MAP_STYLE} from './examples';
// END CUT

const TILE_SOURCE_FACTORIES = [PMTilesSource, TableTileSource, MVTSource, MLTSource] as const;

/** Arbitrary initial view state */
const INITIAL_VIEW_STATE = {latitude: 47.65, longitude: 7, zoom: 2, maxZoom: 20};

/** Application props (used by website MDX pages to configure example */
type AppProps = {
  /** Controls which examples are shown */
  format?: string;
  /** Whether to hide the example controls, metadata, and descriptive overlay. */
  hideChrome?: boolean;
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

export default function App(props: AppProps = {}) {
  const rangeStatsObjectRef = useRef(createRangeStats('pmtiles-example-range-transport'));
  const [rangeStats, setRangeStats] = useState<RangeStats>(
    getRangeStats(rangeStatsObjectRef.current)
  );
  const [hideBasemap, setHideBasemap] = useState(false);
  const [currentExample, setCurrentExample] = useState<Example | null>(null);
  const [state, setState] = useState<AppState>({
    tileSource: null,
    metadata: null,
    viewState: INITIAL_VIEW_STATE,
    // TODO - handle errors
    error: null
  });

  const {tileSource, metadata} = state;
  const sourceOptions = useMemo(
    () =>
      currentExample
        ? {
            core: {
              type: currentExample.sourceType,
              attributions: currentExample.attributions,
              loaders: [GeoJSONLoader],
              loadOptions: {
                tilejson: {maxValues: 10}
              }
            },
            pmtiles: {},
            rangeRequests: {
              batchDelayMs: 50,
              stats: rangeStatsObjectRef.current,
              onEvent: onTileRangeRequest
            },
            table: {
              generateId: true
            },
            mvt: {},
            mlt: {}
          }
        : null,
    [currentExample]
  );
  const tileLayer =
    currentExample &&
    sourceOptions &&
    new Tile2DSourceLayer({
      data: currentExample.data,
      sources: TILE_SOURCE_FACTORIES,
      sourceOptions,
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
        hideChrome={props.hideChrome}
        hideBasemap={hideBasemap}
        initialCategoryName={INITIAL_CATEGORY_NAME}
        initialExampleName={INITIAL_EXAMPLE_NAME}
        onHideBasemapChange={setHideBasemap}
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
        viewState={state.viewState}
        controller={true}
        getTooltip={getTooltip}
        onViewStateChange={({viewState}) =>
          setState((state) => ({
            ...state,
            viewState: viewState as Record<string, number>
          }))
        }
      >
        {!hideBasemap && <Map mapLib={maplibregl} mapStyle={INITIAL_MAP_STYLE} />}
        {!props.hideChrome && <Attributions attributions={metadata?.attributions} />}
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
      rangeStatsObjectRef.current = createRangeStats('pmtiles-example-range-transport');
      setRangeStats(getRangeStats(rangeStatsObjectRef.current));
      setCurrentExample(example);

      let tileSource = createTileSource(
        example,
        rangeStatsObjectRef.current,
        onTileRangeRequest
      );

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
          viewState: initialViewState,
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

  function onTileRangeRequest(event: RangeRequestEvent): void {
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
  rangeStatsObject: ReturnType<typeof createRangeStats>,
  onTileRangeRequest: (event: RangeRequestEvent) => void
): VectorTileSource | ImageTileSource {
  const url = example.data;
  return createDataSource(
    url,
    [PMTilesSource, TableTileSource, MVTSource, MLTSource],
    {
      core: {
        type: example.sourceType,
        attributions: example.attributions,
        loaders: [GeoJSONLoader],
        // Make the Schema more presentable by limiting the number of values per column the field metadata
        loadOptions: {
          tilejson: {maxValues: 10}
        }
      },
      pmtiles: {
      },
      rangeRequests: {
        batchDelayMs: 50,
        stats: rangeStatsObject,
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
