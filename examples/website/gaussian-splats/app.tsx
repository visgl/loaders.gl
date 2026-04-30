// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import DeckGL from '@deck.gl/react';
import {COORDINATE_SYSTEM, OrbitView, type OrbitViewState} from '@deck.gl/core';
import {webgpuAdapter} from '@luma.gl/webgpu';
import {load} from '@loaders.gl/core';
import {SplatLayer} from '@loaders.gl/deck-layers';
import {PLYLoader} from '@loaders.gl/ply';
import type {MeshArrowTable} from '@loaders.gl/schema';
import {ExampleUrlInputCard, type UrlOption} from '../shared/url-input-card';
import type {Example} from '../pointcloud/examples';
import {DEFAULT_GAUSSIAN_SPLAT_EXAMPLE_NAME, GAUSSIAN_SPLAT_EXAMPLES} from './examples';

const PREVIEW_ROW_COUNT = 8;
const PREVIEW_COLUMN_COUNT = 8;
const GAUSSIAN_SPLAT_FORMAT = 'Gaussian Splat';

const INITIAL_VIEW_STATE = {
  target: [0, 0, 0],
  rotationX: 12,
  rotationOrbit: 0,
  fov: 48,
  minZoom: -4,
  maxZoom: 8,
  zoom: 1.4
} as OrbitViewState;

type GaussianSplatsAppState = {
  /** Loaded Arrow table wrapper. */
  table: MeshArrowTable | null;
  /** Current deck.gl orbit view state. */
  viewState: OrbitViewState;
  /** Selected source URL shown in the URL picker. */
  selectedUrl: string;
  /** Whether source URLs are currently loading. */
  isLoading: boolean;
  /** Last successful load duration. */
  loadTimeMs?: number;
  /** Last load or render setup error. */
  error?: string | null;
};

/** Gaussian splats website example rendered through a WebGPU deck.gl canvas. */
export default function GaussianSplatsApp() {
  const loadRequestIndexRef = useRef(0);
  const defaultExample = GAUSSIAN_SPLAT_EXAMPLES[DEFAULT_GAUSSIAN_SPLAT_EXAMPLE_NAME];
  const [state, setState] = useState<GaussianSplatsAppState>({
    table: null,
    viewState: INITIAL_VIEW_STATE,
    selectedUrl: defaultExample.url,
    isLoading: false,
    error: null
  });

  const loadGaussianSplats = useCallback(async (sourceUrls: string[]): Promise<void> => {
    const loadRequestIndex = ++loadRequestIndexRef.current;
    const loadStartMs = Date.now();
    setState((currentState) => ({
      ...currentState,
      table: null,
      isLoading: true,
      loadTimeMs: undefined,
      error: null
    }));

    try {
      if (sourceUrls.length === 0) {
        throw new Error('Enter at least one Gaussian splat PLY URL.');
      }

      const tables = await Promise.all(
        sourceUrls.map((sourceUrl) =>
          load(sourceUrl, PLYLoader, {
            worker: false,
            ply: {shape: 'arrow-table'}
          })
        )
      );
      if (loadRequestIndex !== loadRequestIndexRef.current) {
        return;
      }

      const table = combineMeshArrowTables(tables as MeshArrowTable[]);
      setState((currentState) => ({
        ...currentState,
        table,
        isLoading: false,
        loadTimeMs: Date.now() - loadStartMs,
        error: null
      }));
    } catch (error) {
      if (loadRequestIndex === loadRequestIndexRef.current) {
        setState((currentState) => ({
          ...currentState,
          table: null,
          isLoading: false,
          error: error instanceof Error ? error.message : String(error)
        }));
      }
    }
  }, []);

  useEffect(() => {
    void loadGaussianSplats(getExampleUrls(defaultExample));

    return () => {
      loadRequestIndexRef.current++;
    };
  }, [defaultExample, loadGaussianSplats]);

  const arrowPreview = useMemo(() => getArrowTablePreview(state.table), [state.table]);
  const urlOptions = useMemo(() => getGaussianSplatUrlOptions(), []);

  const layers = useMemo(
    () =>
      state.table
        ? [
            new SplatLayer({
              id: 'gaussian-splats-webgpu',
              coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
              data: state.table,
              pickable: false,
              opacity: 0.82,
              radiusScale: 1.35,
              radiusMinPixels: 0.5,
              radiusMaxPixels: 34,
              renderMode: 'gpu',
              sortMode: 'global'
            })
          ]
        : [],
    [state.table]
  );

  return (
    <div style={styles.page}>
      <div style={styles.controls}>
        <ExampleUrlInputCard<Example>
          format={GAUSSIAN_SPLAT_FORMAT}
          selectedUrl={state.selectedUrl}
          urlOptions={urlOptions}
          onExampleSelect={(urlOption) => {
            const example = urlOption.example;
            setState((currentState) => ({...currentState, selectedUrl: urlOption.url}));
            void loadGaussianSplats(example ? getExampleUrls(example) : [urlOption.url]);
          }}
          onUrlChange={(url) => {
            setState((currentState) => ({...currentState, selectedUrl: url}));
            void loadGaussianSplats([url]);
          }}
        />
      </div>
      <div style={styles.workspace}>
        <div style={styles.canvasCard}>
          <DeckGL
            layers={layers}
            views={new OrbitView({})}
            viewState={state.viewState}
            controller={{inertia: true}}
            deviceProps={{
              type: 'webgpu',
              adapters: [webgpuAdapter]
            }}
            onViewStateChange={({viewState}) =>
              setState((currentState) => ({
                ...currentState,
                viewState: viewState as OrbitViewState
              }))
            }
            parameters={{
              depthWriteEnabled: false,
              depthCompare: 'always'
            } as any}
          />
          <div style={styles.statusPanel}>
            <span>
              {state.table
                ? `${state.table.data.numRows.toLocaleString()} splats`
                : state.isLoading
                  ? 'Loading'
                  : 'No table'}
            </span>
            {state.loadTimeMs !== undefined && <span>{state.loadTimeMs.toLocaleString()} ms</span>}
            {state.error && <span>{state.error}</span>}
          </div>
        </div>
        <ArrowTableViewer preview={arrowPreview} />
      </div>
    </div>
  );
}

