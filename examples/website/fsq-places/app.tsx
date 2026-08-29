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
import type {ParquetPredicate} from '@loaders.gl/parquet';
import type {Table as ArrowTable} from 'apache-arrow';
import maplibregl from 'maplibre-gl';
import {Map} from 'react-map-gl';

import {
  FsqPlacesCatalogProvider,
  type FsqPlacesCatalogSummary
} from './fsq-places-catalog';
import './style.css';
import 'maplibre-gl/dist/maplibre-gl.css';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const PARQUET_SOURCE_WORKER_URL = new URL(
  '../../../modules/parquet/dist/parquet-source-worker.js',
  import.meta.url
).toString();
const MAX_RESULT_ROWS = 100_000;
const INITIAL_VIEW_STATE: MapViewState = {
  longitude: -71.064,
  latitude: 42.357,
  zoom: 12.2,
  minZoom: 9,
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
  /** Geographic query bounds. */
  bbox: [number, number, number, number];
  /** Elapsed query duration, including catalog discovery. */
  durationMs: number;
  /** Whether the display limit ended iteration early. */
  limited: boolean;
};

/** Browser-native FSQ Places aggregate-metadata and GeoParquet range-query example. */
export default function App(props: AppProps = {}) {
  const catalog = useMemo(() => new FsqPlacesCatalogProvider(), []);
  const activeSource = useRef<ParquetDatasetSource | null>(null);
  const queryGeneration = useRef(0);
  const [viewState, setViewState] = useState<MapViewState>(INITIAL_VIEW_STATE);
  const [resultBatches, setResultBatches] = useState<ResultBatch[]>([]);
  const [catalogSummary, setCatalogSummary] = useState<FsqPlacesCatalogSummary | null>(null);
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
    setStatus('Reading Fused aggregate Parquet metadata from Source Cooperative…');
    const startTime = performance.now();
    let rowCount = 0;
    let limited = false;
    const telemetryTimer = globalThis.setInterval(
      () => setTelemetry(source.getTelemetry()),
      150
    );

    try {
      const nextCatalogSummary = await catalog.getSummary();
      if (generation !== queryGeneration.current) {
        return;
      }
      setCatalogSummary(nextCatalogSummary);
      setStatus(
        `Pruning ${formatInteger(nextCatalogSummary.rowCount)} FSQ places by viewport…`
      );
      let batchIndex = 0;
      for await (const batch of source.read({
        bbox,
        columns: [
          'fsq_place_id',
          'name',
          'geometry',
          'fsq_category_labels',
          'latitude',
          'longitude'
        ],
        predicate: createBoundingBoxPredicate(bbox),
        batchSize: 12_500,
        concurrency: 2,
        fileConcurrency: 2
      })) {
        if (generation !== queryGeneration.current) {
          return;
        }
        const nextBatch: ResultBatch = {
          id: `fsq-${batch.datasetFileIndex}-${batch.rowGroupIndex}-${batchIndex++}`,
          table: batch.data,
          rowCount: batch.length
        };
        rowCount += batch.length;
        setResultBatches(current => [...current, nextBatch]);
        setTelemetry(source.getTelemetry());
        setStatus(`Streaming ${formatInteger(rowCount)} exact viewport matches into Arrow layers…`);
        if (rowCount >= MAX_RESULT_ROWS) {
          limited = true;
          break;
        }
      }
      if (generation === queryGeneration.current) {
        setTelemetry(source.getTelemetry());
        setSummary({bbox, durationMs: performance.now() - startTime, limited});
        setStatus(
          limited
            ? `Stopped at the ${formatInteger(MAX_RESULT_ROWS)}-row display limit`
            : `Rendered ${formatInteger(rowCount)} FSQ places in the viewport`
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
  }, [catalog, viewState]);

  useEffect(() => {
    void runQuery();
    return () => {
      queryGeneration.current++;
      void activeSource.current?.close();
    };
  }, []);

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
            highlightColor: [255, 255, 255, 190],
            pointLayerProps: {
              getFillColor: [46, 217, 195, 210],
              getLineColor: [2, 43, 79, 235],
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
  const widgets = useMemo(() => [new FullscreenWidget({id: 'fsq-fullscreen'})], []);

  return (
    <div className="fsq-example">
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
        <aside className="fsq-panel">
          <a
            className="fsq-brand"
            href="https://opensource.foursquare.com/"
            target="_blank"
            rel="noreferrer"
          >
            <img
              src="https://opensource.foursquare.com/wp-content/uploads/sites/5/2024/11/header_new_logo.svg"
              alt="Foursquare"
            />
            <span>Places</span>
          </a>
          <div className="fsq-eyebrow">_metadata → ParquetDatasetSource → Arrow → deck.gl</div>
          <h1>Query 104 million FSQ places from your browser</h1>
          <p className="fsq-copy">
            Move the map, then query the viewport. Aggregate Parquet metadata discovers spatially
            partitioned files; the browser prunes files and row groups, fetches selected byte
            ranges, applies an exact coordinate predicate, and renders Arrow batches directly.
          </p>
          {props.children ? <div className="fsq-doc-copy">{props.children}</div> : null}

          <button type="button" onClick={() => void runQuery()} disabled={loading}>
            {loading ? <span className="fsq-spinner" /> : null}
            {loading ? 'Querying…' : 'Query this viewport'}
          </button>

          <div className="fsq-status">{status}</div>
          {error ? <div className="fsq-error">{error}</div> : null}
          <TelemetryGrid
            catalogSummary={catalogSummary}
            telemetry={telemetry}
            resultBatches={resultBatches}
            summary={summary}
          />
          <div className="fsq-credit">
            <strong>Open data and open infrastructure</strong>
            <div className="fsq-partners">
              <a href="https://www.fused.io/" target="_blank" rel="noreferrer">
                <img
                  className="fsq-fused-logo"
                  src="https://raw.githubusercontent.com/OvertureMaps/landscape/main/hosted_logos/fused.svg"
                  alt="Fused"
                />
              </a>
              <a
                href="https://source.coop/"
                target="_blank"
                rel="noreferrer"
              >
                <img
                  src="https://source.coop/logo/logolockup-light.svg"
                  alt="Source Cooperative"
                />
              </a>
            </div>
            <span>
              FSQ Open Source Places is Apache 2.0 data from Foursquare. This browser-readable,
              spatially partitioned {catalogSummary?.release || '2024-11-19'} snapshot was created
              by <a href="https://www.fused.io/">Fused</a> and is generously hosted by{' '}
              <a href="https://source.coop/fused/fsq-os-places">Source Cooperative</a>.
            </span>
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
  const name = escapeHtml(String(properties.name || 'FSQ place'));
  const category = escapeHtml(formatCategory(properties.fsq_category_labels));
  const identifier = escapeHtml(String(properties.fsq_place_id || 'unknown'));
  return {html: `<strong>${name}</strong><br/>${category}<br/><small>${identifier}</small>`};
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
    fsq_place_id: table.getChild('fsq_place_id')?.get(info.index),
    name: table.getChild('name')?.get(info.index),
    fsq_category_labels: table.getChild('fsq_category_labels')?.get(info.index)
  };
}

/** Mounts the standalone Vite example into a DOM container. */
export function renderToDOM(container = document.body): void {
  createRoot(container).render(<App />);
}

/** Compact catalog and query telemetry cards. */
function TelemetryGrid({
  catalogSummary,
  telemetry,
  resultBatches,
  summary
}: {
  catalogSummary: FsqPlacesCatalogSummary | null;
  telemetry: ParquetDatasetTelemetry | null;
  resultBatches: ResultBatch[];
  summary: QuerySummary | null;
}) {
  const displayedRows = resultBatches.reduce((sum, batch) => sum + batch.rowCount, 0);
  const catalogBytes = catalogSummary?.telemetry.downloadedBytes || 0;
  const dataBytes = telemetry?.parquet.downloadedBytes || 0;
  return (
    <div className="fsq-telemetry">
      <Metric label="Release" value={catalogSummary?.release || 'loading'} />
      <Metric label="Files" value={`${telemetry?.filesSelected || 0}/${telemetry?.filesDiscovered || 0}`} />
      <Metric label="Rows" value={formatInteger(displayedRows)} />
      <Metric label="Catalog" value={formatBytes(catalogBytes)} />
      <Metric label="Data" value={formatBytes(dataBytes)} />
      <Metric label="Ranges" value={formatInteger(telemetry?.parquet.rangeRequestCount || 0)} />
      <Metric
        label="Row groups pruned"
        value={`${telemetry?.parquet.rowGroupsPruned || 0}/${telemetry?.parquet.rowGroupsRequested || 0}`}
      />
      <Metric label="Elapsed" value={summary ? formatDuration(summary.durationMs) : '—'} />
    </div>
  );
}

/** One telemetry label/value pair. */
function Metric({label, value}: {label: string; value: string}) {
  return (
    <div className="fsq-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

/** Creates an exact, statistics-prunable point predicate for a viewport. */
function createBoundingBoxPredicate(
  bbox: readonly [number, number, number, number]
): ParquetPredicate {
  const [west, south, east, north] = bbox;
  return {
    op: 'and',
    args: [
      {op: '>=', args: [{property: 'longitude'}, west]},
      {op: '<=', args: [{property: 'longitude'}, east]},
      {op: '>=', args: [{property: 'latitude'}, south]},
      {op: '<=', args: [{property: 'latitude'}, north]}
    ]
  };
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

/** Returns a human-readable error message. */
function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Detects expected cancellation failures. */
function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

/** Formats one FSQ category label from Arrow list or scalar output. */
function formatCategory(value: unknown): string {
  return getFirstCategoryLabel(value) || 'Uncategorized';
}

/** Recursively unwraps Arrow list/struct values to the first category string. */
function getFirstCategoryLabel(value: unknown): string | null {
  if (typeof value === 'string') {
    return value;
  }
  if (!value || typeof value !== 'object') {
    return null;
  }
  const record = value as Record<string, unknown>;
  for (const propertyName of ['element', 'list']) {
    const label = getFirstCategoryLabel(record[propertyName]);
    if (label) {
      return label;
    }
  }
  if (typeof record.toJSON === 'function') {
    const jsonValue = (record.toJSON as () => unknown)();
    if (jsonValue !== value) {
      const label = getFirstCategoryLabel(jsonValue);
      if (label) {
        return label;
      }
    }
  }
  if (typeof (value as Iterable<unknown>)[Symbol.iterator] === 'function') {
    for (const child of value as Iterable<unknown>) {
      if (Array.isArray(child) && (child[0] === 'list' || child[0] === 'element')) {
        const label = getFirstCategoryLabel(child[1]);
        if (label) {
          return label;
        }
        continue;
      }
      const label = getFirstCategoryLabel(child);
      if (label) {
        return label;
      }
    }
  }
  return null;
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
  return milliseconds < 1000
    ? `${Math.round(milliseconds)} ms`
    : `${(milliseconds / 1000).toFixed(1)} s`;
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
