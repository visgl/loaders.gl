import React, {useEffect, useState} from 'react';
import styled from 'styled-components';
import type {Table as ArrowTable} from 'apache-arrow';
import type {ParquetPredicate} from '@loaders.gl/parquet';
import {ExampleUrlInputCard, type UrlOption} from 'examples/website/shared/url-input-card';

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
        const predicate = parsePredicateAst(submittedAst);
        const plan = await source.getScanPlan();
        if (isMounted) {
          setState({stage: 'planned', filesSelected: plan.dataFiles.length, rowsScanned: 0, metadataVersion});
        }
        let rowsScanned = 0;
        let preview: IcebergTablePreview | undefined;
        for await (const batch of source.scan({
          core: {worker: false},
          predicate
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
  }, [selectedTableUrl, submittedAst]);

  return (
    <ExampleFrame aria-label="Live Iceberg scan example">
      <ExampleHeader>
        <div>
          <ExampleTitle>Iceberg snapshot → Arrow batches</ExampleTitle>
          <ExampleDescription>
            A public Iceberg table is discovered in the browser, its snapshot and manifests are
            planned, and the selected Parquet data is emitted as Arrow batches.
          </ExampleDescription>
        </div>
        <StageBadge $stage={state.stage}>{getStageLabel(state.stage)}</StageBadge>
      </ExampleHeader>
      <StageRow>
        <StageBlock $active={state.stage !== 'loading'}>Metadata</StageBlock>
        <StageArrow>→</StageArrow>
        <StageBlock $active={state.stage !== 'loading'}>Manifest plan</StageBlock>
        <StageArrow>→</StageArrow>
        <StageBlock $active={state.stage === 'scanned'}>Parquet scan</StageBlock>
        <StageArrow>→</StageArrow>
        <StageBlock $active={state.stage === 'scanned'}>Arrow batches</StageBlock>
      </StageRow>
      <SourcePicker>
        <SourcePickerLabel>Iceberg table source</SourcePickerLabel>
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
        <SourceHint>Choose a curated public table or load a table root or metadata JSON URL.</SourceHint>
      </SourcePicker>
      <QueryForm
        onSubmit={event => {
          event.preventDefault();
          setSubmittedAst(astText);
        }}
      >
        <QueryEditors>
          <QueryEditor>
            <QueryInputLabel htmlFor="iceberg-sql">SQL</QueryInputLabel>
            <QueryInput
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
          </QueryEditor>
          <QueryEditor>
            <QueryInputLabel htmlFor="iceberg-query">Predicate AST</QueryInputLabel>
            <QueryInput
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
          </QueryEditor>
        </QueryEditors>
        <QueryButton type="submit">Run</QueryButton>
        <QueryHint>
          Edit either view and the other stays synchronized. Supported SQL is SELECT * FROM table
          WHERE column operator value; Run applies the predicate to Iceberg and Parquet.
        </QueryHint>
      </QueryForm>
      {state.stage === 'failed' ? (
        <ErrorMessage>{state.error}</ErrorMessage>
      ) : (
        <>
          <PlanPanel>
            <PlanHeader>
              <strong>Query plan</strong>
              <span>Iceberg snapshot → Parquet → Arrow</span>
            </PlanHeader>
            <PlanStats>
              <Metric>
                <MetricValue>{state.filesSelected}</MetricValue>
                <MetricLabel>files</MetricLabel>
              </Metric>
              <Metric>
                <MetricValue>{state.rowsScanned || '—'}</MetricValue>
                <MetricLabel>rows</MetricLabel>
              </Metric>
              <Metric>
                <MetricValue>{state.metadataVersion ? `v${state.metadataVersion}` : '—'}</MetricValue>
                <MetricLabel>metadata</MetricLabel>
              </Metric>
            </PlanStats>
          </PlanPanel>
          {state.preview ? <DataPreview preview={state.preview} /> : null}
        </>
      )}
    </ExampleFrame>
  );
}

