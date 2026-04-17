// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type ReactNode, useEffect, useMemo, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';

import type {
  ImageTileSource,
  RangeRequestEvent,
  RangeStats,
  VectorTileSource
} from '@loaders.gl/loader-utils';
import {createRangeStats, getRangeStats} from '@loaders.gl/loader-utils';
import {createDataSource} from '@loaders.gl/core';
import {PMTilesSourceLoader} from '@loaders.gl/pmtiles';
import {MLTSourceLoader} from '@loaders.gl/mlt';
import {MVTSourceLoader, TableTileSourceLoader} from '@loaders.gl/mvt';
import {_GeoJSONLoader as GeoJSONLoader} from '@loaders.gl/json';

import DeckGL from '@deck.gl/react';
import {MapView} from '@deck.gl/core';
import {ColumnPanel, CustomPanel, SidebarWidget} from '@deck.gl-community/widgets';
import {Tile2DSourceLayer} from '@loaders.gl/deck-layers';

import {Map} from 'react-map-gl';
import maplibregl from 'maplibre-gl';

import type {Example} from './examples';
import {EXAMPLES, INITIAL_CATEGORY_NAME, INITIAL_EXAMPLE_NAME, INITIAL_MAP_STYLE} from './examples';
import '@deck.gl/widgets/stylesheet.css';

const TILE_SOURCE_FACTORIES = [
  PMTilesSourceLoader,
  TableTileSourceLoader,
  MVTSourceLoader,
  MLTSourceLoader
] as const;

const INITIAL_VIEW_STATE = {latitude: 47.65, longitude: 7, zoom: 2, maxZoom: 20};

type AppProps = {
  format?: string;
  hideChrome?: boolean;
  showTileBorders?: boolean;
  onTilesLoad?: Function;
  children?: ReactNode;
};

type AppState = {
  tileSource: VectorTileSource | ImageTileSource | null;
  metadata: string | null;
  viewState: Record<string, unknown>;
  error: string | null;
  selectedCategoryName?: string | null;
  selectedExampleName?: string | null;
};

