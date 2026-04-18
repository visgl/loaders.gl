// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import React, {useEffect, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import styled from 'styled-components';

import {Map} from 'react-map-gl';
import maplibregl from 'maplibre-gl';

import {DeckGL} from '@deck.gl/react';
import {MapController} from '@deck.gl/core';
import {GeoJsonLayer} from '@deck.gl/layers';

import {ExamplePanel, MetadataViewer} from './components/example-panel';
// import {FileUploader} from './components/file-uploader';

import type {Example} from './examples';
import {INITIAL_LOADER_NAME, INITIAL_EXAMPLE_NAME, EXAMPLES} from './examples';

import {Table, GeoJSON} from '@loaders.gl/schema';
import {load, LoaderOptions} from '@loaders.gl/core';
import {GeoArrowLoader} from '@loaders.gl/arrow';
import {GeoParquetLoader, preloadCompressions} from '@loaders.gl/parquet';
import {FlatGeobufLoader} from '@loaders.gl/flatgeobuf';
import {ShapefileLoader} from '@loaders.gl/shapefile';
import {KMLLoader, GPXLoader, TCXLoader} from '@loaders.gl/kml';
import {_GeoJSONLoader as GeoJSONLoader} from '@loaders.gl/json';
import {GeoPackageLoader} from '@loaders.gl/geopackage';

// Needed for ParquetLoader zstd support
import {ZstdCodec} from 'zstd-codec';

export const INITIAL_MAP_STYLE =
  'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json';

const LOADERS = [
  GeoArrowLoader,
  GeoParquetLoader,
  FlatGeobufLoader,
  GeoPackageLoader,
  ShapefileLoader,
  KMLLoader,
  GPXLoader,
  TCXLoader,
  GeoJSONLoader
] as const;

const LOADER_OPTIONS = {
  core: {
    worker: false,
    limit: 1800000
  },
  modules: {
    'zstd-codec': ZstdCodec
  },
  gis: {
    reproject: true,
    _targetCrs: 'WGS84'
  },
  parquet: {
    shape: 'geojson-table',
    preserveBinary: true
  },
  arrow: {
    shape: 'geojson-table'
  },
  geopackage: {
    shape: 'geojson-table',
    sqlJsCDN: 'https://cdn.jsdelivr.net/npm/sql.js@1.14.1/dist/'
    // table: 'FEATURESriversds'
  },
  shapefile: {
    shape: 'geojson-table'
  },
  kml: {
    shape: 'geojson-table'
  },
  gpx: {
    shape: 'geojson-table'
  },
  tcx: {
    shape: 'geojson-table'
  }
} as const satisfies LoaderOptions;

const VIEW_STATE = {
  height: 600,
  width: 800,
  pitch: 45,
  maxPitch: 60,
  bearing: 0,
  minZoom: 1,
  maxZoom: 30,
  zoom: 11
};

export const INITIAL_VIEW_STATE = {
  latitude: 49.254,
  longitude: -123.13,
  zoom: 11,
  maxZoom: 16,
  pitch: 45,
  bearing: 0
};

type AppProps = {
  /** Controls which examples are shown */
  format?: string;
  /** Whether to hide the example controls, metadata, and descriptive overlay. */
  hideChrome?: boolean;
  /** Any informational text to display in the overlay */
  children?: React.Children;
};

type AppState = {
  // EXAMPLE STATE
  table: Table | null;
  layerProps?: Record<string, unknown>;
  getTooltipData?: Function; // (object: Properties) => {title: string; properties: Record<string, unknown>};
  selectedCategoryName?: string | null;
  selectedExampleName?: string | null;
  selectedExample?: Example | null;
  error?: string | null;
  loading?: boolean;
  loadDurationSeconds?: number | null;
  displayedParquetImplementation?: 'wasm' | 'js' | null;
  // CURRENT VIEW POINT / CAMERA POSITION
  viewState: Record<string, number>;
};

const SidebarSection = styled.div`
  margin: 0 0 0.75rem;
`;

const SidebarLabel = styled.label`
  display: block;
  margin: 0 0 0.25rem;
  font-weight: 600;
`;

const SidebarSelect = styled.select`
  width: 100%;
  margin: 0 0 0.25rem;
`;

