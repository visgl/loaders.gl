// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';

import {
  MapController,
  WebMercatorViewport,
  type MapViewState,
  type PickingInfo
} from '@deck.gl/core';
import {DeckGL} from '@deck.gl/react';
import {FullscreenWidget} from '@deck.gl/widgets';
import {GeoArrowLayer} from '@loaders.gl/deck-layers';
import {
  ParquetDatasetSource,
  type ParquetDatasetTelemetry
} from '@loaders.gl/parquet/parquet-dataset-source';
import type {ParquetRowGroupMetadata} from '@loaders.gl/parquet';
import type {Table as ArrowTable} from 'apache-arrow';
import maplibregl from 'maplibre-gl';
import {Map} from 'react-map-gl';

import {OverturePlacesCatalog} from './overture-catalog';
import './style.css';
import 'maplibre-gl/dist/maplibre-gl.css';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const PARQUET_SOURCE_WORKER_URL = new URL(
  '../../../modules/parquet/dist/parquet-source-worker.js',
  import.meta.url
).toString();
const MAX_RESULT_ROWS = 75_000;
const INITIAL_CONFIDENCE = 0.8;
const INITIAL_VIEW_STATE: MapViewState = {
  longitude: -71.064,
  latitude: 42.357,
  zoom: 12.2,
  minZoom: 3,
  maxZoom: 18,
  pitch: 25,
  bearing: 0
};

type AppProps = {
  /** Hides the explanatory panel when embedded in a custom host. */
  hideChrome?: boolean;
  /** Optional documentation content rendered in the panel. */
  children?: React.ReactNode;
};

type ResultBatch = {
  /** Stable deck.gl layer identifier. */
  id: string;
  /** Arrow table rendered without converting it to object rows. */
  table: ArrowTable;
  /** Number of rows in this batch. */
  rowCount: number;
};

type QuerySummary = {
  /** Current Overture release discovered from STAC. */
  release: string;
  /** Geographic query bounds. */
  bbox: [number, number, number, number];
  /** Elapsed query duration. */
  durationMs: number;
  /** Whether the display limit ended iteration early. */
  limited: boolean;
};

