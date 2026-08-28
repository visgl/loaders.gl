import React, {useEffect, useState} from 'react';
import styled from 'styled-components';

import type {ScanExecutionTelemetry, ScanQueryMetadata} from '@loaders.gl/scan';

import {
  FederatedScanPanel,
  type FederatedScanPanelSource,
  type FederatedScanPanelState
} from './federated-scan-panel';

const DEFAULT_STATE: FederatedScanPanelState = {
  sourceIds: ['recent', 'archive', 'snapshot'],
  schemaPolicy: 'strict',
  columnMappings: {
    recent: {station_id: 'stationId', temp: 'temperature'},
    snapshot: {station_id: 'stationId'}
  },
  predicateSql: 'temperature >= :minimum',
  parameters: {minimum: 18},
  query: {columns: ['stationId', 'temperature', 'period'], limit: 5}
};

type DemoResults = Readonly<{
  explanation?: unknown;
  telemetry?: ScanExecutionTelemetry;
  provenance?: readonly string[];
  rows?: readonly Record<string, unknown>[];
  error?: string;
}>;

/** Runs a heterogeneous managed-source append entirely in the browser. */
export function FederatedScanLiveExample(): JSX.Element {
  const [value, setValue] = useState(DEFAULT_STATE);
  const [submittedValue, setSubmittedValue] = useState(DEFAULT_STATE);
  const [sources, setSources] = useState<readonly FederatedScanPanelSource[]>([]);
  const [metadata, setMetadata] = useState<ScanQueryMetadata>();
  const [results, setResults] = useState<DemoResults>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const run = async (): Promise<void> => {
      setLoading(true);
      setResults({});
      try {
        const [arrowModule, arrowLoaderModule, csvModule, jsonModule, loaderUtilsModule, scanModule] =
          await Promise.all([
            import('apache-arrow'),
            import('@loaders.gl/arrow'),
            import('@loaders.gl/csv'),
            import('@loaders.gl/json'),
            import('@loaders.gl/loader-utils'),
            import('@loaders.gl/scan')
          ]);
        const dataSourceManager = new loaderUtilsModule.DataSourceManager();
        dataSourceManager.add({
          dataSourceId: 'recent',
          dataSource: new csvModule.CSVTableSource(
            new Blob([
              'station_id,temp,period\n',
              'bos,21.5,recent\n',
              'nyc,17.0,recent\n'
            ]),
            {csv: {batchSize: 1}}
          )
        });
        dataSourceManager.add({
          dataSourceId: 'archive',
          dataSource: new jsonModule.NDJSONTableSource(
            new Blob([
              '{"stationId":"sea","temperature":19,"period":"archive"}\n',
              '{"stationId":"sfo","temperature":16,"period":"archive"}\n'
            ]),
            {ndjson: {batchSize: 1}}
          )
        });
        const snapshotTable = arrowModule.tableFromArrays({
          station_id: ['lax', 'den'],
          temperature: [24, 12],
          period: ['snapshot', 'snapshot']
        });
        dataSourceManager.add({
          dataSourceId: 'snapshot',
          dataSource: new arrowLoaderModule.ArrowTableSource(
            new Blob([arrowModule.tableToIPC(snapshotTable)])
          )
        });

        const discovery = await dataSourceManager.discoverDataSources({queryType: 'table'});
        if (!active) return;
        setSources(
          discovery.map(source => ({
            id: source.dataSourceId,
            title: getSourceTitle(source.dataSourceId),
            sourceType: source.queryMetadata?.sourceType || 'unknown',
            compatible: source.compatible
          }))
        );
        const selectedSources = submittedValue.sourceIds.map(dataSourceId => ({
          dataSourceId,
          columnMapping: submittedValue.columnMappings[dataSourceId]
        }));
        const source = new scanModule.FederatedTableScanSource(dataSourceManager, {
          name: 'weather-history',
          schemaPolicy: submittedValue.schemaPolicy,
          sources: selectedSources
        });
        const predicate = submittedValue.predicateSql
          ? scanModule.parseSQLPredicate(submittedValue.predicateSql, {
              parameters: normalizeParameters(submittedValue.parameters)
            })
          : undefined;
        const query = {
          predicate,
          columns: submittedValue.query.columns,
          limit: submittedValue.query.limit
        };
        const [queryMetadata, explanation] = await Promise.all([
          source.getQueryMetadata(),
          source.explain(query)
        ]);
        if (!active) return;
        setMetadata(queryMetadata);
        const rows: Record<string, unknown>[] = [];
        const provenance: string[] = [];
        let telemetry: ScanExecutionTelemetry | undefined;
        for await (const batch of source.read({
          ...query,
          onTelemetry: value => {
            telemetry = value;
          }
        })) {
          provenance.push(batch.sourceId);
          rows.push(...batch.data.toArray().map(row => row.toJSON()));
        }
        if (active) setResults({explanation, telemetry, provenance, rows});
      } catch (error) {
        if (active) {
          setMetadata(undefined);
          setResults({error: error instanceof Error ? error.message : String(error)});
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [submittedValue]);

  return (
    <ExampleFrame>
      <ExampleHeader>
        <div>
          <strong>Heterogeneous weather history</strong>
          <div>CSV + NDJSON + Arrow IPC → ordered Arrow batches</div>
        </div>
        <Status $failed={Boolean(results.error)}>
          {results.error ? 'Failed' : loading ? 'Planning…' : `${results.rows?.length || 0} rows`}
        </Status>
      </ExampleHeader>
      <FederatedScanPanel
        sources={sources}
        metadata={metadata}
        loading={loading}
        value={value}
        results={{
          explanation: results.explanation,
          telemetry: results.telemetry,
          provenance: results.provenance
        }}
        onApply={nextValue => {
          setValue(nextValue);
          setSubmittedValue(nextValue);
        }}
      />
      {results.error ? <ErrorMessage>{results.error}</ErrorMessage> : null}
      {results.rows?.length ? <RowsPreview rows={results.rows} /> : null}
    </ExampleFrame>
  );
}

/** Renders the bounded result without losing its Arrow field order. */
function RowsPreview({rows}: {rows: readonly Record<string, unknown>[]}): JSX.Element {
  const columns = Object.keys(rows[0] || {});
  return (
    <Preview>
      <strong>Bounded Arrow result</strong>
      <table>
        <thead>
          <tr>{columns.map(column => <th key={column}>{column}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map(column => <td key={column}>{String(row[column] ?? 'null')}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </Preview>
  );
}

/** Converts JSON-editor values to the portable named-parameter scalar set. */
function normalizeParameters(
  parameters: Readonly<Record<string, unknown>>
): Readonly<Record<string, boolean | number | string>> {
  const result: Record<string, boolean | number | string> = {};
  for (const [name, value] of Object.entries(parameters)) {
    if (typeof value !== 'boolean' && typeof value !== 'number' && typeof value !== 'string') {
      throw new Error(`Predicate parameter ${name} must be a boolean, number, or string.`);
    }
    result[name] = value;
  }
  return result;
}

/** Returns the user-facing label for one deterministic demo registration. */
function getSourceTitle(sourceId: string): string {
  return (
    {
      recent: 'Recent stations',
      archive: 'Archive observations',
      snapshot: 'Historical snapshot'
    }[sourceId] || sourceId
  );
}

const ExampleFrame = styled.section`
  margin: 18px 0;
`;
const ExampleHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: #475467;

  strong {
    color: #101828;
  }
`;
const Status = styled.span<{$failed: boolean}>`
  align-self: flex-start;
  border-radius: 999px;
  padding: 3px 9px;
  color: ${({$failed}) => ($failed ? '#b42318' : '#067647')};
  background: ${({$failed}) => ($failed ? '#fef3f2' : '#ecfdf3')};
  font-size: 0.76rem;
  font-weight: 600;
`;
const ErrorMessage = styled.div`
  border-radius: 6px;
  padding: 10px;
  color: #b42318;
  background: #fef3f2;
`;
const Preview = styled.div`
  overflow-x: auto;
  border: 1px solid #d0d5dd;
  border-radius: 8px;
  padding: 12px;

  table {
    width: 100%;
    margin-top: 8px;
    border-collapse: collapse;
  }

  th,
  td {
    border-bottom: 1px solid #eaecf0;
    padding: 6px 8px;
    text-align: left;
    font-size: 0.78rem;
  }
`;