export default function App(props: AppProps = {}) {
  const rangeStatsObjectRef = useRef(createRangeStats('pmtiles-example-range-transport'));
  const [rangeStats, setRangeStats] = useState<RangeStats>(
    getRangeStats(rangeStatsObjectRef.current)
  );
  const [hideBasemap, setHideBasemap] = useState(false);
  const [currentExample, setCurrentExample] = useState<Example | null>(null);
  const availableExamples = useMemo(
    () => getExamplesForFormat(EXAMPLES, props.format),
    [props.format]
  );
  const [state, setState] = useState<AppState>({
    tileSource: null,
    metadata: null,
    viewState: INITIAL_VIEW_STATE,
    error: null,
    selectedCategoryName: null,
    selectedExampleName: null
  });

  useEffect(() => {
    const initialCategoryName = props.format || INITIAL_CATEGORY_NAME;
    const initialExamples = availableExamples[initialCategoryName];
    if (!initialExamples) {
      return;
    }

    const initialExampleName = props.format ? Object.keys(initialExamples)[0] : INITIAL_EXAMPLE_NAME;
    const initialExample = initialExamples[initialExampleName];
    if (!initialExample) {
      return;
    }

    void onExampleChange({
      categoryName: initialCategoryName,
      exampleName: initialExampleName,
      example: initialExample
    });
  }, [availableExamples, props.format]);

  const sourceOptions = useMemo(
    () =>
      currentExample
        ? {
            core: {
              type: currentExample.sourceType,
              attributions: currentExample.attributions,
              loaders: [GeoJSONLoader],
              loadOptions: {
                tilejson: {maxValues: 10}
              }
            },
            pmtiles: {},
            rangeRequests: {
              batchDelayMs: 50,
              stats: rangeStatsObjectRef.current,
              onEvent: onTileRangeRequest
            },
            table: {
              generateId: true
            },
            mvt: {},
            mlt: {}
          }
        : null,
    [currentExample]
  );

  const tileLayer =
    currentExample &&
    sourceOptions &&
    new Tile2DSourceLayer({
      data: currentExample.data,
      sources: TILE_SOURCE_FACTORIES,
      sourceOptions,
      showTileBorders: props.showTileBorders ?? true,
      metadata: state.metadata as any,
      onTileError: onTileLoadError,
      onTilesLoad: props.onTilesLoad as any,
      pickable: true,
      autoHighlight: true
    });

  const widgets = useMemo(() => {
    if (props.hideChrome) {
      return [];
    }

    return [
      new SidebarWidget({
        id: 'tiles-example-sidebar',
        placement: 'top-right',
        side: 'right',
        widthPx: 420,
        panel: new ColumnPanel({
          id: 'tiles-example-panel',
          title: '',
          panels: {
            controls: new CustomPanel({
              id: 'tiles-example-controls',
              title: '',
              onRenderHTML: (rootElement) =>
                renderTilesSidebar(rootElement, {
                  currentExample,
                  error: state.error,
                  examples: availableExamples,
                  hideBasemap,
                  metadata: state.metadata,
                  rangeStats,
                  selectedCategoryName: state.selectedCategoryName,
                  selectedExampleName: state.selectedExampleName,
                  onExampleChange: ({categoryName, exampleName}) => {
                    const example = availableExamples[categoryName]?.[exampleName];
                    if (example) {
                      void onExampleChange({categoryName, exampleName, example});
                    }
                  },
                  onHideBasemapChange: setHideBasemap
                })
            })
          }
        })
      })
    ];
  }, [
    availableExamples,
    currentExample,
    hideBasemap,
    props.hideChrome,
    rangeStats,
    state.error,
    state.metadata,
    state.selectedCategoryName,
    state.selectedExampleName
  ]);

  return (
    <div style={{position: 'relative', height: '100%'}}>
      <DeckGL
        layers={[tileLayer]}
        views={new MapView({repeat: true})}
        viewState={state.viewState as any}
        controller={true}
        getTooltip={getTooltip as any}
        widgets={widgets}
        onViewStateChange={({viewState}) =>
          setState((currentState) => ({
            ...currentState,
            viewState: viewState as Record<string, unknown>
          }))
        }
      >
        {!hideBasemap && <Map mapLib={maplibregl} mapStyle={INITIAL_MAP_STYLE} />}
        {!props.hideChrome && <Attributions attributions={currentExample?.attributions} />}
      </DeckGL>
    </div>
  );

  async function onExampleChange(args: {
    categoryName: string;
    exampleName: string;
    example: Example;
  }) {
    const {categoryName, exampleName, example} = args;
    const url = example.data;

    try {
      rangeStatsObjectRef.current = createRangeStats('pmtiles-example-range-transport');
      setRangeStats(getRangeStats(rangeStatsObjectRef.current));
      setCurrentExample(example);

      const tileSource = createTileSource(example, rangeStatsObjectRef.current, onTileRangeRequest);

      setState((currentState) => ({
        ...currentState,
        tileSource,
        metadata: null,
        error: null,
        selectedCategoryName: categoryName,
        selectedExampleName: exampleName
      }));

      void tileSource
        .getMetadata()
        .then((metadata) => {
          const initialViewState = adjustViewStateToMetadata(
            {...state.viewState, ...example.viewState},
            metadata
          );

          setState((currentState) => ({
            ...currentState,
            viewState: initialViewState,
            error: null,
            metadata: metadata ? JSON.stringify(metadata, null, 2) : '',
            selectedCategoryName: categoryName,
            selectedExampleName: exampleName
          }));
        })
        .catch((error) => {
          console.error('Failed to load metadata', url, error);
          setState((currentState) => ({
            ...currentState,
            metadata: null,
            error: `Could not load metadata for ${exampleName}: ${getErrorMessage(error)}`,
            selectedCategoryName: categoryName,
            selectedExampleName: exampleName
          }));
        });
    } catch (error) {
      console.error('Failed to load data', url, error);
      setState((currentState) => ({
        ...currentState,
        error: `Could not load ${exampleName}: ${getErrorMessage(error)}`,
        selectedCategoryName: categoryName,
        selectedExampleName: exampleName
      }));
    }
  }

  function onTileLoadError(error: unknown, tileParameters?: unknown): void {
    console.error('Failed to load tile', tileParameters, error);
    setState((currentState) => ({
      ...currentState,
      error: `Could not load one or more tiles: ${getErrorMessage(error)}`
    }));
  }

  function onTileRangeRequest(event: RangeRequestEvent): void {
    if (
      event.type === 'batch' ||
      event.type === 'response' ||
      event.type === 'error' ||
      event.type === 'abort'
    ) {
      setRangeStats(getRangeStats(rangeStatsObjectRef.current));
    }
  }
}

