import React, {useEffect, useState} from 'react';
import type {Table as ArrowTable} from 'apache-arrow';
import type {ParquetPredicate} from '@loaders.gl/parquet';
import type {ScanQueryMetadata} from '@loaders.gl/scan';
import {ExampleUrlInputCard, type UrlOption} from 'examples/website/shared/url-input-card';
import {ScanQueryPanel, type ScanQueryPanelState} from './scan-query-panel';

import styles from './iceberg-scan-live-example.module.css';

type IcebergDemoState = {
  /** Current stage reached by the browser demo. */
  stage: 'loading' | 'planned' | 'scanned' | 'failed';
  /** Number of files selected by the Iceberg plan. */
  filesSelected: number;
  /** Number of Arrow rows emitted by the scan. */
  rowsScanned: number;
  /** Metadata version selected from the hosted table's version hint. */
  metadataVersion?: string;
  /** Error shown when the browser cannot complete the demo. */
  error?: string;
  /** Small preview of the first Arrow batch emitted by the hosted table. */
  preview?: IcebergTablePreview;
};

type IcebergTablePreview = {
  /** Projected Arrow field names shown in the preview. */
  columns: string[];
  /** First few values from the first emitted Arrow batch. */
  rows: string[][];
};

type IcebergExample = {
  /** Short description shown in the curated source list. */
  description: string;
  /** Predicate used by the example when this source is selected. */
  defaultAst: string;
  /** SQL representation of the default predicate. */
  defaultSql: string;
};

const DEFAULT_TABLE_URL = 'https://s3.amazonaws.com/hyperparam-iceberg/spark/bunnies';
const DEFAULT_PREDICATE_AST = '{"op":">=","args":[{"property":"Lifespan"},8]}';
const DEFAULT_SQL = 'SELECT * FROM bunnies WHERE Lifespan >= 8';
const ICEBERG_URL_OPTIONS: UrlOption<IcebergExample>[] = [
  {
    format: 'Iceberg',
    group: 'Examples',
    label: 'Hyperparam Bunnies',
    url: DEFAULT_TABLE_URL,
    example: {
      description: 'Small public table for browser scans.',
      defaultAst: DEFAULT_PREDICATE_AST,
      defaultSql: DEFAULT_SQL
    }
  },
  {
    format: 'Iceberg',
    group: 'Examples',
    label: 'CC0 Geospatial Points',
    url: 'https://raw.githubusercontent.com/visgl/loaders.gl/master/modules/parquet/data/iceberg/geospatial-points',
    example: {
      description: 'Synthetic CC0 points with latitude and longitude columns.',
      defaultAst: '{"op":">=","args":[{"property":"latitude"},0]}',
      defaultSql: 'SELECT * FROM points WHERE latitude >= 0'
    }
  }
];
const objectSizeCache = new Map<string, number>();

