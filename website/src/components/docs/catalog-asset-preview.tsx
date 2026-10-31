import {readCatalogTextStream} from './catalog-text-stream';
import {isCatalogRangeUnsupportedError} from './catalog-range-error';
import React, {useEffect, useId, useMemo, useRef, useState} from 'react';
import {ArrowSchemaPanel, ArrowTablePanel, TextEditorPanel} from '@deck.gl-community/panels';
import type {Table} from 'apache-arrow';
import {ExamplePanelHost} from './example-panel-host';
import {configurePanelEditorWorkers} from './panel-editor-workers';
import {getCatalogAssetUrl} from './catalog-asset-url';
import {getCatalogPreviewSchema, getCatalogPreviewMetadata} from './catalog-preview-schema';
import {CatalogJsonTree} from './catalog-json-tree';
import {CatalogDeckPreview} from './catalog-deck-preview';

/** An asset selected from a catalog record. */
export type CatalogPreviewAsset = {
  /** Asset name within its Item. */
  key: string;
  /** Resolved download URL. */
  href: string;
};

/** Materialized, bounded content for the asset preview. */
type AssetPreview = {
  /** Text or formatted JSON content. */
  text?: string;
  /** Validation schema for complete recognized JSON documents. */
  jsonSchema?: Record<string, unknown>;
  /** Human-readable name of the active validation schema. */
  schemaTitle?: string;
  /** Raw Arrow table retaining schema, metadata, and typed column vectors. */
  table?: Table;
  /** Language mode selected from the decoded text content. */
  language?: 'json' | 'plaintext';
  /** Total row count declared in the Parquet footer. */
  rowCount?: number;
  /** Dataset extent from GeoParquet metadata, when present. */
  bounds?: number[];
  /** Whether the text preview reached its byte limit. */
  truncated?: boolean;
  /** Indicates a size-limited download was needed because range reads were unavailable. */
  downloaded?: boolean;
};

/** Displays text assets and a bounded Arrow table decoded from Parquet. */
export function CatalogAssetPreview({
  asset,
  autoScroll = true
}: {
  /** Current asset; changing it cancels the previous read. */
  asset: CatalogPreviewAsset;
  /** Scrolls the page to standalone previews; disable inside a bounded inspector. */
  autoScroll?: boolean;
}): React.JSX.Element {
  const assetUrl = getCatalogAssetUrl(asset.href);
  const [selectedTab, setSelectedTab] = useState<'table' | 'schema' | 'map'>('table');
  const [preview, setPreview] = useState<AssetPreview>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const panel = useRef<HTMLElement>(null);
  const panelId = useId();
  const contentPanel = useMemo(() => {
    if (preview?.text !== undefined) {
      configurePanelEditorWorkers();
      return new TextEditorPanel({
        id: `${panelId}-text`,
        title: 'Text',
        value: preview.text,
        language: preview.language,
        readOnly: true,
        jsonSchema: preview.jsonSchema
      });
    }
    if (preview?.table) {
      return selectedTab === 'table'
        ? new ArrowTablePanel({
            id: `${panelId}-table`,
            title: 'Table',
            table: preview.table,
            maxRows: 50,
            maxColumns: 12
          })
        : selectedTab === 'schema' ? new ArrowSchemaPanel({
            id: `${panelId}-schema`,
            title: 'Fields',
            schema: getCatalogPreviewSchema(preview.table.schema)
          }) : undefined;
    }
    return undefined;
  }, [panelId, preview, selectedTab]);

  useEffect(() => {
    const abortController = new AbortController();
    if (autoScroll) panel.current?.scrollIntoView({block: 'start', behavior: 'smooth'});
    setPreview(undefined);
    setError(undefined);
    setLoading(true);
    void (async () => {
      try {
        if (!assetUrl) throw new Error('Only HTTP(S) asset URLs can be previewed.');
        const content = /\.parquet$/i.test(assetUrl.pathname)
          ? await readParquetPreview(assetUrl.href, abortController.signal)
          : await readTextPreview(assetUrl.href, abortController.signal);
        if (!abortController.signal.aborted) setPreview(content);
      } catch (readError) {
        if (!abortController.signal.aborted) setError(String(readError));
      } finally {
        if (!abortController.signal.aborted) setLoading(false);
      }
    })();
    return () => abortController.abort();
  }, [asset.href]);

  return (
    <section ref={panel} aria-label="Asset preview">
      <h3>Asset preview: {asset.key}</h3>
      {assetUrl ? (
        <a href={assetUrl.href} target="_blank" rel="noreferrer">
          Open original asset
        </a>
      ) : null}
      {loading ? <p role="status">Loading asset preview…</p> : null}
      {error ? <p role="alert">{error}</p> : null}
      {preview?.schemaTitle ? <p>Validation: {preview.schemaTitle}</p> : null}
      {preview?.truncated ? <p>Showing the first 256 KiB.</p> : null}
      {preview?.table ? (
        <p>
          Showing {preview.table.numRows} of {preview.rowCount?.toLocaleString()} rows, first{' '}
          {preview.table.numCols} columns.
        </p>
      ) : null}
      {preview?.downloaded ? (
        <p>Range reads were unavailable; preview downloaded this file (maximum 16 MiB).</p>
      ) : null}
      {preview?.table ? (
        <div role="group" aria-label="Arrow preview view" style={{display: 'flex', gap: 8}}>
          <button
            type="button"
            aria-pressed={selectedTab === 'table'}
            onClick={() => setSelectedTab('table')}
          >
            Table
          </button>
          <button type="button" aria-pressed={selectedTab === 'map'} onClick={() => setSelectedTab('map')}>
            Map
          </button>
          <button
            type="button"
            aria-pressed={selectedTab === 'schema'}
            onClick={() => setSelectedTab('schema')}
          >
            Schema
          </button>
        </div>
      ) : null}
      {contentPanel ? <ExamplePanelHost panel={contentPanel} /> : null}
      {preview?.table && selectedTab === 'map' ? <CatalogDeckPreview table={preview.table} bounds={preview.bounds} /> : null}
      {preview?.table && selectedTab === 'schema' ? (
        <div key={asset.href}>
          <CatalogJsonTree
            label="Schema metadata"
            value={getCatalogPreviewMetadata(preview.table.schema.metadata)}
          />
          <CatalogJsonTree
            label="Field metadata"
            value={Object.fromEntries(
              preview.table.schema.fields.map(field => [
                field.name,
                getCatalogPreviewMetadata(field.metadata)
              ])
            )}
          />
          <p>Encoded ARROW:schema metadata is omitted; decoded fields are shown above.</p>
        </div>
      ) : null}
    </section>
  );
}

