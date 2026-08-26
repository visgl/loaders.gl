import React, {useEffect, useState} from 'react';
import type {ParquetSource} from '@loaders.gl/parquet';
import type {ArrowTable} from '@loaders.gl/schema';
import type {ScanQueryMetadata} from '@loaders.gl/loader-utils';
import {ScanQueryPanel, type ScanQueryPanelState} from './scan-query-panel';

type ParquetDemoState = Readonly<{
  metadata?: ScanQueryMetadata;
  table?: ArrowTable;
  loading: boolean;
  error?: string;
}>;

const DEFAULT_PARQUET_URL =
  'https://raw.githubusercontent.com/visgl/loaders.gl/master/modules/parquet/test/data/geoparquet/airports.parquet';

/** Demonstrates the shared scan panel on a standalone range-readable Parquet file. */
export function ParquetScanLiveExample(): JSX.Element {
  const [url, setUrl] = useState(DEFAULT_PARQUET_URL);
  const [query, setQuery] = useState<ScanQueryPanelState>({});
  const [submittedQuery, setSubmittedQuery] = useState<ScanQueryPanelState>({});
  const [state, setState] = useState<ParquetDemoState>({loading: true});

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const {ParquetSource} = await import('@loaders.gl/parquet');
        const source = new ParquetSource(url, {parquet: {worker: false}}) as ParquetSource;
        const metadata = await source.getQueryMetadata();
        let table: ArrowTable | undefined;
        for await (const batch of source.read({
          columns: submittedQuery.columns,
          limit: submittedQuery.limit,
          signal: undefined
        })) {
          table = batch.data;
          break;
        }
        await source.close();
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
      <label htmlFor="parquet-scan-url">Parquet URL</label>
      <input
        id="parquet-scan-url"
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
        title="Parquet scan parameters"
      />
      {state.error ? <p role="alert">{state.error}</p> : null}
      {state.table ? <ParquetPreview table={state.table} /> : null}
    </div>
  );
}

function ParquetPreview({table}: {table: ArrowTable}): JSX.Element {
  const columns = table.schema.fields.map(field => field.name);
  return <p><strong>Arrow result:</strong> {table.data.numRows} rows · {columns.length} columns ({columns.join(', ')})</p>;
}
