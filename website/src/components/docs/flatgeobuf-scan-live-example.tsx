import React, {useEffect, useState} from 'react';
import type {FlatGeobufReadOptions} from '@loaders.gl/flatgeobuf';
import type {ArrowTable} from '@loaders.gl/schema';
import {FlatGeobufVectorSource} from '@loaders.gl/flatgeobuf';
import type {ScanQueryMetadata} from '@loaders.gl/loader-utils';
import {ScanQueryPanel, type ScanQueryPanelState} from './scan-query-panel';

type FlatGeobufDemoState = Readonly<{
  metadata?: ScanQueryMetadata;
  table?: ArrowTable;
  error?: string;
  loading: boolean;
}>;

const DEFAULT_FLATGEOBUF_URL =
  'https://raw.githubusercontent.com/visgl/loaders.gl/master/modules/flatgeobuf/test/data/countries.fgb';

/** Demonstrates metadata-driven projection, limit, and bbox controls over FlatGeobuf. */
export function FlatGeobufScanLiveExample(): JSX.Element {
  const [url, setUrl] = useState(DEFAULT_FLATGEOBUF_URL);
  const [query, setQuery] = useState<ScanQueryPanelState>({});
  const [submittedQuery, setSubmittedQuery] = useState<ScanQueryPanelState>({});
  const [state, setState] = useState<FlatGeobufDemoState>({loading: true});

  useEffect(() => {
    let mounted = true;
    const source = new FlatGeobufVectorSource(url, {flatgeobuf: {format: 'arrow'}});
    setState({loading: true});
    void (async () => {
      try {
        const metadata = await source.getQueryMetadata();
        const options: FlatGeobufReadOptions = {
          columns: submittedQuery.columns,
          limit: submittedQuery.limit,
          boundingBox: submittedQuery.boundingBox
        };
        const table = await source.query(options);
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
      <label htmlFor="flatgeobuf-scan-url">FlatGeobuf URL</label>
      <input
        id="flatgeobuf-scan-url"
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
        title="FlatGeobuf scan parameters"
      />
      {state.error ? <p role="alert">{state.error}</p> : null}
      {state.table ? <FlatGeobufPreview table={state.table} /> : null}
    </div>
  );
}

function FlatGeobufPreview({table}: {table: ArrowTable}): JSX.Element {
  const columns = table.schema.fields.map(field => field.name);
  const rowCount = Math.min(table.data.numRows, 5);
  return (
    <div style={{overflowX: 'auto'}}>
      <p>
        <strong>Arrow result:</strong> {table.data.numRows} rows · {columns.length} columns
      </p>
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