/** Renders the first Arrow rows as a compact table without materializing the full scan. */
function DataPreview({preview}: {preview: IcebergTablePreview}): JSX.Element {
  return (
    <PreviewFrame>
      <PreviewHeading>
        <strong>Loaded table data</strong>
        <span>first {preview.rows.length} rows from Arrow</span>
      </PreviewHeading>
      <PreviewScroll>
        <PreviewTable>
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
        </PreviewTable>
      </PreviewScroll>
    </PreviewFrame>
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

const ExampleFrame = styled.div`
  border: 1px solid var(--ifm-color-gray-400);
  border-radius: 8px;
  margin: 28px 0;
  padding: 18px;
`;

const ExampleHeader = styled.div`
  align-items: start;
  display: flex;
  gap: 16px;
  justify-content: space-between;
`;

const ExampleTitle = styled.h3`
  font-size: 18px;
  margin: 0;
`;

const ExampleDescription = styled.p`
  color: var(--ifm-color-gray-700);
  font-size: 13px;
  margin: 6px 0 0;
  max-width: 720px;
`;

const StageBadge = styled.div<{$stage: IcebergDemoState['stage']}>`
  background: ${props => (props.$stage === 'failed' ? 'rgba(211, 47, 47, 0.1)' : 'rgba(76, 175, 80, 0.12)')};
  border: 1px solid ${props => (props.$stage === 'failed' ? 'rgba(211, 47, 47, 0.45)' : 'rgba(76, 175, 80, 0.55)')};
  border-radius: 999px;
  color: var(--ifm-color-gray-900);
  font-size: 12px;
  font-weight: 800;
  padding: 7px 10px;
  white-space: nowrap;
`;

const StageRow = styled.div`
  align-items: center;
  display: flex;
  gap: 8px;
  margin-top: 18px;
`;

const StageBlock = styled.div<{$active: boolean}>`
  background: ${props => (props.$active ? 'rgba(0, 173, 230, 0.12)' : 'var(--ifm-color-white)')};
  border: 1px solid ${props => (props.$active ? 'rgba(0, 173, 230, 0.65)' : 'var(--ifm-color-gray-400)')};
  border-radius: 8px;
  color: var(--ifm-color-gray-900);
  font-size: 12px;
  font-weight: 800;
  flex: 1 1 0;
  min-width: 0;
  padding: 9px 6px;
  text-align: center;
`;

const StageArrow = styled.div`
  color: var(--ifm-color-gray-600);
  flex: 0 0 24px;
  font-weight: 800;
  text-align: center;

  @media (max-width: 640px) {
    flex-basis: 16px;
  }
`;

const SourcePicker = styled.div`
  margin-top: 16px;
`;

const SourcePickerLabel = styled.div`
  color: var(--ifm-color-gray-700);
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
`;

const SourceHint = styled.div`
  color: var(--ifm-color-gray-600);
  font-size: 10px;
  margin-top: 5px;
`;

const QueryForm = styled.form`
  margin-top: 16px;
`;

const QueryInputLabel = styled.label`
  color: var(--ifm-color-gray-700);
  display: block;
  font-size: 11px;
  font-weight: 800;
  margin-bottom: 5px;
  text-transform: uppercase;
`;

const QueryEditors = styled.div`
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
`;

const QueryEditor = styled.div`
  min-width: 0;
`;

const QueryInput = styled.textarea`
  background: var(--ifm-color-white);
  border: 1px solid var(--ifm-color-gray-400);
  border-radius: 6px;
  color: var(--ifm-color-gray-900);
  flex: 1;
  font-family: var(--ifm-font-family-monospace);
  font-size: 12px;
  min-height: 62px;
  min-width: 0;
  padding: 8px 9px;
  resize: vertical;
  width: 100%;
`;

const QueryButton = styled.button`
  background: var(--ifm-color-primary);
  border: 0;
  border-radius: 6px;
  color: white;
  font-size: 12px;
  font-weight: 800;
  margin-top: 10px;
  padding: 7px 14px;
`;

const QueryHint = styled.div`
  color: var(--ifm-color-gray-600);
  font-size: 10px;
  margin-top: 5px;
`;

const PlanPanel = styled.div`
  background: var(--ifm-color-gray-200);
  border: 1px solid var(--ifm-color-gray-300);
  border-radius: 8px;
  margin-top: 16px;
  padding: 10px 12px;
`;

const PlanHeader = styled.div`
  align-items: baseline;
  color: var(--ifm-color-gray-900);
  display: flex;
  font-size: 12px;
  gap: 8px;
  justify-content: space-between;

  span {
    color: var(--ifm-color-gray-700);
    font-size: 11px;
  }
`;

const PlanStats = styled.div`
  display: flex;
  gap: 18px;
  margin-top: 8px;
`;

const Metric = styled.div`
  align-items: baseline;
  display: flex;
  gap: 5px;
`;

const MetricValue = styled.div`
  color: var(--ifm-color-gray-900);
  font-size: 15px;
  font-weight: 800;
`;

const MetricLabel = styled.div`
  color: var(--ifm-color-gray-700);
  font-size: 11px;
`;

const ErrorMessage = styled.div`
  background: rgba(211, 47, 47, 0.08);
  border: 1px solid rgba(211, 47, 47, 0.35);
  border-radius: 8px;
  color: var(--ifm-color-gray-900);
  font-size: 13px;
  margin-top: 16px;
  padding: 10px;
`;

const PreviewFrame = styled.div`
  border: 1px solid var(--ifm-color-gray-400);
  border-radius: 8px;
  margin-top: 16px;
  overflow: hidden;
`;

const PreviewHeading = styled.div`
  align-items: baseline;
  background: var(--ifm-color-gray-200);
  color: var(--ifm-color-gray-900);
  display: flex;
  font-size: 12px;
  gap: 8px;
  justify-content: space-between;
  padding: 10px 12px;

  span {
    color: var(--ifm-color-gray-700);
    font-size: 11px;
  }
`;

const PreviewScroll = styled.div`
  max-width: 100%;
  overflow-x: auto;
`;

const PreviewTable = styled.table`
  border-collapse: collapse;
  color: var(--ifm-color-gray-900);
  font-size: 11px;
  margin: 0;
  min-width: 100%;
  white-space: nowrap;

  th,
  td {
    border-bottom: 1px solid var(--ifm-color-gray-300);
    padding: 7px 9px;
    text-align: left;
  }

  th {
    background: var(--ifm-color-white);
    font-weight: 800;
  }

  tr:last-child td {
    border-bottom: 0;
  }
`;
