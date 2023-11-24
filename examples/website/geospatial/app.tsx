// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

import React, {useState, useEffect} from 'react';
import {createRoot} from 'react-dom/client';

import {Map} from 'react-map-gl';
import maplibregl, {Properties} from 'maplibre-gl';

import {DeckGL} from '@deck.gl/react/typed';
import {MapController} from '@deck.gl/core/typed';
import {GeoJsonLayer} from '@deck.gl/layers/typed';

import {ControlPanel} from './components/control-panel';
// import {FileUploader} from './components/file-uploader';

import type {Example} from './examples';
import {INITIAL_LOADER_NAME, INITIAL_EXAMPLE_NAME, INITIAL_MAP_STYLE, EXAMPLES} from './examples';

import {Table, GeoJSON} from '@loaders.gl/schema';
import {Loader, load /* registerLoaders */} from '@loaders.gl/core';
import {GeoArrowLoader} from '@loaders.gl/arrow';
import {ParquetLoader, installBufferPolyfill} from '@loaders.gl/parquet';
import {FlatGeobufLoader} from '@loaders.gl/flatgeobuf';
import {ShapefileLoader} from '@loaders.gl/shapefile';
import {KMLLoader, GPXLoader, TCXLoader} from '@loaders.gl/kml';

// GeoPackage depends on sql.js which has bundling issues in docusuarus.
// import {GeoPackageLoader} from '@loaders.gl/geopackage';

installBufferPolyfill();

const LOADERS: Loader[] = [
  GeoArrowLoader,
  ParquetLoader,
  FlatGeobufLoader,
  // GeoPackageLoader
  ShapefileLoader,
  KMLLoader,
  GPXLoader,
  TCXLoader
];
const LOADER_OPTIONS = {
  worker: false,
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
  format?: string;
};

type AppState = {
  examples: Record<string, Record<string, Example>>;
  // CURRENT VIEW POINT / CAMERA POSITION
  viewState: Record<string, number>;

  // EXAMPLE STATE
  selectedExample: string;
  selectedLoader: string;
  loadedTable: Table | null;
};

/**
 * A Geospatial table map viewer
 */
export default function App(props: AppProps) {
  const [state, setState] = useState<AppState>({
    // EXAMPLE STATE
    examples: EXAMPLES,
    selectedExample: null,
    selectedLoader: null,

    // CURRENT VIEW POINT / CAMERA POSITION
    viewState: INITIAL_VIEW_STATE,
    loadedTable: null,
    error: null
  });

  // Initialize the examples (each demo might focus on a different "props.format")
  useEffect(() => {
    let examples: Record<string, Record<string, Example>> = {...EXAMPLES};
    if (props.format) {
      // Keep only the preferred format examples
      examples = {[props.format]: EXAMPLES[props.format]};
    }

    const selectedLoader = props.format || INITIAL_LOADER_NAME;
    let selectedExample = props.format
      ? Object.keys(examples[selectedLoader])[0]
      : INITIAL_EXAMPLE_NAME;

    onExampleChange({
      selectedLoader,
      selectedExample,
      example: examples[selectedLoader][selectedExample],
      state,
      setState
    });
    setState((state) => ({...state, examples, selectedExample, selectedLoader}));
  }, [props.format]);

  let schema = state.loadedTable?.schema
    ? {metadata: state.loadedTable?.schema.metadata, ...state.loadedTable?.schema}
    : null;

  return (
    <div style={{position: 'relative', height: '100%'}}>
      <ControlPanel
        schema={schema && JSON.stringify(schema, null, 2)}
        examples={state.examples}
        selectedExample={state.selectedExample}
        selectedLoader={state.selectedLoader}
        onExampleChange={(props) => onExampleChange({...props, state, setState})}
      >
        {state.error ? <div style={{color: 'red'}}>{state.error}</div> : ''}
        <div style={{textAlign: 'center'}}>
          center long/lat: {state.viewState.longitude.toFixed(3)},
          {state.viewState.latitude.toFixed(3)}, zoom: {state.viewState.zoom.toFixed(2)}
        </div>
        {/* TODO -restore drag and drop
        <FileUploader
          onFileRemoved={() => setState(state => ({...state, loadedTable: null}))}
          onFileSelected={async (uploadedFile: File) => {
            // TODO - error handling
            const data = (await load(uploadedFile, LOADERS, LOADER_OPTIONS)) as Table;
            setState(state => ({
              ...state,
              selectedExample: uploadedFile.name,
              loadedTable: data
            }));
          }}
        />
        */}
      </ControlPanel>

      <DeckGL
        layers={renderLayer(state)}
        viewState={state.viewState}
        onViewStateChange={({viewState}) => setState((state) => ({...state, viewState}))}
        controller={{type: MapController, maxPitch: 85}}
        getTooltip={({object}) => {
          const {name, ...properties} = object?.properties || {};
          const props = Object.entries(properties)
            .map(([key, value]) => `<div>${key}: ${value}</div>`)
            .join('\n');
          return (
            object && {
              html: `\
<h2>${name}</h2>
${props}
<div>Coords: ${object.geometry?.coordinates?.[0]};${object.geometry?.coordinates?.[1]}</div>`,
              style: {
                backgroundColor: '#ddd',
                fontSize: '0.8em'
              }
            }
          );
        }}
      >
        <Map reuseMaps mapLib={maplibregl} mapStyle={INITIAL_MAP_STYLE} preventStyleDiffing />
      </DeckGL>
    </div>
  );
}

async function onExampleChange(args: {
  selectedLoader: string;
  selectedExample: string;
  example: Example;
  state: AppState;
  setState: Function;
}) {
  const {selectedLoader, selectedExample, example, state, setState} = args;

  const url = example.data;
  try {
    const data = (await load(url, LOADERS, LOADER_OPTIONS)) as Table;
    console.log('Loaded data', url, data);
    const viewState = {...state.viewState, ...example.viewState};
    setState((state) => ({
      ...state,
      selectedLoader,
      selectedExample,
      viewState,
      loadedTable: data
    }));
  } catch (error) {
    console.error('Failed to load data', url, error);
    setState((state) => ({...state, error: `Could not load ${selectedExample}: ${error.message}`}));
  }
}

function renderLayer({selectedExample, selectedLoader, loadedTable}) {
  const geojson = loadedTable as GeoJSON;
  return [
    new GeoJsonLayer({
      id: `geojson-${selectedExample}(${selectedLoader})`,
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
      pointRadiusScale: 500
      // pointRadiusUnits: 'pixels',
    })
  ];
}

export function renderToDOM(container) {
  createRoot(container).render(<App />);
}
