import React, {useEffect, useId, useRef, useState} from 'react';
import styled from 'styled-components';
import type {CatalogSource, CatalogSourceCapabilities} from '@loaders.gl/core/loader-utils';
import {ReactExamplePanel} from './example-panel-host';
import {getCatalogAssetUrl} from './catalog-asset-url';
import {CatalogJsonTree} from './catalog-json-tree';

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
  /** Opens a resolved asset in a host-provided preview. */
  onSelectAsset?: (asset: {key: string; href: string}) => void;
  /** Selected asset content displayed beside the entries. */
  preview?: React.ReactNode;
  /** Returns from the asset preview to entry details. */
  onClosePreview?: () => void;
  /** Optional heading. */
  title?: string;
}>;

type CatalogQuerySource = CatalogSource<unknown, Record<string, unknown>, unknown> & {
  traverse?: (query: Record<string, unknown>) => AsyncIterable<unknown>;
  getAssets?: (object: unknown) => Array<{key: string; href: string}>;
};
type CatalogAssetSource = CatalogSource<unknown, never, unknown> & {
  getAssets?: (object: unknown) => Array<{key: string; href: string}>;
};

/**
 * Renders catalog controls as application content in a panels-module CustomPanel.
 * A reusable upstream CatalogPanel could own the query and record UI, accepting capability,
 * search, and selection adapters while keeping loaders.gl protocol implementations outside panels.
 */
