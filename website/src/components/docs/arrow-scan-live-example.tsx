import React, {useEffect, useState} from 'react';
import {ArrowTableSource} from '@loaders.gl/arrow';
import type {ArrowTable} from '@loaders.gl/schema';
import type {ScanQueryMetadata} from '@loaders.gl/scan';
import {ScanQueryPanel, type ScanQueryPanelState} from './scan-query-panel';

type ArrowScanDemoState = Readonly<{
  metadata?: ScanQueryMetadata;
  table?: ArrowTable;
  error?: string;
  loading: boolean;
}>;

const DEFAULT_ARROW_URL =
  'https://raw.githubusercontent.com/visgl/loaders.gl/master/modules/arrow/test/data/arrow/simple.arrow';

/** Demonstrates the shared metadata-driven scan panel on an Arrow IPC source. */
export function ArrowScanLiveExample(): JSX.Element {
  const [url, setUrl] = useState(DEFAULT_ARROW_URL);
  const [query, setQuery] = useState<ScanQueryPanelState>({});
  const [submittedQuery, setSubmittedQuery] = useState<ScanQueryPanelState>({});
  const [state, setState] = useState<ArrowScanDemoState>({loading: true});

  useEffect(() => {
    let mounted = true;
    const source = new ArrowTableSource(url);
    setState({loading: true});
    void (async () => {
      try {
        const metadata = await source.getQueryMetadata();
        let table: ArrowTable | undefined;
        for await (const batch of source.read({
          columns: submittedQuery.columns,
          limit: submittedQuery.limit
        })) {
          table = batch.data;
          break;
        }
        if (mounted) setState({metadata, table, loading: false});
      } catch (error) {
        if (mounted) setState({loading: false, error: error instanceof Error ? error.message : String(error)});
      }
    })();
    return () => {
      mounted = false;
    };
  }, [url, submittedQuery]);

  return (
    <div>
      <label htmlFor="arrow-scan-url">Arrow IPC URL</label>
      <input
        id="arrow-scan-url"
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
        title="Arrow scan parameters"
      />
      {state.error ? <p role="alert">{state.error}</p> : null}
      {state.table ? <ArrowPreview table={state.table} /> : null}
    </div>
  );
}

function ArrowPreview({table}: {table: ArrowTable}): JSX.Element {
  const columns = table.schema.fields.map(field => field.name);
  const rowCount = Math.min(table.data.numRows, 5);
  return (
    <div style={{overflowX: 'auto'}}>
      <p><strong>Arrow result:</strong> {table.data.numRows} rows · {columns.length} columns</p>
      <table>
        <thead><tr>{columns.map(column => <th key={column}>{column}</th>)}</tr></thead>
        <tbody>
          {Array.from({length: rowCount}, (_, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map(column => <td key={column}>{formatCell(table.data.getChild(column)?.get(rowIndex))}</td>)}
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