/** Runs the Iceberg metadata, manifest, and Parquet scan path in the browser. */
export function IcebergScanLiveExample(): JSX.Element {
  const [selectedTableUrl, setSelectedTableUrl] = useState(DEFAULT_TABLE_URL);
  const [astText, setAstText] = useState(DEFAULT_PREDICATE_AST);
  const [sqlText, setSqlText] = useState(DEFAULT_SQL);
  const [submittedAst, setSubmittedAst] = useState(DEFAULT_PREDICATE_AST);
  const [queryMetadata, setQueryMetadata] = useState<ScanQueryMetadata>();
  const [queryState, setQueryState] = useState<ScanQueryPanelState>({});
  const [submittedQueryState, setSubmittedQueryState] = useState<ScanQueryPanelState>({});
  const [state, setState] = useState<IcebergDemoState>({
    stage: 'loading',
    filesSelected: 0,
    rowsScanned: 0
  });

  useEffect(() => {
    let isMounted = true;

    const runDemo = async (): Promise<void> => {
      try {
        const {IcebergTableSource} = await import('@loaders.gl/parquet/iceberg-table-source');
        const {metadataUrl, metadataVersion} = await resolveIcebergMetadata(selectedTableUrl);
        const source = new IcebergTableSource(metadataUrl, {
          core: {loadOptions: {core: {fetch: fetchWithExposedContentRange}}, worker: false}
        });
        const metadata = await source.getQueryMetadata();
        if (isMounted) setQueryMetadata(metadata);
        const predicate = parsePredicateAst(submittedAst);
        const plan = await source.getScanPlan();
        if (isMounted) {
          setState({stage: 'planned', filesSelected: plan.dataFiles.length, rowsScanned: 0, metadataVersion});
        }
        let rowsScanned = 0;
        let preview: IcebergTablePreview | undefined;
        for await (const batch of source.scan({
          core: {worker: false},
          predicate,
          columns: submittedQueryState.columns,
          limit: submittedQueryState.limit
        })) {
          preview ||= createIcebergTablePreview(batch.data);
          rowsScanned += batch.length;
        }
        await source.close();
        if (isMounted) {
          setState({
            stage: 'scanned',
            filesSelected: plan.dataFiles.length,
            rowsScanned,
            metadataVersion,
            preview
          });
        }
      } catch (error) {
        if (isMounted) {
          setState({
            stage: 'failed',
            filesSelected: 0,
            rowsScanned: 0,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
    };

    runDemo();
    return () => {
      isMounted = false;
    };
  }, [selectedTableUrl, submittedAst, submittedQueryState]);

  return (
    <section className={styles.exampleFrame} aria-label="Live Iceberg scan example">
      <div className={styles.exampleHeader}>
        <div>
          <h3 className={styles.exampleTitle}>Iceberg snapshot → Arrow batches</h3>
          <p className={styles.exampleDescription}>
            A public Iceberg table is discovered in the browser, its snapshot and manifests are
            planned, and the selected Parquet data is emitted as Arrow batches.
          </p>
        </div>
        <span className={`${styles.stageBadge} ${state.stage === 'failed' ? styles.stageFailed : styles.stageReady}`}>
          {getStageLabel(state.stage)}
        </span>
      </div>
      <div className={styles.stageRow}>
        <div className={`${styles.stageBlock} ${state.stage !== 'loading' ? styles.stageActive : ''}`}>Metadata</div>
        <div className={styles.stageArrow}>→</div>
        <div className={`${styles.stageBlock} ${state.stage !== 'loading' ? styles.stageActive : ''}`}>Manifest plan</div>
        <div className={styles.stageArrow}>→</div>
        <div className={`${styles.stageBlock} ${state.stage === 'scanned' ? styles.stageActive : ''}`}>Parquet scan</div>
        <div className={styles.stageArrow}>→</div>
        <div className={`${styles.stageBlock} ${state.stage === 'scanned' ? styles.stageActive : ''}`}>Arrow batches</div>
      </div>
      <div className={styles.sourcePicker}>
        <div className={styles.sourcePickerLabel}>Iceberg table source</div>
        <ExampleUrlInputCard<IcebergExample>
          format="Iceberg"
          storageKey="iceberg-tables"
          selectedUrl={selectedTableUrl}
          urlOptions={ICEBERG_URL_OPTIONS}
          onExampleSelect={urlOption => {
            setSelectedTableUrl(urlOption.url);
            if (urlOption.example) {
              setAstText(urlOption.example.defaultAst);
              setSqlText(urlOption.example.defaultSql);
              setSubmittedAst(urlOption.example.defaultAst);
            }
          }}
          onUrlChange={url => setSelectedTableUrl(url)}
        />
        <div className={styles.sourceHint}>Choose a curated public table or load a table root or metadata JSON URL.</div>
      </div>
      <form className={styles.queryForm}
        onSubmit={event => {
          event.preventDefault();
          setSubmittedAst(astText);
        }}
      >
        <div className={styles.queryEditors}>
          <div className={styles.queryEditor}>
            <label className={styles.queryInputLabel} htmlFor="iceberg-sql">SQL</label>
            <textarea className={styles.queryInput}
              id="iceberg-sql"
              value={sqlText}
              onChange={event => {
                const nextSql = event.target.value;
                setSqlText(nextSql);
                try {
                  setAstText(JSON.stringify(parsePredicateSql(nextSql)));
                } catch {
                  // Keep the in-progress SQL visible until it becomes valid again.
                }
              }}
              aria-label="Editable Iceberg SQL query"
            />
          </div>
          <div className={styles.queryEditor}>
            <label className={styles.queryInputLabel} htmlFor="iceberg-query">Predicate AST</label>
            <textarea className={styles.queryInput}
              id="iceberg-query"
              value={astText}
              onChange={event => {
                const nextAst = event.target.value;
                setAstText(nextAst);
                try {
                  setSqlText(formatPredicateSql(parsePredicateAst(nextAst)));
                } catch {
                  // Keep the in-progress AST visible until it becomes valid again.
                }
              }}
              aria-label="Editable Iceberg predicate AST"
            />
          </div>
        </div>
        <button className={styles.queryButton} type="submit">Run</button>
        <div className={styles.queryHint}>
          Edit either view and the other stays synchronized. Supported SQL is SELECT * FROM table
          WHERE column operator value; Run applies the predicate to Iceberg and Parquet.
        </div>
      </form>
      <ScanQueryPanel
        metadata={queryMetadata}
        loading={state.stage === 'loading' && !queryMetadata}
        value={queryState}
        onApply={nextQuery => {
          setQueryState(nextQuery);
          setSubmittedQueryState(nextQuery);
        }}
        title="Iceberg scan parameters"
      />
      {state.stage === 'failed' ? (
        <div className={styles.errorMessage}>{state.error}</div>
      ) : (
        <>
          <div className={styles.planPanel}>
            <div className={styles.planHeader}>
              <strong>Query plan</strong>
              <span>Iceberg snapshot → Parquet → Arrow</span>
            </div>
            <div className={styles.planStats}>
              <div className={styles.metric}>
                <div className={styles.metricValue}>{state.filesSelected}</div>
                <div className={styles.metricLabel}>files</div>
              </div>
              <div className={styles.metric}>
                <div className={styles.metricValue}>{state.rowsScanned || '—'}</div>
                <div className={styles.metricLabel}>rows</div>
              </div>
              <div className={styles.metric}>
                <div className={styles.metricValue}>{state.metadataVersion ? `v${state.metadataVersion}` : '—'}</div>
                <div className={styles.metricLabel}>metadata</div>
              </div>
            </div>
          </div>
          {state.preview ? <DataPreview preview={state.preview} /> : null}
        </>
      )}
    </section>
  );
}

/** Renders the first Arrow rows as a compact table without materializing the full scan. */
function DataPreview({preview}: {preview: IcebergTablePreview}): JSX.Element {
  return (
    <div className={styles.previewFrame}>
      <div className={styles.previewHeading}>
        <strong>Loaded table data</strong>
        <span>first {preview.rows.length} rows from Arrow</span>
      </div>
      <div className={styles.previewScroll}>
        <table className={styles.previewTable}>
          <thead>
            <tr>
              {preview.columns.map(column => <th key={column}>{column}</th>)}
            </tr>
          </thead>
          <tbody>
            {preview.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((value, columnIndex) => <td key={`${rowIndex}-${columnIndex}`}>{value}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Extracts a bounded, display-safe preview from one Arrow table batch. */
function createIcebergTablePreview(table: ArrowTable): IcebergTablePreview {
  const columns = table.schema.fields.map(field => field.name);
  const rows: string[][] = [];
  const rowCount = Math.min(table.numRows, 6);
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    rows.push(columns.map(column => formatPreviewValue(table.getChild(column)?.get(rowIndex))));
  }
  return {columns, rows};
}

/** Formats Arrow scalar values without expanding binary geometry or nested objects excessively. */
function formatPreviewValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (value instanceof Uint8Array) return `<${value.byteLength} bytes>`;
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function getStageLabel(stage: IcebergDemoState['stage']): string {
  switch (stage) {
    case 'loading':
      return 'Running';
    case 'planned':
      return 'Plan ready';
    case 'scanned':
      return 'Complete';
    case 'failed':
      return 'Unavailable';
  }
}

/** Resolves an Iceberg table root or direct metadata JSON URL to scan metadata. */
async function resolveIcebergMetadata(
  tableUrl: string
): Promise<{metadataUrl: string; metadataVersion?: string}> {
  const normalizedUrl = tableUrl.trim().replace(/\/$/, '');
  if (/\.metadata\.json(?:\?.*)?$/i.test(normalizedUrl)) {
    return {metadataUrl: normalizedUrl};
  }
  const versionResponse = await fetch(`${normalizedUrl}/metadata/version-hint.text`);
  if (!versionResponse.ok) {
    throw new Error(`Iceberg version hint failed: ${versionResponse.status}`);
  }
  const metadataVersion = (await versionResponse.text()).trim();
  if (!/^\d+$/.test(metadataVersion)) {
    throw new Error('Iceberg version hint did not contain a numeric metadata version');
  }
  return {
    metadataUrl: `${normalizedUrl}/metadata/v${Number(metadataVersion)}.metadata.json`,
    metadataVersion
  };
}

/** Parses the editable predicate AST and rejects malformed input before a scan begins. */
function parsePredicateAst(query: string): ParquetPredicate {
  let value: unknown;
  try {
    value = JSON.parse(query);
  } catch {
    throw new Error('Predicate AST must be valid JSON');
  }
  if (!value || typeof value !== 'object' || typeof (value as {op?: unknown}).op !== 'string') {
    throw new Error('Predicate AST must contain an operation, for example {"op":">=",...}');
  }
  return value as ParquetPredicate;
}

/** Parses the small comparison-only SQL form used by the browser example. */
function parsePredicateSql(query: string): ParquetPredicate {
  const match = query.match(
    /^\s*select\s+\*\s+from\s+[a-zA-Z_][\w.-]*\s+where\s+([a-zA-Z_][\w.]*)\s*(>=|<=|=|>|<)\s*(?:'([^']*)'|"([^"]*)"|(-?\d+(?:\.\d+)?))\s*$/i
  );
  if (!match) {
    throw new Error('SQL must look like SELECT * FROM bunnies WHERE Lifespan >= 8');
  }
  const value = match[3] ?? match[4] ?? Number(match[5]);
  return {op: match[2], args: [{property: match[1]}, value]} as ParquetPredicate;
}

/** Formats a comparison predicate as the SQL form accepted by this example. */
function formatPredicateSql(predicate: ParquetPredicate): string {
  const comparison = predicate as {op?: unknown; args?: unknown};
  if (
    typeof comparison.op !== 'string' ||
    !Array.isArray(comparison.args) ||
    comparison.args.length !== 2 ||
    !comparison.args[0] ||
    typeof comparison.args[0] !== 'object' ||
    typeof (comparison.args[0] as {property?: unknown}).property !== 'string'
  ) {
    throw new Error('Only comparison predicates can be shown as SQL');
  }
  const value = comparison.args[1];
  if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
    throw new Error('Only scalar comparison values can be shown as SQL');
  }
  const formattedValue =
    typeof value === 'string' ? `'${value.replaceAll("'", "''")}'` : String(value);
  return `SELECT * FROM bunnies WHERE ${(comparison.args[0] as {property: string}).property} ${comparison.op} ${formattedValue}`;
}

/**
 * Adds the range metadata hidden by the public S3 CORS policy so the strict Parquet range reader
 * can still validate hosted-object reads in the browser.
 */
async function fetchWithExposedContentRange(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const response = await fetch(url, options);
  const range = options?.headers && new Headers(options.headers).get('Range');
  if (response.status !== 206 || response.headers.get('Content-Range') || !range) return response;
  const match = range.match(/^bytes=(\d+)-(\d+)$/);
  if (!match) return response;
  let objectSize = objectSizeCache.get(url);
  if (objectSize === undefined) {
    const headResponse = await fetch(url, {method: 'HEAD'});
    const contentLength = headResponse.headers.get('Content-Length');
    if (!headResponse.ok || !contentLength) return response;
    objectSize = Number(contentLength);
    objectSizeCache.set(url, objectSize);
  }
  const headers = new Headers(response.headers);
  headers.set('Content-Range', `bytes ${match[1]}-${match[2]}/${objectSize}`);
  return new Response(await response.arrayBuffer(), {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
