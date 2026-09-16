import React, {useEffect, useId, useState} from 'react';
import styled from 'styled-components';
import type {CatalogSource, CatalogSourceCapabilities} from '@loaders.gl/loader-utils';

/** A source registered with the catalog explorer. */
export type CatalogExplorerSource = Readonly<{
  /** Stable identifier used by the source selector. */
  id: string;
  /** Human-readable source name. */
  title: string;
  /** Protocol-neutral catalog source. */
  // `never` keeps this prop compatible with sources whose protocol defines its own query type
  // (for example STAC) while the explorer supplies a normalized query at runtime.
  source: CatalogSource<unknown, never, unknown>;
}>;

/** Search values emitted by the catalog explorer. */
export type CatalogExplorerQuery = Readonly<{
  /** Free-text query, when supported by the source. */
  text?: string;
  /** Four-coordinate bounding box. */
  boundingBox?: readonly [number, number, number, number];
  /** RFC 3339 instant or interval. */
  datetime?: string;
  /** Maximum number of records displayed. */
  limit: number;
}>;

/** Props for a source-neutral STAC and catalog explorer panel. */
export type CatalogExplorerPanelProps = Readonly<{
  /** Catalog sources available in the source selector. */
  sources: readonly CatalogExplorerSource[];
  /** Initially selected source id. Defaults to the first source. */
  sourceId?: string;
  /** Called when a record is selected in the results list. */
  onSelectRecord?: (record: unknown) => void;
  /** Optional heading. */
  title?: string;
}>;

type CatalogQuerySource = CatalogSource<unknown, Record<string, unknown>, unknown> & {
  traverse?: (query: Record<string, unknown>) => AsyncIterable<unknown>;
};