/** Combine multiple Mesh Arrow tables into one table wrapper. */
function combineMeshArrowTables(tables: MeshArrowTable[]): MeshArrowTable {
  const firstTable = tables[0];
  if (!firstTable) {
    throw new Error('No Gaussian splat tables loaded.');
  }

  return {
    ...firstTable,
    data: (firstTable.data as any).concat(...tables.slice(1).map((table) => table.data))
  };
}

type ArrowTablePreview = {
  /** Total row count. */
  rowCount: number;
  /** Field names and Arrow type strings. */
  columns: {name: string; type: string}[];
  /** Small row sample rendered by the viewer. */
  rows: string[][];
};

/** Return source URLs for a Gaussian splat example. */
function getExampleUrls(example: Example): string[] {
  return example.urls?.length ? example.urls : [example.url];
}

/** Return Gaussian splat URL options for the shared URL picker. */
function getGaussianSplatUrlOptions(): UrlOption<Example>[] {
  return Object.entries(GAUSSIAN_SPLAT_EXAMPLES).map(([exampleName, example]) => ({
    format: GAUSSIAN_SPLAT_FORMAT,
    example,
    group: 'Examples',
    label: exampleName,
    pointCount: example.pointCount,
    url: example.url
  }));
}

/** Build a compact schema and row preview from a Mesh Arrow table. */
function getArrowTablePreview(table: MeshArrowTable | null): ArrowTablePreview | null {
  if (!table) {
    return null;
  }

  const arrowTable = table.data;
  const fields = arrowTable.schema.fields.slice(0, PREVIEW_COLUMN_COUNT);
  const columns = fields.map((field) => ({name: field.name, type: String(field.type)}));
  const rows: string[][] = [];

  for (let rowIndex = 0; rowIndex < Math.min(PREVIEW_ROW_COUNT, arrowTable.numRows); rowIndex++) {
    rows.push(
      fields.map((field) => {
        const column = arrowTable.getChild(field.name);
        return formatArrowValue(column?.get(rowIndex));
      })
    );
  }

  return {rowCount: arrowTable.numRows, columns, rows};
}

