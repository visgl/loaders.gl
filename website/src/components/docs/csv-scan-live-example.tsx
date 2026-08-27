import React, {useEffect, useState} from 'react';
import {CSVTableSource} from '@loaders.gl/csv';
import type {ScanQueryMetadata} from '@loaders.gl/scan';
import {ScanQueryPanel, type ScanQueryPanelState} from './scan-query-panel';

type CSVScanDemoState = Readonly<{
  metadata?: ScanQueryMetadata;
  rows?: readonly Record<string, unknown>[];
  error?: string;
  loading: boolean;
}>;

const DEFAULT_CSV_URL =
  'https://raw.githubusercontent.com/visgl/loaders.gl/master/modules/csv/test/data/sample.csv';

/** Demonstrates the shared metadata-driven scan panel on a forward-only CSV source. */
export function CSVScanLiveExample(): JSX.Element {
  const [url, setUrl] = useState(DEFAULT_CSV_URL);
  const [query, setQuery] = useState<ScanQueryPanelState>({});
  const [submittedQuery, setSubmittedQuery] = useState<ScanQueryPanelState>({});
  const [state, setState] = useState<CSVScanDemoState>({loading: true});

  useEffect(() => {
    let mounted = true;
    const source = new CSVTableSource(url);
    setState({loading: true});
    void (async () => {
      try {
        const metadata = await source.getQueryMetadata();
        const rows: Record<string, unknown>[] = [];
        for await (const batch of source.read({
          columns: submittedQuery.columns,
          limit: submittedQuery.limit
        })) {
          if (batch.shape === 'object-row-table') rows.push(...batch.data);
          if (rows.length >= 5) break;
        }
        if (mounted) setState({metadata, rows: rows.slice(0, 5), loading: false});
      } catch (error) {
        if (mounted) setState({loading: false, error: error instanceof Error ? error.message : String(error)});
      }
    })();
    return () => {
      mounted = false;
    };
  }, [url, submittedQuery]);

  const columns = state.metadata?.columns.map(column => column.name) || [];
  return (
    <div>
      <label htmlFor="csv-scan-url">CSV URL</label>
      <input
        id="csv-scan-url"
        style={{display: 'block', width: '100%', margin: '6px 0', padding: 7}}
        value={url}
        onChange={event => setUrl(event.target.value)}
      />
      <ScanQueryPanel
        metadata={state.metadata}
        loading={state.loading}
        value={query}
        onApply={nextQuery => {
          setQuery(nextQuery);
          setSubmittedQuery(nextQuery);
        }}
        title="CSV scan parameters"
      />
      {state.error ? <p role="alert">{state.error}</p> : null}
      {state.rows ? <CSVPreview columns={columns} rows={state.rows} /> : null}
    </div>
  );
}

function CSVPreview({columns, rows}: {columns: readonly string[]; rows: readonly Record<string, unknown>[]}): JSX.Element {
  return (
    <div style={{overflowX: 'auto'}}>
      <p><strong>Streamed CSV rows:</strong> showing {rows.length} rows</p>
      <table>
        <thead><tr>{columns.map(column => <th key={column}>{column}</th>)}</tr></thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map(column => <td key={column}>{formatCell(row[column])}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') return '[value]';
  return String(value);
}