/** Renders source selection, capability-aware search controls, metadata, and catalog records. */
export function CatalogExplorerPanel({
  sources,
  sourceId,
  onSelectRecord,
  title = 'Catalog explorer'
}: CatalogExplorerPanelProps): JSX.Element {
  const panelId = useId().replace(/:/g, '');
  const [selectedSourceId, setSelectedSourceId] = useState(sourceId || sources[0]?.id || '');
  const [query, setQuery] = useState<CatalogExplorerQuery>({limit: 25});
  const [submittedQuery, setSubmittedQuery] = useState<CatalogExplorerQuery>({limit: 25});
  const [metadata, setMetadata] = useState<unknown>();
  const [records, setRecords] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const selectedSource = sources.find(source => source.id === selectedSourceId) || sources[0];
  const capabilities = selectedSource?.source.capabilities;

  useEffect(() => {
    if (!selectedSource) return;
    const abortController = new AbortController();
    setLoading(true);
    setError(undefined);
    setRecords([]);
    void (async () => {
      try {
        const nextMetadata = await selectedSource.source.getMetadata();
        if (abortController.signal.aborted) return;
        setMetadata(nextMetadata);
        if (submittedQuery.text && !capabilities?.textFilter) {
          setRecords([]);
          return;
        }
        const source = selectedSource.source as CatalogQuerySource;
        const sourceQuery: Record<string, unknown> = {
          limit: submittedQuery.limit,
          datetime: submittedQuery.datetime || undefined,
          bbox: submittedQuery.boundingBox,
          q: submittedQuery.text || undefined,
          signal: abortController.signal
        };
        const nextRecords: unknown[] = [];
        const rootMetadata = asRecord(nextMetadata);
        const recordsIterator = rootMetadata?.mode === 'static' && source.traverse
          ? source.traverse(sourceQuery)
          : source.search(sourceQuery);
        for await (const record of recordsIterator) {
          if (abortController.signal.aborted) return;
          nextRecords.push(record);
          if (nextRecords.length >= submittedQuery.limit) break;
        }
        setRecords(nextRecords);
      } catch (nextError) {
        if (!abortController.signal.aborted) {
          setError(nextError instanceof Error ? nextError.message : String(nextError));
        }
      } finally {
        if (!abortController.signal.aborted) setLoading(false);
      }
    })();
    return () => abortController.abort();
  }, [selectedSource, submittedQuery, capabilities]);

  const supportsSearch = capabilities?.search ?? false;
  return (
    <Panel aria-label={title}>
      <PanelHeader>
        <div>
          <Heading>{title}</Heading>
          <Hint>{loading ? 'Discovering catalog…' : selectedSource ? selectedSource.title : 'Add a catalog source'}</Hint>
        </div>
        {sources.length > 1 ? (
          <Select
            aria-label="Catalog source"
            value={selectedSource?.id || ''}
            onChange={event => setSelectedSourceId(event.target.value)}
          >
            {sources.map(source => <option key={source.id} value={source.id}>{source.title}</option>)}
          </Select>
        ) : null}
      </PanelHeader>
      {selectedSource ? (
        <>
          <CapabilityRow>
            <Badge $active={supportsSearch}>{supportsSearch ? 'Search' : 'Metadata only'}</Badge>
            {formatCapabilities(capabilities).map(capability => <span key={capability}>{capability}</span>)}
          </CapabilityRow>
          <Metadata>{formatMetadata(metadata)}</Metadata>
          <Controls onSubmit={event => { event.preventDefault(); setSubmittedQuery(query); }}>
            {capabilities?.textFilter ? (
              <Field><Label htmlFor={`${panelId}-text`}>Text</Label><Input id={`${panelId}-text`} value={query.text || ''} placeholder="Search records" onChange={event => setQuery({...query, text: event.target.value})} /></Field>
            ) : null}
            {capabilities?.spatialFilter ? (
              <Field><Label htmlFor={`${panelId}-bbox`}>Bounding box</Label><Input id={`${panelId}-bbox`} value={query.boundingBox?.join(',') || ''} placeholder="minX,minY,maxX,maxY" onChange={event => setQuery({...query, boundingBox: parseBounds(event.target.value)})} /></Field>
            ) : null}
            {capabilities?.temporalFilter ? (
              <Field><Label htmlFor={`${panelId}-datetime`}>Date or interval</Label><Input id={`${panelId}-datetime`} value={query.datetime || ''} placeholder="2024-01-01/.." onChange={event => setQuery({...query, datetime: event.target.value})} /></Field>
            ) : null}
            <Field><Label htmlFor={`${panelId}-limit`}>Results</Label><Input id={`${panelId}-limit`} type="number" min="1" max="100" value={query.limit} onChange={event => setQuery({...query, limit: Math.max(1, Number(event.target.value) || 1)})} /></Field>
            <ApplyButton type="submit" disabled={!supportsSearch || loading}>{loading ? 'Loading…' : 'Search'}</ApplyButton>
          </Controls>
          {error ? <ErrorMessage role="alert">{error}</ErrorMessage> : null}
          <ResultsHeader><strong>Results</strong><span>{records.length}{records.length === query.limit ? '+' : ''}</span></ResultsHeader>
          <ResultList>
            {records.map((record, index) => <ResultRow key={`${recordKey(record)}-${index}`} type="button" onClick={() => onSelectRecord?.(record)}><ResultTitle>{recordTitle(record)}</ResultTitle><ResultSummary>{recordSummary(record)}</ResultSummary><Details>{recordAssets(record)}</Details></ResultRow>)}
          </ResultList>
          {!loading && !error && records.length === 0 ? <EmptyState>{supportsSearch ? 'No records found.' : 'This source exposes metadata but not search.'}</EmptyState> : null}
        </>
      ) : <EmptyState>No catalog source configured.</EmptyState>}
    </Panel>
  );
}

function parseBounds(value: string): readonly [number, number, number, number] | undefined {
  const values = value.split(',').map(part => Number(part.trim()));
  return values.length === 4 && values.every(Number.isFinite) ? [values[0], values[1], values[2], values[3]] : undefined;
}