/** Format one Arrow cell for compact display. */
function formatArrowValue(value: unknown): string {
  if (value == null) {
    return '';
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value.toPrecision(4) : String(value);
  }
  if (ArrayBuffer.isView(value) || Array.isArray(value)) {
    return `[${Array.from(value as ArrayLike<unknown>).map(formatArrowValue).join(', ')}]`;
  }
  return String(value);
}

/** Render a compact Arrow schema and sample row viewer. */
function ArrowTableViewer({preview}: {preview: ArrowTablePreview | null}) {
  if (!preview) {
    return (
      <aside style={styles.viewer}>
        <div style={styles.viewerTitle}>Arrow Table</div>
        <div style={styles.viewerEmpty}>No table loaded</div>
      </aside>
    );
  }

  return (
    <aside style={styles.viewer}>
      <div style={styles.viewerTitle}>Arrow Table</div>
      <div style={styles.viewerMeta}>
        {preview.rowCount.toLocaleString()} rows | {preview.columns.length} preview columns
      </div>
      <div style={styles.schemaList}>
        {preview.columns.map((column) => (
          <div key={column.name} style={styles.schemaRow}>
            <span style={styles.columnName}>{column.name}</span>
            <span style={styles.columnType}>{column.type}</span>
          </div>
        ))}
      </div>
      <div style={styles.tableScroller}>
        <table style={styles.table}>
          <thead>
            <tr>
              {preview.columns.map((column) => (
                <th key={column.name} style={styles.tableHeader}>
                  {column.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((value, columnIndex) => (
                  <td key={preview.columns[columnIndex]?.name || columnIndex} style={styles.tableCell}>
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </aside>
  );
}

const styles = {
  page: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    minHeight: 620,
    width: '100%',
    padding: 12,
    boxSizing: 'border-box',
    background: '#f8fafc'
  },
  controls: {
    width: '100%'
  },
  workspace: {
    display: 'flex',
    flex: '1 1 auto',
    gap: 12,
    minHeight: 0,
    alignItems: 'stretch',
    flexWrap: 'wrap'
  },
  canvasCard: {
    position: 'relative',
    flex: '1 1 560px',
    minHeight: 500,
    overflow: 'hidden',
    border: '1px solid rgba(148, 163, 184, 0.32)',
    borderRadius: 8,
    background: '#05070a'
  },
  statusPanel: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    padding: '7px 10px',
    borderRadius: 6,
    color: '#e5e7eb',
    background: 'rgba(2, 6, 23, 0.78)',
    fontSize: 12,
    lineHeight: '16px',
    pointerEvents: 'none'
  },
  viewer: {
    flex: '0 1 420px',
    minWidth: 320,
    maxHeight: 680,
    overflow: 'hidden',
    border: '1px solid #cbd5e1',
    borderRadius: 8,
    background: '#ffffff',
    color: '#0f172a',
    display: 'flex',
    flexDirection: 'column'
  },
  viewerTitle: {
    padding: '10px 12px 4px',
    fontSize: 14,
    fontWeight: 700
  },
  viewerMeta: {
    padding: '0 12px 8px',
    color: '#475569',
    fontSize: 12
  },
  viewerEmpty: {
    padding: 12,
    color: '#64748b',
    fontSize: 13
  },
  schemaList: {
    borderTop: '1px solid #e2e8f0',
    borderBottom: '1px solid #e2e8f0'
  },
  schemaRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(120px, 1fr) minmax(120px, 1fr)',
    gap: 8,
    padding: '5px 12px',
    fontSize: 12
  },
  columnName: {
    color: '#0f172a',
    fontFamily: 'Menlo, Consolas, monospace',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  columnType: {
    color: '#64748b',
    fontFamily: 'Menlo, Consolas, monospace',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  tableScroller: {
    overflow: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontFamily: 'Menlo, Consolas, monospace',
    fontSize: 11
  },
  tableHeader: {
    position: 'sticky',
    top: 0,
    padding: '6px 8px',
    borderBottom: '1px solid #e2e8f0',
    color: '#334155',
    background: '#f8fafc',
    textAlign: 'left'
  },
  tableCell: {
    maxWidth: 180,
    padding: '5px 8px',
    borderBottom: '1px solid #f1f5f9',
    color: '#0f172a',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  }
} as const;

/** Render the Gaussian splats example into a standalone DOM container. */
export function renderToDOM(container: HTMLDivElement) {
  createRoot(container).render(<GaussianSplatsApp />);
}