export function CatalogExplorerPanel({
  sources,
  sourceId,
  onSelectRecord,
  onSelectAsset,
  preview,
  onClosePreview,
  title = 'Catalog explorer'
}: CatalogExplorerPanelProps): React.JSX.Element {
  const panelId = useId().replace(/:/g, '');
  const inspector = useRef<HTMLDivElement>(null);
  const [selectedSourceId, setSelectedSourceId] = useState(sourceId || sources[0]?.id || '');
  const [query, setQuery] = useState<CatalogExplorerQuery>({limit: 25});
  const [submittedQuery, setSubmittedQuery] = useState<CatalogExplorerQuery>({limit: 25});
  const [metadata, setMetadata] = useState<unknown>();
  const [selectedRecord, setSelectedRecord] = useState<unknown>();
  const [records, setRecords] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const selectedSource = sources.find(source => source.id === selectedSourceId) || sources[0];
  const selectedSourceSource = selectedSource?.source;
  const capabilities = selectedSourceSource?.capabilities;

  useEffect(() => {
    if (!selectedSourceSource) return;
    const abortController = new AbortController();
    setLoading(true);
    setError(undefined);
    setRecords([]);
    setSelectedRecord(undefined);
    setMetadata(undefined);
    void (async () => {
      try {
        const nextMetadata = await selectedSourceSource.getMetadata();
        if (abortController.signal.aborted) return;
        setMetadata(nextMetadata);
        if (submittedQuery.text && !capabilities?.textFilter) {
          setRecords([]);
          return;
        }
        const source = selectedSourceSource as CatalogQuerySource;
        const sourceQuery: Record<string, unknown> = {
          limit: submittedQuery.limit,
          datetime: submittedQuery.datetime || undefined,
          bbox: submittedQuery.boundingBox,
          q: submittedQuery.text || undefined,
          signal: abortController.signal
        };
        const nextRecords: unknown[] = [];
        const rootMetadata = asRecord(nextMetadata);
        const recordsIterator =
          rootMetadata?.mode === 'static' && source.traverse
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
  }, [selectedSourceSource, submittedQuery, capabilities]);

  useEffect(() => {
    if (inspector.current) inspector.current.scrollTop = 0;
  }, [selectedRecord, preview]);

  const supportsSearch = capabilities?.search ?? false;
  return (
    <ReactExamplePanel title={title}>
      <Panel aria-label={title}>
        {sources.length > 1 ? (
          <PanelHeader>
            <div>
              <Hint>
                {loading
                  ? 'Discovering catalog…'
                  : selectedSource
                    ? selectedSource.title
                    : 'Add a catalog source'}
              </Hint>
            </div>
            {sources.length > 1 ? (
              <Select
                aria-label="Catalog source"
                value={selectedSource?.id || ''}
                onChange={event => setSelectedSourceId(event.target.value)}
              >
                {sources.map(source => (
                  <option key={source.id} value={source.id}>
                    {source.title}
                  </option>
                ))}
              </Select>
            ) : null}
          </PanelHeader>
        ) : null}
        {selectedSource ? (
          <>
            <Metadata>{formatMetadata(metadata)}</Metadata>
            <details>
              <summary>Search filters</summary>
              <CapabilityRow>
                <Badge $active={supportsSearch}>
                  {supportsSearch ? 'Search' : 'Metadata only'}
                </Badge>
                {formatCapabilities(capabilities).map(capability => (
                  <span key={capability}>{capability}</span>
                ))}
              </CapabilityRow>
              <Controls
                onSubmit={event => {
                  event.preventDefault();
                  onClosePreview?.();
                  setSubmittedQuery(query);
                }}
              >
                {capabilities?.textFilter ? (
                  <Field>
                    <Label htmlFor={`${panelId}-text`}>Text</Label>
                    <Input
                      id={`${panelId}-text`}
                      value={query.text || ''}
                      placeholder="Search records"
                      onChange={event => setQuery({...query, text: event.target.value})}
                    />
                  </Field>
                ) : null}
                {capabilities?.spatialFilter ? (
                  <Field>
                    <Label htmlFor={`${panelId}-bbox`}>Bounding box</Label>
                    <Input
                      id={`${panelId}-bbox`}
                      value={query.boundingBox?.join(',') || ''}
                      placeholder="minX,minY,maxX,maxY"
                      onChange={event =>
                        setQuery({...query, boundingBox: parseBounds(event.target.value)})
                      }
                    />
                  </Field>
                ) : null}
                {capabilities?.temporalFilter ? (
                  <Field>
                    <Label htmlFor={`${panelId}-datetime`}>Date or interval</Label>
                    <Input
                      id={`${panelId}-datetime`}
                      value={query.datetime || ''}
                      placeholder="2024-01-01/.."
                      onChange={event => setQuery({...query, datetime: event.target.value})}
                    />
                  </Field>
                ) : null}
                <Field>
                  <Label htmlFor={`${panelId}-limit`}>Results</Label>
                  <Input
                    id={`${panelId}-limit`}
                    type="number"
                    min="1"
                    max="100"
                    value={query.limit}
                    onChange={event =>
                      setQuery({...query, limit: Math.max(1, Number(event.target.value) || 1)})
                    }
                  />
                </Field>
                <ApplyButton type="submit" disabled={!supportsSearch || loading}>
                  {loading ? 'Loading…' : 'Search'}
                </ApplyButton>
              </Controls>
            </details>
            {error ? <ErrorMessage role="alert">{error}</ErrorMessage> : null}
            <Workspace>
              <EntriesPane>
                <ResultsHeader>
                  <strong>Results</strong>
                  <span>
                    {records.length}
                    {records.length === query.limit ? '+' : ''}
                  </span>
                </ResultsHeader>
                <ResultList role="region" aria-label="Catalog entries" tabIndex={0}>
                  {records.map((record, index) => (
                    <ResultRow key={`${recordKey(record)}-${index}`}>
                      <ResultTitle
                        type="button"
                        onClick={() => {
                          setSelectedRecord(record);
                          onSelectRecord?.(record);
                        }}
                      >
                        {recordTitle(record)}
                      </ResultTitle>
                      <ResultSummary>{recordSummary(record)}</ResultSummary>
                      <Details>
                        {recordAssets(
                          record,
                          selectedSourceSource,
                          onSelectAsset
                            ? asset => {
                                setSelectedRecord(record);
                                onSelectAsset(asset);
                              }
                            : undefined
                        )}
                      </Details>
                    </ResultRow>
                  ))}
                </ResultList>
                {!loading && !error && records.length === 0 ? (
                  <EmptyState>
                    {supportsSearch
                      ? 'No records found.'
                      : 'This source exposes metadata but not search.'}
                  </EmptyState>
                ) : null}
              </EntriesPane>
              <PreviewPane
                ref={inspector}
                role="region"
                aria-label="Catalog inspector"
                tabIndex={0}
              >
                {preview ? (
                  <>
                    <button type="button" onClick={onClosePreview}>
                      Back to entry details
                    </button>
                    {preview}
                  </>
                ) : selectedRecord !== undefined ? (
                  <section aria-label="Catalog entry details">
                    <ResultsHeader>
                      <strong>{recordTitle(selectedRecord)}</strong>
                      <button
                        type="button"
                        aria-label="Close catalog entry details"
                        onClick={() => setSelectedRecord(undefined)}
                      >
                        Close
                      </button>
                    </ResultsHeader>
                    <p>{recordSummary(selectedRecord)}</p>
                    <RecordMetadata>
                      {Object.entries({
                        ...asRecord(selectedRecord),
                        ...asRecord(asRecord(selectedRecord)?.properties)
                      })
                        .filter(
                          ([name, value]) =>
                            ![
                              'properties',
                              'geometry',
                              'assets',
                              'links',
                              'description',
                              'title'
                            ].includes(name) &&
                            value !== null &&
                            typeof value !== 'object'
                        )
                        .map(([name, value]) => (
                          <React.Fragment key={name}>
                            <dt>{name}</dt>
                            <dd>{String(value)}</dd>
                          </React.Fragment>
                        ))}
                    </RecordMetadata>
                    {onSelectAsset ? (
                      <div aria-label="Entry asset previews">
                        {recordAssets(selectedRecord, selectedSourceSource, onSelectAsset)}
                      </div>
                    ) : null}
                    <CatalogJsonTree
                      key={recordKey(selectedRecord)}
                      label="Full entry JSON"
                      value={selectedRecord}
                    />
                  </section>
                ) : (
                  <EmptyState>
                    Select an entry to inspect its metadata, or choose Preview table to browse a
                    Parquet asset.
                  </EmptyState>
                )}
              </PreviewPane>
            </Workspace>
          </>
        ) : (
          <EmptyState>No catalog source configured.</EmptyState>
        )}
      </Panel>
    </ReactExamplePanel>
  );
}

/** Parses a comma-separated four-coordinate bounding box. */
function parseBounds(value: string): readonly [number, number, number, number] | undefined {
  const values = value.split(',').map(part => Number(part.trim()));
  return values.length === 4 && values.every(Number.isFinite)
    ? [values[0], values[1], values[2], values[3]]
    : undefined;
}

/** Narrows an unknown catalog value to an object record. */
function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : undefined;
}
/** Returns a stable display key for a catalog record. */
function recordKey(value: unknown): string {
  return String(asRecord(value)?.id || asRecord(value)?.title || 'record');
}
/** Returns the best available human-readable title for a catalog record. */
function recordTitle(value: unknown): string {
  const record = asRecord(value);
  const properties = asRecord(record?.properties);
  return String(record?.title || properties?.title || record?.id || 'Untitled record');
}
/** Returns a compact secondary description for a catalog record. */
function recordSummary(value: unknown): string {
  const record = asRecord(value);
  const properties = asRecord(record?.properties);
  return String(
    record?.description ||
      properties?.description ||
      record?.collection ||
      record?.datetime ||
      properties?.datetime ||
      ''
  );
}
/** Renders browser-downloadable assets, resolving them through protocol-specific helpers. */
function recordAssets(
  value: unknown,
  source?: CatalogAssetSource,
  onSelectAsset?: CatalogExplorerPanelProps['onSelectAsset']
): React.JSX.Element | null {
  const resolvedAssets = source?.getAssets
    ? source.getAssets(value).map(asset => [asset.key, asset] as const)
    : undefined;
  const assets = asRecord(asRecord(value)?.assets);
  const links =
    resolvedAssets ||
    (assets
      ? Object.entries(assets)
          .filter(([, asset]) => asRecord(asset)?.href)
          .map(([name, asset]) => [name, asset] as const)
      : []);
  return links.length ? (
    <AssetList>
      {links.map(([name, asset]) => {
        const assetUrl = getCatalogAssetUrl(String(asRecord(asset)?.href));
        if (!assetUrl) return <span key={name}>{name} (unsupported URL)</span>;
        return (
          <a
            key={name}
            href={assetUrl.href}
            target="_blank"
            rel="noreferrer"
            onClick={event => {
              event.stopPropagation();
              if (onSelectAsset) {
                event.preventDefault();
                onSelectAsset({key: name, href: assetUrl.href});
              }
            }}
          >
            {onSelectAsset && /\.parquet$/i.test(assetUrl.pathname)
              ? `Preview table: ${name}`
              : name}
          </a>
        );
      })}
    </AssetList>
  ) : null;
}
/** Lists the enabled protocol capabilities in a stable display order. */
function formatCapabilities(capabilities?: CatalogSourceCapabilities): string[] {
  if (!capabilities) return [];
  return Object.entries(capabilities)
    .filter(([, enabled]) => enabled)
    .map(([name]) => name);
}
/** Formats the most useful identity from source metadata. */
function formatMetadata(metadata: unknown): string {
  const record = asRecord(metadata);
  const root = asRecord(record?.root);
  return root
    ? `${String(root.title || root.id || 'Catalog')} · ${String(root.type || 'source')}`
    : metadata
      ? 'Metadata loaded'
      : 'Loading metadata…';
}

const Panel = styled.section`display:flex;flex-direction:column;gap:8px;height:clamp(300px,calc(100dvh - 340px),640px);min-height:0;`;
/** Holds independently scrolling entry and inspector panes within the viewport. */
const Workspace = styled.div`display:grid;grid-template-columns:minmax(180px,2fr) minmax(0,3fr);gap:14px;flex:1;min-height:0;@media(max-width:700px){grid-template-columns:minmax(120px,1fr) minmax(0,2fr);gap:8px;}`;
/** Allows the entries list to shrink without expanding the page. */
const EntriesPane = styled.div`display:flex;flex-direction:column;min-height:0;min-width:0;`;
/** Contains metadata and asset previews without moving the surrounding page. */
const PreviewPane = styled.div`min-height:0;min-width:0;overflow:auto;overscroll-behavior:contain;padding:0 8px;border-left:1px solid var(--ifm-color-emphasis-300);h3{font-size:1rem;margin:8px 0;}p{font-size:.8rem;margin:8px 0;}.deck-react-panel{margin:8px 0!important;padding:8px!important;}`;
const PanelHeader = styled.div`display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:10px;`;
const Hint = styled.span`color:var(--ifm-color-emphasis-700);font-size:.82rem;`;
const CapabilityRow = styled.div`display:flex;gap:8px;flex-wrap:wrap;align-items:center;color:var(--ifm-color-emphasis-700);font-size:.74rem;margin-bottom:8px;`;
const Badge = styled.span<{
  $active: boolean;
}>`border-radius:999px;padding:2px 8px;color:${({$active}) => ($active ? '#067647' : '#7a2e0e')};background:${({$active}) => ($active ? '#ecfdf3' : '#fff4ed')};font-weight:600;`;
const Metadata = styled.div`color:var(--ifm-color-emphasis-700);font-size:.82rem;margin-bottom:0;`;
const Controls = styled.form`display:flex;gap:10px;align-items:end;flex-wrap:wrap;`;
const Field = styled.div`display:flex;flex-direction:column;gap:4px;flex:1;min-width:140px;`;
const Label = styled.label`font-size:.78rem;font-weight:600;`;
const Input = styled.input`border:1px solid #d0d5dd;border-radius:5px;padding:7px;min-width:0;`;
const Select = styled.select`border:1px solid #d0d5dd;border-radius:5px;padding:7px;background:#fff;`;
const ApplyButton = styled.button`&&{border:0;border-radius:5px;padding:8px 12px;color:#fff;background:#475467;cursor:pointer;}&&:disabled{background:#98a2b3;cursor:not-allowed;}`;
const ErrorMessage = styled.div`color:#b42318;font-size:.82rem;margin-top:10px;`;
const ResultsHeader = styled.div`display:flex;justify-content:space-between;margin-top:0;padding-bottom:6px;border-bottom:1px solid #eaecf0;font-size:.82rem;color:var(--ifm-color-emphasis-700);`;
const ResultList = styled.div`display:flex;flex-direction:column;flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;`;
const ResultRow = styled.div`border-bottom:1px solid #eaecf0;padding:10px 2px;`;
const ResultTitle = styled.button`&&{text-align:left;border:0;background:transparent;padding:0;font:inherit;font-weight:600;color:var(--ifm-color-primary);cursor:pointer;}&&:hover{text-decoration:underline;}`;
const ResultSummary = styled.div`color:var(--ifm-color-emphasis-700);font-size:.78rem;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;`;
const Details = styled.div`margin-top:5px;font-size:.74rem;`;
const AssetList = styled.div`display:flex;gap:10px;flex-wrap:wrap;a{color:#175cd3;}`;
const EmptyState = styled.div`color:var(--ifm-color-emphasis-700);font-size:.84rem;padding:14px 0;`;

/** Aligns entry metadata labels and wraps long values on narrow screens. */
const RecordMetadata = styled.dl`display:grid;grid-template-columns:minmax(100px,1fr) minmax(0,3fr);gap:6px 12px;font-size:.82rem;dt{font-weight:600;overflow-wrap:anywhere;}dd{margin:0;overflow-wrap:anywhere;}`;