const SidebarHint = styled.div`
  color: #555;
  font-size: 12px;
  line-height: 1.4;
`;

const LoadStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.75rem;
  color: #555;
  font-size: 12px;
  line-height: 1.4;
`;

const Spinner = styled.div`
  width: 12px;
  height: 12px;
  border: 2px solid #bbb;
  border-top-color: #222;
  border-radius: 50%;
  animation: geospatial-loader-spin 0.8s linear infinite;

  @keyframes geospatial-loader-spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

/**
 * A Geospatial table map viewer
 */
export default function App(props: AppProps = {}) {
  const [parquetImplementation, setParquetImplementation] = useState<'wasm' | 'js'>('js');
  const previousParquetImplementation = useRef(parquetImplementation);
  const loadRequestIdRef = useRef(0);
  const [state, setState] = useState<AppState>({
    table: null,
    viewState: INITIAL_VIEW_STATE,
    selectedExample: null,
    selectedCategoryName: null,
    selectedExampleName: null,
    error: null,
    loading: false,
    loadDurationSeconds: null,
    displayedParquetImplementation: null
  });

  useEffect(() => {
    const implementationChanged = previousParquetImplementation.current !== parquetImplementation;
    previousParquetImplementation.current = parquetImplementation;

    if (
      !implementationChanged ||
      state.selectedCategoryName !== 'GeoParquet' ||
      !state.selectedExample ||
      !state.selectedExampleName
    ) {
      return;
    }

    void loadExample(
      state.selectedCategoryName,
      state.selectedExampleName,
      state.selectedExample,
      parquetImplementation
    );
  }, [
    parquetImplementation,
    state.selectedCategoryName,
    state.selectedExample,
    state.selectedExampleName
  ]);

  return (
    <div style={{position: 'relative', height: '100%'}}>
      <ExamplePanel
        examples={EXAMPLES}
        initialCategoryName={INITIAL_LOADER_NAME}
        initialExampleName={INITIAL_EXAMPLE_NAME}
        format={props.format}
        hideChrome={props.hideChrome}
        onExampleChange={onExampleChange}
      >
        {props.children}
        <LoadStatus>
          {state.loading ? <Spinner aria-hidden="true" /> : null}
          <span>
            {state.loading
              ? 'Loading...'
              : state.loadDurationSeconds !== null
                ? `Loaded in ${state.loadDurationSeconds.toFixed(2)} s`
                : ''}
          </span>
        </LoadStatus>
        {state.selectedCategoryName === 'GeoParquet' ? (
          <SidebarSection>
            <SidebarLabel htmlFor="parquet-implementation">GeoParquetLoader options</SidebarLabel>
            <SidebarSelect
              id="parquet-implementation"
              value={parquetImplementation}
              onChange={(event) => {
                setParquetImplementation(event.target.value as 'wasm' | 'js');
              }}
            >
              <option value="wasm">wasm</option>
              <option value="js">js</option>
            </SidebarSelect>
            <SidebarHint>
              Switches GeoParquet loading between the Arrow-backed wasm path and the JS fallback.
            </SidebarHint>
          </SidebarSection>
        ) : null}
        {state.error ? <div style={{color: 'red'}}>{state.error}</div> : ''}
        <div style={{textAlign: 'center'}}>
          center long/lat: {state.viewState.longitude.toFixed(3)},
          {state.viewState.latitude.toFixed(3)}, zoom: {state.viewState.zoom.toFixed(2)}
        </div>
        {/* TODO -restore drag and drop
        <FileUploader
          onFileRemoved={() => setState(state => ({...state, table: null}))}
          onFileSelected={async (uploadedFile: File) => {
            // TODO - error handling
            const data = (await load(uploadedFile, LOADERS, LOADER_OPTIONS)) as Table;
            setState(state => ({
              ...state,
              selectedExample: uploadedFile.name,
              table: data
            }));
          }}
        />
        */}
        <h2>Table Schema</h2>
        <MetadataViewer
          metadata={state.table?.schema && JSON.stringify(state.table.schema, null, 2)}
        />
      </ExamplePanel>

      <DeckGL
        layers={renderLayer(state)}
        viewState={state.viewState}
        onViewStateChange={({viewState}) => setState((state) => ({...state, viewState}))}
        controller={{type: MapController, maxPitch: 85}}
        getTooltip={({object}) => getTooltipData({object}, state)}
      >
        <Map reuseMaps mapLib={maplibregl} mapStyle={INITIAL_MAP_STYLE} preventStyleDiffing />
      </DeckGL>
    </div>
  );

  async function onExampleChange(args: {
    categoryName: string;
    exampleName: string;
    example: Example;
  }) {
    await loadExample(args.categoryName, args.exampleName, args.example, parquetImplementation);
  }

  async function loadExample(
    categoryName: string,
    exampleName: string,
    example: Example,
    implementation: 'wasm' | 'js'
  ) {
    const url = example.data;
    const loaderOptions = getLoaderOptions(implementation);
    const requestId = ++loadRequestIdRef.current;
    const loadStartTime = performance.now();

    setState((state) => ({
      ...state,
      loading: true,
      loadDurationSeconds: null,
      selectedCategoryName: categoryName,
      selectedExampleName: exampleName,
      selectedExample: example,
      error: null
    }));

    try {
      const table = (await load(url, LOADERS, loaderOptions)) as Table;
      if (requestId !== loadRequestIdRef.current) {
        return;
      }
      console.log('Loaded table', url, table);
      const viewState = {...state.viewState, ...example.viewState};
      const loadDurationSeconds = (performance.now() - loadStartTime) / 1000;
      setState((state) => ({
        ...state,
        table,
        viewState,
        selectedCategoryName: categoryName,
        selectedExampleName: exampleName,
        selectedExample: example,
        error: null,
        loading: false,
        loadDurationSeconds,
        displayedParquetImplementation: implementation
      }));
    } catch (error) {
      if (requestId !== loadRequestIdRef.current) {
        return;
      }
      console.error('Failed to load table', url, error);
      const message = error instanceof Error ? error.message : String(error);
      setState((state) => ({
        ...state,
        selectedCategoryName: categoryName,
        selectedExampleName: exampleName,
        selectedExample: example,
        error: `Could not load ${exampleName}: ${message}`,
        loading: false,
        loadDurationSeconds: null
      }));
    }
  }
}