function renderTilesSidebar(
  rootElement: HTMLElement,
  options: {
    currentExample: Example | null;
    error: string | null;
    examples: Record<string, Record<string, Example>>;
    hideBasemap: boolean;
    metadata: string | null;
    rangeStats: RangeStats;
    selectedCategoryName?: string | null;
    selectedExampleName?: string | null;
    onExampleChange: (selection: {categoryName: string; exampleName: string}) => void;
    onHideBasemapChange: (value: boolean) => void;
  }
): void {
  rootElement.replaceChildren();
  rootElement.style.display = 'flex';
  rootElement.style.flexDirection = 'column';
  rootElement.style.gap = '12px';
  rootElement.style.padding = '4px 0 0';

  rootElement.appendChild(
    createExampleSelect({
      examples: options.examples,
      selectedCategoryName: options.selectedCategoryName,
      selectedExampleName: options.selectedExampleName,
      onExampleChange: options.onExampleChange
    })
  );
  rootElement.appendChild(createCheckboxRow('Hide basemap', options.hideBasemap, options.onHideBasemapChange));

  if (options.error) {
    rootElement.appendChild(createNotice(options.error, '#b91c1c', '#fee2e2'));
  }

  if (options.currentExample?.localRangeServer) {
    rootElement.appendChild(
      createPreBlock('Run this command from the loaders.gl repository root:\nyarn serve-range --root ./modules/pmtiles/test/data/pmtiles-v3 --port 9000')
    );
  }

  if (options.rangeStats.logicalRanges > 0) {
    rootElement.appendChild(createRangeStatsTable(options.rangeStats));
  }

  rootElement.appendChild(createPreBlock(options.metadata ?? 'No metadata available'));
}

function createExampleSelect(options: {
  examples: Record<string, Record<string, Example>>;
  selectedCategoryName?: string | null;
  selectedExampleName?: string | null;
  onExampleChange: (selection: {categoryName: string; exampleName: string}) => void;
}): HTMLElement {
  const section = createSection();
  const selectElement = document.createElement('select');
  selectElement.style.width = '100%';
  selectElement.style.padding = '8px';
  selectElement.style.border = '1px solid rgba(148, 163, 184, 0.55)';
  selectElement.style.borderRadius = '8px';
  selectElement.style.background = 'var(--menu-background, #fff)';
  selectElement.value = `${options.selectedCategoryName}.${options.selectedExampleName}`;
  selectElement.addEventListener('change', (event) => {
    const [categoryName, exampleName] = (event.target as HTMLSelectElement).value.split('.');
    options.onExampleChange({categoryName, exampleName});
  });

  for (const categoryName of Object.keys(options.examples)) {
    const optGroupElement = document.createElement('optgroup');
    optGroupElement.label = categoryName;

    for (const exampleName of Object.keys(options.examples[categoryName])) {
      const optionElement = document.createElement('option');
      optionElement.value = `${categoryName}.${exampleName}`;
      optionElement.textContent = `${exampleName} (${categoryName})`;
      optGroupElement.appendChild(optionElement);
    }

    selectElement.appendChild(optGroupElement);
  }

  section.appendChild(selectElement);
  return section;
}

function createCheckboxRow(
  label: string,
  checked: boolean,
  onChange: (value: boolean) => void
): HTMLElement {
  const labelElement = document.createElement('label');
  labelElement.style.display = 'flex';
  labelElement.style.alignItems = 'center';
  labelElement.style.gap = '8px';
  labelElement.style.lineHeight = '1.4';

  const inputElement = document.createElement('input');
  inputElement.type = 'checkbox';
  inputElement.checked = checked;
  inputElement.addEventListener('change', (event) => {
    onChange((event.target as HTMLInputElement).checked);
  });

  const textElement = document.createElement('span');
  textElement.textContent = label;

  labelElement.append(inputElement, textElement);
  return labelElement;
}

function createRangeStatsTable(rangeStats: RangeStats): HTMLElement {
  const section = createSection();
  const tableElement = document.createElement('table');
  tableElement.style.borderCollapse = 'collapse';
  tableElement.style.width = '100%';

  const rows = [
    ['Ranges', `${rangeStats.logicalRanges} logical -> ${rangeStats.completedTransportRanges}/${rangeStats.transportRanges} HTTP`],
    ['Batches', String(rangeStats.rangeBatches)],
    ['Coalesced', String(rangeStats.coalescedRanges)],
    ['Requested', formatBytes(rangeStats.requestedBytes)],
    ['Transport', formatBytes(rangeStats.transportBytes)],
    ['Received', formatBytes(rangeStats.responseBytes)],
    ['Overfetch', formatBytes(rangeStats.overfetchBytes)],
    ['Failures', String(rangeStats.failedTransportRanges)],
    ['Aborted', String(rangeStats.abortedLogicalRanges)],
    ['Full-file fallback', String(rangeStats.fullResponseFallbacks)]
  ];

  for (const [label, value] of rows) {
    const rowElement = document.createElement('tr');
    const labelElement = document.createElement('th');
    labelElement.textContent = label;
    labelElement.style.fontWeight = '400';
    labelElement.style.paddingRight = '8px';
    labelElement.style.textAlign = 'left';
    labelElement.style.whiteSpace = 'nowrap';

    const valueElement = document.createElement('td');
    valueElement.textContent = value;
    valueElement.style.fontFamily = 'monospace';
    valueElement.style.textAlign = 'right';

    rowElement.append(labelElement, valueElement);
    tableElement.appendChild(rowElement);
  }

  section.appendChild(tableElement);
  return section;
}