/** Browser-native Overture STAC and GeoParquet range-query example. */
export default function App(props: AppProps = {}) {
  const catalog = useMemo(() => new OverturePlacesCatalog(), []);
  const activeSource = useRef<ParquetDatasetSource | null>(null);
  const queryGeneration = useRef(0);
  const [viewState, setViewState] = useState<MapViewState>(INITIAL_VIEW_STATE);
  const [minimumConfidence, setMinimumConfidence] = useState(INITIAL_CONFIDENCE);
  const [resultBatches, setResultBatches] = useState<ResultBatch[]>([]);
  const [telemetry, setTelemetry] = useState<ParquetDatasetTelemetry | null>(null);
  const [summary, setSummary] = useState<QuerySummary | null>(null);
  const [status, setStatus] = useState('Ready to query the current map view');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const runQuery = useCallback(async () => {
    const generation = ++queryGeneration.current;
    await activeSource.current?.close();
    const bbox = getViewBoundingBox(viewState);
    const source = new ParquetDatasetSource(query => catalog.getFiles(query), {
      core: {worker: true},
      parquet: {preserveBinary: true, workerUrl: PARQUET_SOURCE_WORKER_URL},
      parquetDataset: {fileConcurrency: 2},
      rangeRequests: {batchDelayMs: 0, maxGapBytes: 32_768, rangeExpansionBytes: 0}
    });
    activeSource.current = source;
    setLoading(true);
    setError(null);
    setResultBatches([]);
    setTelemetry(source.getTelemetry());
    setSummary(null);
    setStatus('Discovering the latest Overture release and intersecting STAC assets…');
    const startTime = performance.now();
    let rowCount = 0;
    let limited = false;
    const telemetryTimer = globalThis.setInterval(
      () => setTelemetry(source.getTelemetry()),
      150
    );

    try {
      const release = await catalog.getRelease();
      setStatus(`Reading Overture ${release.id} GeoParquet ranges…`);
      let batchIndex = 0;
      for await (const batch of source.read({
        bbox,
        columns: ['id', 'geometry', 'basic_category', 'confidence'],
        predicate: {op: '>=', args: [{property: 'confidence'}, minimumConfidence]},
        rowGroupFilter: rowGroup => canRowGroupIntersect(rowGroup, bbox),
        batchSize: 12_500,
        concurrency: 2,
        fileConcurrency: 2
      })) {
        if (generation !== queryGeneration.current) {
          return;
        }
        const nextBatch: ResultBatch = {
          id: `overture-${batch.datasetFileIndex}-${batch.rowGroupIndex}-${batchIndex++}`,
          table: batch.data,
          rowCount: batch.length
        };
        rowCount += batch.length;
        setResultBatches(current => [...current, nextBatch]);
        setTelemetry(source.getTelemetry());
        setStatus(`Streaming ${formatInteger(rowCount)} candidate places into Arrow layers…`);
        if (rowCount >= MAX_RESULT_ROWS) {
          limited = true;
          break;
        }
      }
      if (generation === queryGeneration.current) {
        setTelemetry(source.getTelemetry());
        setSummary({
          release: release.id,
          bbox,
          durationMs: performance.now() - startTime,
          limited
        });
        setStatus(
          limited
            ? `Stopped at the ${formatInteger(MAX_RESULT_ROWS)}-row display limit`
            : `Rendered ${formatInteger(rowCount)} candidate places`
        );
      }
    } catch (queryError) {
      if (generation === queryGeneration.current && !isAbortError(queryError)) {
        setError(getErrorMessage(queryError));
        setStatus('Query failed');
      }
    } finally {
      globalThis.clearInterval(telemetryTimer);
      if (generation === queryGeneration.current) {
        setLoading(false);
        setTelemetry(source.getTelemetry());
      }
    }
  }, [catalog, minimumConfidence, viewState]);

  useEffect(() => {
    void runQuery();
    return () => {
      queryGeneration.current++;
      void activeSource.current?.close();
    };
  }, []); // Run once for the initial Boston viewport.

  const layers = useMemo(
    () =>
      resultBatches.map(
        batch =>
          new GeoArrowLayer({
            id: batch.id,
            data: batch.table,
            geometryColumn: 'geometry',
            pickable: true,
            autoHighlight: true,
            highlightColor: [255, 255, 255, 180],
            pointLayerProps: {
              getFillColor: [255, 111, 76, 205],
              getLineColor: [92, 24, 20, 220],
              getRadius: 4,
              radiusUnits: 'pixels',
              radiusMinPixels: 2,
              radiusMaxPixels: 8,
              lineWidthMinPixels: 1
            }
          })
      ),
    [resultBatches]
  );
  const widgets = useMemo(() => [new FullscreenWidget({id: 'overture-fullscreen'})], []);

  return (
    <div className="overture-example">
      <DeckGL
        controller={{type: MapController}}
        viewState={viewState}
        onViewStateChange={({viewState: nextViewState}) => setViewState(nextViewState as MapViewState)}
        layers={layers}
        widgets={widgets}
        getTooltip={getPlaceTooltip}
      >
        <Map reuseMaps mapLib={maplibregl as never} mapStyle={MAP_STYLE} />
      </DeckGL>

      {!props.hideChrome ? (
        <aside className="overture-panel">
          <a
            className="overture-brand"
            href="https://overturemaps.org/"
            target="_blank"
            rel="noreferrer"
          >
            <img
              src="https://overturemaps.org/wp-content/uploads/sites/16/2022/11/logo-vertical-white.svg"
              alt="Overture Maps Foundation"
            />
          </a>
          <div className="overture-eyebrow">STAC → ParquetDatasetSource → Arrow → deck.gl</div>
          <h1>Query 73 million Overture places from your browser</h1>
          <p className="overture-copy">
            Move the map, then query the viewport. The browser discovers the latest release,
            selects intersecting files, prunes row groups, requests Parquet byte ranges, and renders
            Arrow batches directly.
          </p>
          {props.children ? <div className="overture-doc-copy">{props.children}</div> : null}

          <label className="overture-control">
            <span>Minimum confidence</span>
            <strong>{minimumConfidence.toFixed(2)}</strong>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={minimumConfidence}
              onChange={event => setMinimumConfidence(Number(event.target.value))}
            />
          </label>

          <button type="button" onClick={() => void runQuery()} disabled={loading}>
            {loading ? <span className="overture-spinner" /> : null}
            {loading ? 'Querying…' : 'Query this viewport'}
          </button>

          <div className="overture-status">{status}</div>
          {error ? <div className="overture-error">{error}</div> : null}
          <TelemetryGrid telemetry={telemetry} resultBatches={resultBatches} summary={summary} />
          <div className="overture-note">
            Spatial filtering currently uses STAC file extents and nested GeoParquet bbox statistics
            for conservative candidates. Exact covering-column pushdown is the next framework
            tranche.
          </div>
        </aside>
      ) : null}
    </div>
  );
}

/** Builds a safe tooltip from a picked binary feature or its source Arrow row. */
export function getPlaceTooltip(info: PickingInfo): {html: string} | null {
  const properties = getPickedProperties(info);
  if (!properties) {
    return null;
  }
  const category = escapeHtml(String(properties.basic_category || 'Place'));
  const confidence = formatConfidence(properties.confidence);
  const identifier = escapeHtml(String(properties.id || 'unknown'));
  return {
    html: `<strong>${category}</strong><br/>Confidence ${confidence}<br/><small>${identifier}</small>`
  };
}

/** Resolves properties from binary GeoJSON or directly from the source Arrow table. */
function getPickedProperties(info: PickingInfo): Record<string, unknown> | null {
  const object = info.object as {properties?: Record<string, unknown>} | null;
  if (object?.properties) {
    return object.properties;
  }
  const table = info.layer?.props.data as ArrowTable | undefined;
  if (!table || info.index < 0 || typeof table.getChild !== 'function') {
    return null;
  }
  return {
    id: table.getChild('id')?.get(info.index),
    basic_category: table.getChild('basic_category')?.get(info.index),
    confidence: table.getChild('confidence')?.get(info.index)
  };
}

