import React, {useEffect, useId, useRef, useState} from 'react';
import styled from 'styled-components';
import type {CatalogSource, CatalogSourceCapabilities} from '@loaders.gl/core/loader-utils';
import {ReactExamplePanel, ReactExampleSidebar} from './example-panel-host';
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
  /** Identifies a host-requested preview such as the catalog JSON toolbar action. */
  previewAssetHref?: string;
  /** Returns from the asset preview to entry details. */
  onClosePreview?: () => void;
  /** Reports the loaded catalog title for a host navigation tab. */
  onCatalogTitle?: (title: string) => void;
  /** Optional heading. */
  title?: string;
}>;

type CatalogQuerySource = CatalogSource<unknown, Record<string, unknown>, unknown> & {
  traverse?: (query: Record<string, unknown>) => AsyncIterable<unknown>;
  getCollections?: (options: {
    signal: AbortSignal;
    maxDepth: number;
    maxRequests: number;
  }) => Promise<unknown[]>;
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
  previewAssetHref,
  onClosePreview,
  onCatalogTitle,
  title = 'Catalog explorer'
}: CatalogExplorerPanelProps): React.JSX.Element {
  const panelId = useId().replace(/:/g, '');
  const inspector = useRef<HTMLDivElement>(null);
  const [workspace, setWorkspace] = useState<HTMLElement | null>(null);
  const [workspaceHeight, setWorkspaceHeight] = useState<number>();
  useEffect(() => {
    const element = workspace;
    if (!element) return;
    /** Fits the workspace beneath the toolbar without adding page scroll. */
    const resizeWorkspace = () => {
      if (!element.getClientRects().length) return;
      setWorkspaceHeight(Math.max(240, window.innerHeight - (element.getBoundingClientRect().top + window.scrollY) - 24));
    };
    resizeWorkspace();
    const observer = new ResizeObserver(resizeWorkspace);
    observer.observe(element);
    window.addEventListener('resize', resizeWorkspace);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', resizeWorkspace);
    };
  }, [workspace]);
  const [selectedSourceId, setSelectedSourceId] = useState(sourceId || sources[0]?.id || '');
  const [query, setQuery] = useState<CatalogExplorerQuery>({limit: 25});
  const [submittedQuery, setSubmittedQuery] = useState<CatalogExplorerQuery>({limit: 25});
  const [metadata, setMetadata] = useState<unknown>();
  const [collections, setCollections] = useState<ReadonlyMap<string, unknown>>(() => new Map());
  const [selectedRecord, setSelectedRecord] = useState<unknown>();
  const [activeAssetHref, setActiveAssetHref] = useState<string>();
  const [records, setRecords] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const selectedSource = sources.find(source => source.id === selectedSourceId) || sources[0];
  const selectedSourceSource = selectedSource?.source;
  const capabilities = selectedSourceSource?.capabilities;

  useEffect(() => {
    const root = asRecord(asRecord(metadata)?.root);
    if (root) onCatalogTitle?.(String(root.title || root.id || 'Catalog'));
  }, [metadata, onCatalogTitle]);

  useEffect(() => {
    if (!selectedSourceSource) return;
    const abortController = new AbortController();
    setLoading(true);
    setError(undefined);
    setRecords([]);
    setSelectedRecord(undefined);
    setActiveAssetHref(undefined);
    setMetadata(undefined);
    setCollections(new Map());
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
        if (rootMetadata?.mode === 'static' && capabilities?.collections && source.getCollections) {
          try {
            const nextCollections = await source.getCollections({
              signal: abortController.signal,
              maxDepth: 1,
              maxRequests: 50
            });
            if (!abortController.signal.aborted)
              setCollections(
                new Map(
                  nextCollections.map(collection => [String(asRecord(collection)?.id), collection])
                )
              );
          } catch {
            // Collection labels are optional; keep successfully discovered Items usable.
          }
        }
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

  const previewAssets = onSelectAsset
    ? getRecordAssets(selectedRecord, selectedSourceSource).filter(asset =>
        /\.(parquet|json|txt|md|csv|xml|ya?ml|dat)$/i.test(new URL(asset.href).pathname)
      )
    : [];
  const tableAssetCount = previewAssets.filter(asset =>
    /\.parquet$/i.test(new URL(asset.href).pathname)
  ).length;
  const activeTabId = activeAssetHref
    ? `${panelId}-asset-${previewAssets.findIndex(asset => asset.href === activeAssetHref)}`
    : `${panelId}-details`;
  const inspectorOpen = selectedRecord !== undefined || Boolean(preview);
  const supportsSearch = capabilities?.search ?? false;
  return (
    <ReactExamplePanel title={title}>
      <Panel ref={setWorkspace} aria-label={title} style={{height: workspaceHeight}}>
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
              <EntriesPane $expanded={inspectorOpen}>
                <ResultsHeader>
                  <strong>Results</strong>
                  <span>
                    {records.length}
                    {records.length === query.limit ? '+' : ''}
                  </span>
                </ResultsHeader>
                <ResultList role="region" aria-label="Catalog entries" tabIndex={0}>
                  {records.map((record, index) => (
                    <ResultRow
                      key={`${recordKey(record)}-${index}`}
                      type="button"
                      aria-pressed={selectedRecord === record}
                      onClick={() => {
                        setSelectedRecord(record);
                        setActiveAssetHref(undefined);
                        onClosePreview?.();
                        onSelectRecord?.(record);
                      }}
                    >
                      <ResultTitle>{recordTitle(record, collections)}</ResultTitle>
                      <ResultSummary>{recordListSummary(record, collections)}</ResultSummary>
                      {recordKey(record) !== recordTitle(record, collections) ? (
                        <ResultIdentifier>{recordKey(record)}</ResultIdentifier>
                      ) : null}
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
              <ReactExampleSidebar
                open={inspectorOpen}
                onClose={() => {
                  setSelectedRecord(undefined);
                  setActiveAssetHref(undefined);
                  onClosePreview?.();
                }}
              >
                <PreviewPane
                  ref={inspector}
                  role="region"
                  aria-label="Catalog inspector"
                  tabIndex={0}
                >
                  {selectedRecord !== undefined &&
                  preview &&
                  previewAssetHref &&
                  previewAssetHref !== activeAssetHref ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveAssetHref(undefined);
                          onClosePreview?.();
                        }}
                      >
                        Back to entry details
                      </button>
                      {preview}
                    </>
                  ) : selectedRecord !== undefined ? (
                    <section aria-label="Catalog entry details">
                      <InspectorHeader>
                        <ResultsHeader>
                          <strong>{recordTitle(selectedRecord, collections)}</strong>
                          <button
                            type="button"
                            aria-label="Close catalog entry details"
                            onClick={() => {
                              setSelectedRecord(undefined);
                              setActiveAssetHref(undefined);
                              onClosePreview?.();
                            }}
                          >
                            Close
                          </button>
                        </ResultsHeader>
                        <InspectorTabs
                          role="tablist"
                          aria-label="Entry views"
                          onKeyDown={handleTabKeyDown}
                        >
                          <button
                            type="button"
                            role="tab"
                            id={`${panelId}-details`}
                            aria-controls={`${panelId}-entry-content`}
                            aria-selected={!activeAssetHref}
                            tabIndex={activeAssetHref ? -1 : 0}
                            onClick={() => {
                              setActiveAssetHref(undefined);
                              onClosePreview?.();
                            }}
                          >
                            Details
                          </button>
                          {previewAssets.map((asset, index) => (
                            <button
                              type="button"
                              role="tab"
                              key={asset.key}
                              id={`${panelId}-asset-${index}`}
                              aria-controls={`${panelId}-entry-content`}
                              aria-selected={activeAssetHref === asset.href}
                              tabIndex={activeAssetHref === asset.href ? 0 : -1}
                              onClick={() => {
                                setActiveAssetHref(asset.href);
                                onSelectAsset?.(asset);
                              }}
                            >
                              {assetTabTitle(asset, tableAssetCount)}
                            </button>
                          ))}
                        </InspectorTabs>
                      </InspectorHeader>
                      <div
                        role="tabpanel"
                        id={`${panelId}-entry-content`}
                        aria-labelledby={activeTabId}
                      >
                        {activeAssetHref && preview ? (
                          preview
                        ) : (
                          <>
                            <p>{recordSummary(selectedRecord, collections)}</p>
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
                            <details>
                              <summary>Asset files</summary>
                              {recordAssets(selectedRecord, selectedSourceSource)}
                            </details>
                            {getRecordCollection(selectedRecord, collections) ? (
                              <CatalogJsonTree
                                label="Collection metadata"
                                value={getRecordCollection(selectedRecord, collections)}
                              />
                            ) : null}
                            <CatalogJsonTree
                              key={recordKey(selectedRecord)}
                              label="Full entry JSON"
                              value={selectedRecord}
                            />
                          </>
                        )}
                      </div>
                    </section>
                  ) : preview ? (
                    <>
                      <button type="button" onClick={onClosePreview}>
                        Close preview
                      </button>
                      {preview}
                    </>
                  ) : (
                    <EmptyState>
                      Select an entry to inspect details, tables, manifests, and attribution.
                    </EmptyState>
                  )}
                </PreviewPane>
              </ReactExampleSidebar>
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
/** Looks up parent Collection metadata without modifying the source Item. */
function getRecordCollection(
  value: unknown,
  collections?: ReadonlyMap<string, unknown>
): Record<string, unknown> | undefined {
  const collectionId = asRecord(value)?.collection;
  return collectionId ? asRecord(collections?.get(String(collectionId))) : undefined;
}
/** Returns the best available human-readable title for a catalog record. */
function recordTitle(value: unknown, collections?: ReadonlyMap<string, unknown>): string {
  const record = asRecord(value);
  const properties = asRecord(record?.properties);
  const rawTitle = record?.title || properties?.title;
  const title = rawTitle ? omitLicensePrefix(String(rawTitle)).trim() : undefined;
  const collection = getRecordCollection(value, collections);
  const description = record?.description || properties?.description || collection?.description;
  if (title && title !== record?.id) return title;
  if (collection?.title) return omitLicensePrefix(String(collection.title));
  if (typeof description === 'string' && description.trim())
    return omitLicensePrefix(description.trim()).split(/\.\s+/)[0];
  return String(title || record?.id || 'Untitled record');
}
/** Returns a compact secondary description for a catalog record. */
function recordSummary(value: unknown, collections?: ReadonlyMap<string, unknown>): string {
  const record = asRecord(value);
  const properties = asRecord(record?.properties);
  return String(
    record?.description ||
      properties?.description ||
      getRecordCollection(value, collections)?.description ||
      record?.collection ||
      record?.datetime ||
      properties?.datetime ||
      ''
  );
}
/** Omits leading public-domain and Creative Commons labels from browsing text. */
function omitLicensePrefix(value: string): string {
  return value.replace(
    /^(?:public[- ]domain|CC(?:0|[- ]BY)(?:-(?:NC|ND|SA))*(?:[- ]\d+(?:\.\d+)*)?)(?:\s+|$)/i,
    ''
  );
}
/** Avoids repeating a description sentence already used as the entry heading. */
function recordListSummary(value: unknown, collections?: ReadonlyMap<string, unknown>): string {
  const summary = omitLicensePrefix(recordSummary(value, collections));
  const title = recordTitle(value, collections);
  return summary.startsWith(title) ? summary.slice(title.length).replace(/^[.\s]+/, '') : summary;
}

/** Returns resolved HTTP(S) assets for entry tabs and original-file links. */
function getRecordAssets(
  value: unknown,
  source?: CatalogAssetSource
): Array<{key: string; href: string}> {
  if (!value) return [];
  const assets = asRecord(asRecord(value)?.assets);
  const resolved = source?.getAssets
    ? source.getAssets(value)
    : assets
      ? Object.entries(assets).map(([key, asset]) => ({
          key,
          href: String(asRecord(asset)?.href || '')
        }))
      : [];
  return resolved.flatMap(asset => {
    const url = getCatalogAssetUrl(asset.href);
    return url ? [{key: asset.key, href: url.href}] : [];
  });
}

/** Labels familiar entry assets while distinguishing multiple table assets. */
function assetTabTitle(asset: {key: string; href: string}, tableAssetCount: number): string {
  if (/\.parquet$/i.test(new URL(asset.href).pathname))
    return tableAssetCount > 1 ? `Table: ${asset.key}` : 'Table';
  if (/manifest/i.test(asset.key)) return asset.key === 'manifest' ? 'Manifest' : asset.key;
  if (/attribution/i.test(asset.key)) return 'Attribution';
  return asset.key;
}

/** Supports arrow-key and Home/End navigation between entry view tabs. */
function handleTabKeyDown(event: React.KeyboardEvent<HTMLElement>): void {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const index = tabs.indexOf(event.target as HTMLButtonElement);
  const nextIndex =
    event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? tabs.length - 1
        : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
  event.preventDefault();
  tabs[nextIndex]?.focus();
  tabs[nextIndex]?.click();
}

/** Renders browser-downloadable assets, resolving them through protocol-specific helpers. */
function recordAssets(value: unknown, source?: CatalogAssetSource): React.JSX.Element | null {
  const assets = getRecordAssets(value, source);
  return assets.length ? (
    <AssetList>
      {assets.map(asset => (
        <a key={asset.key} href={asset.href} target="_blank" rel="noreferrer">
          {asset.key}
        </a>
      ))}
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
const Workspace = styled.div`position:relative;--catalog-inspector-width:min(65%,700px);display:flex;flex:1;min-height:0;min-width:0;`;
/** Gives the list all available space while the attached inspector is closed. */
const EntriesPane = styled.div<{
  $expanded: boolean;
}>`display:flex;flex-direction:column;min-height:0;min-width:0;width:${({$expanded}) => ($expanded ? 'calc(100% - var(--catalog-inspector-width) - 10px)' : '100%')};`;

/** Contains metadata and asset previews without moving the surrounding page. */
const PreviewPane = styled.div`height:100%;box-sizing:border-box;min-height:0;min-width:0;overflow:auto;overscroll-behavior:contain;padding:0 8px;border-left:1px solid var(--ifm-color-emphasis-300);h3{font-size:1rem;margin:8px 0;}p{font-size:.8rem;margin:8px 0;}.deck-react-panel{margin:8px 0!important;padding:8px!important;}`;
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
const ResultsHeader = styled.div`display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-top:0;padding-bottom:6px;border-bottom:1px solid #eaecf0;font-size:.82rem;color:var(--ifm-color-emphasis-700);`;
const ResultList = styled.div`display:flex;flex-direction:column;flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;`;
const ResultRow = styled.button`&&{display:block;text-align:left;width:100%;min-width:0;flex-shrink:0;border:0;border-bottom:1px solid var(--ifm-color-emphasis-300);border-left:3px solid transparent;background:transparent;color:inherit;padding:12px 8px;cursor:pointer;}&&[aria-pressed="true"]{border-left-color:var(--ifm-color-primary);background:var(--ifm-color-emphasis-100);}&&:hover{background:var(--ifm-color-emphasis-100);}`;
const ResultTitle = styled.span`display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-size:.86rem;font-weight:600;color:var(--ifm-color-primary);`;
const ResultSummary = styled.span`display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;color:var(--ifm-color-emphasis-700);font-size:.78rem;margin-top:4px;`;
/** Keeps technical identifiers secondary to descriptive entry labels. */
const ResultIdentifier = styled.span`display:block;font-size:.7rem;opacity:.65;margin-top:5px;overflow-wrap:anywhere;`;
/** Keeps entry navigation visible while its content scrolls. */
const InspectorHeader = styled.div`position:sticky;top:0;z-index:1;background:var(--menu-background,var(--ifm-background-color));padding-bottom:8px;`;
/** Presents a keyboard-accessible view selector inside the entry infobox. */
const InspectorTabs = styled.div`display:flex;gap:5px;overflow-x:auto;padding-top:8px;button{flex-shrink:0;border:1px solid var(--ifm-color-emphasis-300);border-radius:5px;padding:5px 8px;font-size:.75rem;background:transparent;color:inherit;cursor:pointer;}button[aria-selected="true"]{border-color:var(--ifm-color-primary);color:var(--ifm-color-primary);background:var(--ifm-color-emphasis-100);}`;
const AssetList = styled.div`display:flex;gap:10px;flex-wrap:wrap;a{color:#175cd3;}`;
const EmptyState = styled.div`color:var(--ifm-color-emphasis-700);font-size:.84rem;padding:14px 0;`;

/** Aligns entry metadata labels and wraps long values on narrow screens. */
const RecordMetadata = styled.dl`display:grid;grid-template-columns:minmax(100px,1fr) minmax(0,3fr);gap:6px 12px;font-size:.82rem;dt{font-weight:600;overflow-wrap:anywhere;}dd{margin:0;overflow-wrap:anywhere;}`;