function asRecord(value: unknown): Record<string, unknown> | undefined { return value && typeof value === 'object' ? value as Record<string, unknown> : undefined; }
function recordKey(value: unknown): string { return String(asRecord(value)?.id || asRecord(value)?.title || 'record'); }
function recordTitle(value: unknown): string { const record = asRecord(value); return String(record?.title || record?.id || 'Untitled record'); }
function recordSummary(value: unknown): string { const record = asRecord(value); return String(record?.description || record?.collection || record?.datetime || ''); }
function recordAssets(value: unknown): JSX.Element | null {
  const assets = asRecord(asRecord(value)?.assets);
  if (!assets) return null;
  const links = Object.entries(assets).filter(([, asset]) => asRecord(asset)?.href);
  return links.length ? <AssetList>{links.slice(0, 4).map(([name, asset]) => <a key={name} href={String(asRecord(asset)?.href)} target="_blank" rel="noreferrer" onClick={event => event.stopPropagation()}>{name}</a>)}</AssetList> : null;
}
function formatCapabilities(capabilities?: CatalogSourceCapabilities): string[] { if (!capabilities) return []; return Object.entries(capabilities).filter(([, enabled]) => enabled).map(([name]) => name); }
function formatMetadata(metadata: unknown): string { const record = asRecord(metadata); const root = asRecord(record?.root); return root ? `${String(root.title || root.id || 'Catalog')} · ${String(root.type || 'source')}` : metadata ? 'Metadata loaded' : 'Loading metadata…'; }

const Panel = styled.section`border:1px solid #d8dee9;border-radius:8px;padding:14px;margin:14px 0;background:#fbfcfe;`;
const PanelHeader = styled.div`display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:10px;`;
const Heading = styled.strong`display:block;`;
const Hint = styled.span`color:#667085;font-size:.82rem;`;
const CapabilityRow = styled.div`display:flex;gap:8px;flex-wrap:wrap;align-items:center;color:#667085;font-size:.74rem;margin-bottom:8px;`;
const Badge = styled.span<{$active:boolean}>`border-radius:999px;padding:2px 8px;color:${({$active}) => $active ? '#067647' : '#7a2e0e'};background:${({$active}) => $active ? '#ecfdf3' : '#fff4ed'};font-weight:600;`;
const Metadata = styled.div`color:#475467;font-size:.82rem;margin-bottom:12px;`;
const Controls = styled.form`display:flex;gap:10px;align-items:end;flex-wrap:wrap;`;
const Field = styled.div`display:flex;flex-direction:column;gap:4px;flex:1;min-width:140px;`;
const Label = styled.label`font-size:.78rem;font-weight:600;`;
const Input = styled.input`border:1px solid #d0d5dd;border-radius:5px;padding:7px;min-width:0;`;
const Select = styled.select`border:1px solid #d0d5dd;border-radius:5px;padding:7px;background:#fff;`;
const ApplyButton = styled.button`border:0;border-radius:5px;padding:8px 12px;color:#fff;background:#475467;cursor:pointer;&:disabled{background:#98a2b3;cursor:not-allowed;}`;
const ErrorMessage = styled.div`color:#b42318;font-size:.82rem;margin-top:10px;`;
const ResultsHeader = styled.div`display:flex;justify-content:space-between;margin-top:16px;padding-bottom:6px;border-bottom:1px solid #eaecf0;font-size:.82rem;color:#667085;`;
const ResultList = styled.div`display:flex;flex-direction:column;`;
const ResultRow = styled.button`display:block;text-align:left;border:0;border-bottom:1px solid #eaecf0;background:transparent;padding:10px 2px;cursor:pointer;&:hover{background:#f2f4f7;}`;
const ResultTitle = styled.div`font-weight:600;color:#344054;`;
const ResultSummary = styled.div`color:#667085;font-size:.78rem;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;`;
const Details = styled.div`margin-top:5px;font-size:.74rem;`;
const AssetList = styled.div`display:flex;gap:10px;flex-wrap:wrap;a{color:#175cd3;}`;
const EmptyState = styled.div`color:#667085;font-size:.84rem;padding:14px 0;`;