/** Mounts the standalone Vite example into a DOM container. */
export function renderToDOM(container = document.body): void {
  createRoot(container).render(<App />);
}

/** Compact query telemetry cards. */
function TelemetryGrid({
  telemetry,
  resultBatches,
  summary
}: {
  telemetry: ParquetDatasetTelemetry | null;
  resultBatches: ResultBatch[];
  summary: QuerySummary | null;
}) {
  const displayedRows = resultBatches.reduce((sum, batch) => sum + batch.rowCount, 0);
  const requestedBytes = telemetry?.parquet.requestedBytes || 0;
  const downloadedBytes = telemetry?.parquet.downloadedBytes || 0;
  const prunedRowGroups = telemetry?.parquet.rowGroupsPruned || 0;
  const requestedRowGroups = telemetry?.parquet.rowGroupsRequested || 0;
  return (
    <div className="overture-telemetry">
      <Metric label="Release" value={summary?.release || 'latest'} />
      <Metric label="Files" value={`${telemetry?.filesSelected || 0}/${telemetry?.filesDiscovered || 0}`} />
      <Metric label="Rows" value={formatInteger(displayedRows)} />
      <Metric label="Downloaded" value={formatBytes(downloadedBytes)} />
      <Metric label="Requested" value={formatBytes(requestedBytes)} />
      <Metric label="Ranges" value={formatInteger(telemetry?.parquet.rangeRequestCount || 0)} />
      <Metric label="Row groups pruned" value={`${prunedRowGroups}/${requestedRowGroups}`} />
      <Metric label="Elapsed" value={summary ? formatDuration(summary.durationMs) : '—'} />
    </div>
  );
}

/** One telemetry label/value pair. */
function Metric({label, value}: {label: string; value: string}) {
  return (
    <div className="overture-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

/** Converts the current deck.gl viewport to a west/south/east/north query box. */
function getViewBoundingBox(viewState: MapViewState): [number, number, number, number] {
  const viewport = new WebMercatorViewport({
    ...viewState,
    width: Math.max(globalThis.innerWidth || 1, 1),
    height: Math.max(globalThis.innerHeight || 1, 1)
  });
  const [west, south, east, north] = viewport.getBounds();
  return [west, south, east, north];
}

/** Conservatively tests nested Overture bbox statistics for one Parquet row group. */
export function canRowGroupIntersect(
  rowGroup: ParquetRowGroupMetadata,
  bbox: readonly [number, number, number, number]
): boolean {
  const [west, south, east, north] = bbox;
  const minimumX = getBoundingStatistic(rowGroup, 'xmin', 'min');
  const minimumY = getBoundingStatistic(rowGroup, 'ymin', 'min');
  const maximumX = getBoundingStatistic(rowGroup, 'xmax', 'max');
  const maximumY = getBoundingStatistic(rowGroup, 'ymax', 'max');
  return !(
    (minimumX !== undefined && minimumX > east) ||
    (maximumX !== undefined && maximumX < west) ||
    (minimumY !== undefined && minimumY > north) ||
    (maximumY !== undefined && maximumY < south)
  );
}

/** Reads one numeric min/max statistic from an Overture `bbox` leaf column. */
function getBoundingStatistic(
  rowGroup: ParquetRowGroupMetadata,
  leaf: string,
  bound: 'min' | 'max'
): number | undefined {
  const column = rowGroup.columns.find(
    candidate => candidate.path[0] === 'bbox' && candidate.path.at(-1) === leaf
  );
  const value = column?.statistics?.[bound];
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

/** Returns a human-readable error message. */
function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Detects expected cancellation failures. */
function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

/** Formats a compact integer for telemetry. */
function formatInteger(value: number): string {
  return new Intl.NumberFormat('en-US', {notation: 'compact', maximumFractionDigits: 1}).format(value);
}

/** Formats byte counts using binary units. */
function formatBytes(value: number): string {
  if (value < 1024) {
    return `${value} B`;
  }
  const units = ['KiB', 'MiB', 'GiB'];
  let amount = value / 1024;
  let unit = units[0];
  for (let index = 1; index < units.length && amount >= 1024; index++) {
    amount /= 1024;
    unit = units[index];
  }
  return `${amount.toFixed(amount >= 10 ? 1 : 2)} ${unit}`;
}

/** Formats milliseconds as a compact duration. */
function formatDuration(milliseconds: number): string {
  return milliseconds < 1000 ? `${Math.round(milliseconds)} ms` : `${(milliseconds / 1000).toFixed(1)} s`;
}

/** Formats a picked confidence value. */
function formatConfidence(value: unknown): string {
  return typeof value === 'number' ? value.toFixed(2) : 'unknown';
}

/** Escapes picked values before inserting them into tooltip HTML. */
function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, character => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    };
    return entities[character];
  });
}