function getLoaderOptions(implementation: 'wasm' | 'js'): LoaderOptions {
  return {
    ...LOADER_OPTIONS,
    parquet: {
      ...LOADER_OPTIONS.parquet,
      implementation
    }
  };
}

function renderLayer({table, selectedExample, index}) {
  const geojson = table as GeoJSON;
  return [
    new GeoJsonLayer({
      id: `geojson-${index})`,
      data: geojson,

      pickable: true,
      autoHighlight: true,
      highlightColor: [0, 255, 0],

      // Visuals
      opacity: 1.0,
      stroked: false,
      filled: true,
      extruded: true,
      wireframe: true,
      // getElevation: (f) => Math.sqrt(f?.properties?.valuePerSqm) * 10,
      // lines
      getLineColor: [0, 0, 255],
      getLineWidth: 3,
      lineWidthUnits: 'pixels',
      // point fills
      getFillColor: [255, 0, 0],
      getPointRadius: 100,
      pointRadiusScale: 500,
      // pointRadiusUnits: 'pixels',
      ...selectedExample?.layerProps
    })
  ];
}

function getTooltipData({object}, state) {
  const {getTooltipData: getSpecialTooltipData} = state.selectedExample ?? {};
  const {title, properties} = getSpecialTooltipData
    ? getSpecialTooltipData({object})
    : getDefaultTooltipData({object});
  const props = Object.entries(properties)
    .map(([key, value]) => `<div>${key}: ${value}</div>`)
    .join('\n');
  return (
    object && {
      html: `\
<h2>${title}</h2>
${props}
<div>Coords: ${object.geometry?.coordinates?.[0]};${object.geometry?.coordinates?.[1]}</div>`,
      style: {
        backgroundColor: '#ddd',
        fontSize: '0.8em'
      }
    }
  );
}

function getDefaultTooltipData({object}) {
  const {name, ...properties} = object?.properties || {};
  return {
    title: name,
    properties
  };
}

export function renderToDOM(container) {
  createRoot(container).render(<App />);
}