function createNotice(message: string, color: string, background: string): HTMLElement {
  const element = document.createElement('div');
  element.textContent = message;
  element.style.background = background;
  element.style.color = color;
  element.style.lineHeight = '1.4';
  element.style.padding = '8px';
  element.style.whiteSpace = 'pre-wrap';
  element.style.borderRadius = '8px';
  return element;
}

function createPreBlock(content: string): HTMLElement {
  const preElement = document.createElement('pre');
  preElement.textContent = content;
  preElement.style.margin = '0';
  preElement.style.maxHeight = '320px';
  preElement.style.overflow = 'auto';
  preElement.style.padding = '12px';
  preElement.style.borderRadius = '8px';
  preElement.style.background = '#0f172a';
  preElement.style.color = '#e2e8f0';
  preElement.style.fontSize = '12px';
  preElement.style.lineHeight = '1.4';
  preElement.style.whiteSpace = 'pre-wrap';
  return preElement;
}

function createSection(): HTMLElement {
  const section = document.createElement('section');
  section.style.display = 'flex';
  section.style.flexDirection = 'column';
  section.style.gap = '4px';
  return section;
}

function Attributions(props: {attributions?: string[]}) {
  return (
    <div
      style={{
        position: 'absolute',
        right: 0,
        bottom: 0,
        backgroundColor: 'hsla(0,0%,100%,.5)',
        padding: '0 5px',
        font: '12px/20px Helvetica Neue,Arial,Helvetica,sans-serif'
      }}
    >
      {props.attributions?.map((attribution) => <div key={attribution}>{attribution}</div>)}
    </div>
  );
}

function getTooltip(info: {tile?: {index: {x: number; y: number; z: number}}}) {
  if (info.tile) {
    const {x, y, z} = info.tile.index;
    return `tile: x: ${x}, y: ${y}, z: ${z}`;
  }
  return null;
}

export function renderToDOM(container: HTMLElement) {
  createRoot(container).render(<App />);
}

function createTileSource(
  example: Example,
  rangeStatsObject: ReturnType<typeof createRangeStats>,
  onTileRangeRequest: (event: RangeRequestEvent) => void
): VectorTileSource | ImageTileSource {
  return createDataSource(
    example.data,
    [PMTilesSourceLoader, TableTileSourceLoader, MVTSourceLoader, MLTSourceLoader],
    {
      core: {
        type: example.sourceType,
        attributions: example.attributions,
        loaders: [GeoJSONLoader],
        loadOptions: {
          tilejson: {maxValues: 10}
        }
      },
      pmtiles: {},
      rangeRequests: {
        batchDelayMs: 50,
        stats: rangeStatsObject,
        onEvent: onTileRangeRequest
      },
      table: {
        generateId: true
      },
      mvt: {},
      mlt: {}
    }
  ) as VectorTileSource | ImageTileSource;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KiB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} MiB`;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function getExamplesForFormat(
  examples: Record<string, Record<string, Example>>,
  format?: string
): Record<string, Record<string, Example>> {
  if (format) {
    return {[format]: examples[format]};
  }
  return {...examples};
}

function adjustViewStateToMetadata(
  viewState: Record<string, unknown>,
  metadata: Record<string, any>
): Record<string, unknown> {
  if (!metadata) {
    return viewState;
  }

  const nextViewState = {...viewState};

  if (typeof metadata.minZoom === 'number' && typeof nextViewState.zoom === 'number' && metadata.minZoom < nextViewState.zoom) {
    nextViewState.zoom = Math.max(metadata.minZoom, 1.2);
  }
  if (typeof metadata.minZoom === 'number' && typeof nextViewState.zoom === 'number' && metadata.minZoom > nextViewState.zoom) {
    nextViewState.zoom = metadata.maxZoom;
  }
  if (typeof metadata.center?.[0] === 'number' && typeof metadata.center?.[1] === 'number') {
    nextViewState.longitude = metadata.center[0];
    nextViewState.latitude = metadata.center[1];
  }

  return nextViewState;
}