/** Reads selected columns and the first fifty rows without downloading the whole file. */
async function readParquetPreview(url: string, signal: AbortSignal): Promise<AssetPreview> {
  try {
    return await readParquetTable(url, signal);
  } catch (error) {
    signal.throwIfAborted();
    if (!isCatalogRangeUnsupportedError(error)) throw error;
    const response = await fetch(url, {signal});
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');
    const chunks: Uint8Array<ArrayBuffer>[] = [];
    let byteCount = 0;
    try {
      while (true) {
        const {done, value} = await reader.read();
        if (done) break;
        byteCount += value.byteLength;
        if (byteCount > 16 * 1024 * 1024)
          throw new Error(
            'Range reads unavailable and asset exceeds the 16 MiB preview download limit. Use Open original asset.'
          );
        chunks.push(value);
      }
    } finally {
      await reader.cancel();
    }
    return {...(await readParquetTable(new Blob(chunks), signal)), downloaded: true};
  }
}

/** Decodes a bounded Arrow preview from a URL or an already downloaded Blob. */
async function readParquetTable(data: string | Blob, signal: AbortSignal): Promise<AssetPreview> {
  const {ParquetSource} = await import('@loaders.gl/tables/parquet-source-loader');
  signal.throwIfAborted();
  const source = new ParquetSource(data, {core: {worker: false}});
  try {
    const metadata = await source.getMetadata({signal});
    const columnNames = metadata.schema.fields.slice(0, 12).map(field => field.name);
    const {getGeometryColumnsFromSchema} = await import('@loaders.gl/core/geoarrow');
    const geometryColumn = Object.keys(getGeometryColumnsFromSchema(metadata.schema))[0];
    if (geometryColumn && !columnNames.includes(geometryColumn)) columnNames.push(geometryColumn);
    const preview: AssetPreview = {rowCount: metadata.rowCount};
    try {
      const geo = JSON.parse(metadata.keyValueMetadata.geo || '{}');
      const bounds = geo.columns?.[geo.primary_column]?.bbox;
      if (Array.isArray(bounds) && bounds.length === 4 && bounds.every(Number.isFinite)) preview.bounds = bounds;
    } catch {
      // Extent metadata is optional.
    }
    for await (const batch of source.read({
      columns: columnNames,
      limit: 50,
      batchSize: 50,
      concurrency: 1,
      signal
    })) {
      preview.table = preview.table ? preview.table.concat(batch.data) : batch.data;
    }
    return preview;
  } finally {
    await source.close();
  }
}

/** Reads at most 256 KiB of a text asset and formats complete JSON documents. */
async function readTextPreview(url: string, signal: AbortSignal): Promise<AssetPreview> {
  const response = await fetch(url, {signal});
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const mediaType = response.headers.get('content-type') || '';
  if (
    !/json|text|xml|yaml|javascript/i.test(mediaType) &&
    !/\.(json|txt|md|csv|xml|ya?ml|dat)$/i.test(new URL(url).pathname)
  ) {
    await response.body?.cancel();
    throw new Error('This asset does not have a text or Parquet preview. Use Open original asset.');
  }
  if (!response.body) throw new Error('No response body');
  const textPreview = await readCatalogTextStream(response.body);
  let text = textPreview.text;
  const truncated = textPreview.truncated;
  let language: AssetPreview['language'] = /\.json$/i.test(new URL(url).pathname)
    ? 'json'
    : 'plaintext';
  let selectedSchema;
  if (!truncated) {
    try {
      const document = JSON.parse(text);
      text = JSON.stringify(document, null, 2);
      language = 'json';
      const {getCatalogEditorSchema} = await import('./catalog-editor-schemas');
      selectedSchema = getCatalogEditorSchema(document, url);
    } catch {
      /* Preserve non-JSON text. */
    }
  }
  return {
    text,
    truncated,
    language,
    jsonSchema: selectedSchema?.jsonSchema,
    schemaTitle: selectedSchema?.title
  };
}
