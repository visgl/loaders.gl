// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import React, {useState, useEffect, useRef} from 'react';
import {createRoot} from 'react-dom/client';

import {Map} from 'react-map-gl';
import maplibregl, {Properties} from 'maplibre-gl';

import {DeckGL} from '@deck.gl/react';
import {MapController} from '@deck.gl/core';
import {GeoJsonLayer} from '@deck.gl/layers';

import {ExamplePanel, MetadataViewer} from './components/example-panel';
// import {FileUploader} from './components/file-uploader';

import type {Example} from './examples';
import {INITIAL_LOADER_NAME, INITIAL_EXAMPLE_NAME, INITIAL_MAP_STYLE, EXAMPLES} from './examples';

import {Table, GeoJSON} from '@loaders.gl/schema';
import {Loader, load /* registerLoaders */} from '@loaders.gl/core';
import {GeoArrowLoader} from '@loaders.gl/arrow';
import {GeoParquetLoader, installBufferPolyfill, preloadCompressions} from '@loaders.gl/parquet';
import {FlatGeobufLoader} from '@loaders.gl/flatgeobuf';
import {ShapefileLoader} from '@loaders.gl/shapefile';
import {KMLLoader, GPXLoader, TCXLoader} from '@loaders.gl/kml';
import {ZstdCodec} from 'zstd-codec';
import {requireFromString} from '@loaders.gl/polyfills/src/load-library/require-utils.node';

// GeoPackage depends on sql.js which has bundling issues in docusuarus.
// import {GeoPackageLoader} from '@loaders.gl/geopackage';

installBufferPolyfill();

const LOADERS: Loader[] = [
  GeoArrowLoader,
  GeoParquetLoader,
  FlatGeobufLoader,
  // GeoPackageLoader
  ShapefileLoader,
  KMLLoader,
  GPXLoader,
  TCXLoader
];
const LOADER_OPTIONS = {
  worker: false,
  limit: 1800000,
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
    shape: 'geojson-table'
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
  /** Any informational text to display in the overlay */
  children?: React.Children;
};

type AppState = {
  // EXAMPLE STATE
  table: Table | null;
  layerProps?: Record<string, unknown>;
  getTooltipData?: Function; // (object: Properties) => {title: string; properties: Record<string, unknown>};
  // CURRENT VIEW POINT / CAMERA POSITION
  viewState: Record<string, number>;
};

/**
 * A Geospatial table map viewer
 */
export default function App(props: AppProps) {
  const [state, setState] = useState<AppState>({
    table: null,
    viewState: INITIAL_VIEW_STATE,
    error: null
  });
  const stateRef = useRef<string>();
  stateRef.current = state;

  return (
    <div style={{position: 'relative', height: '100%'}}>
      <ExamplePanel
        examples={EXAMPLES}
        initialCategoryName={INITIAL_LOADER_NAME}
        initialExampleName={INITIAL_EXAMPLE_NAME}
        format={props.format}
        onExampleChange={onExampleChange}
      >
        {props.children}
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
        <MetadataViewer metadata={state.table?.schema && JSON.stringify(state.table.schema, null, 2)} />
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
    selectedLoader: string;
    selectedExample: string;
    example: Example;
  }) {
    const {selectedLoader, selectedExample, example} = args;

    const url = example.data;
    try {
      const table = (await load(url, LOADERS, LOADER_OPTIONS)) as Table;
      console.log('Loaded table', url, table);
      const viewState = {...state.viewState, ...example.viewState};
      setState((state) => ({
        ...state,
        table,
        viewState,
        layerProps: example.layerProps
      }));
    } catch (error) {
      console.error('Failed to load table', url, error);
      setState((state) => ({...state, error: `Could not load ${selectedExample}: ${error.message}`}));
    }
  }
}

function renderLayer({table, layerProps, index}) {
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
      ...layerProps
    })
  ];
}

function getTooltipData({object}, state) {
  const {title, properties} = state.getTooltipData
  ? state.getTooltipData({object})
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
