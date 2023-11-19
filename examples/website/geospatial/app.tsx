// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

import React, {useState, useEffect} from 'react';
import {createRoot} from 'react-dom/client';

import {Map} from 'react-map-gl';
import maplibregl from 'maplibre-gl';

import {DeckGL} from '@deck.gl/react/typed';
import {MapController} from '@deck.gl/core/typed';
import {GeoJsonLayer} from '@deck.gl/layers/typed';

import {ControlPanel} from './components/control-panel';
import {FileUploader} from './components/file-uploader';

import type {Example} from './examples';
import {INITIAL_LOADER_NAME, INITIAL_EXAMPLE_NAME, INITIAL_MAP_STYLE, EXAMPLES} from './examples';

import {Table, GeoJSON} from '@loaders.gl/schema';
import {Loader, load /* registerLoaders */} from '@loaders.gl/core';
import {ParquetLoader, installBufferPolyfill} from '@loaders.gl/parquet';
import {FlatGeobufLoader} from '@loaders.gl/flatgeobuf';
// import {GeoPackageLoader} from '@loaders.gl/geopackage';
import {ArrowLoader} from '@loaders.gl/arrow';

installBufferPolyfill();

const LOADERS: Loader[] = [
  ArrowLoader,
  ParquetLoader,
  FlatGeobufLoader
  // GeoPackageLoader
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
  geopackage: {
    shape: 'geojson-table'
    // table: 'FEATURESriversds'
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
 *
 */
export default function App(props: AppProps) {

  const [state, setState] = useState<AppState>({
    // EXAMPLE STATE
    examples: EXAMPLES,
    selectedExample: INITIAL_EXAMPLE_NAME,
    selectedLoader: INITIAL_LOADER_NAME,

    // CURRENT VIEW POINT / CAMERA POSITION
    viewState: INITIAL_VIEW_STATE,
    loadedTable: null,
    error: null
  });

  // Initialize the examples (each demo might focus on a different "props.format")
  useEffect(() => {
    let examples: Record<string, Record<string, Example>> = {...EXAMPLES};
    if (props.format) {
      // Move the preferred format examples to the "top"
      examples = {[props.format]: EXAMPLES[props.format], ...EXAMPLES};
    }

    const selectedLoader = props.format || INITIAL_LOADER_NAME;

    let selectedExample = INITIAL_EXAMPLE_NAME;
    if (props.format) {
      for (const exampleName of Object.keys(examples[selectedLoader])) {
        selectedExample = exampleName;
        break;
      }
    }
    setState({...state, examples, selectedExample, selectedLoader});
  }, [props.format]);

  return (
    <div style={{position: 'relative', height: '100%'}}>
      
      <ControlPanel
        examples={state.examples}
        selectedExample={state.selectedExample}
        selectedLoader={state.selectedLoader}
        onExampleChange={(props) =>onExampleChange({...props, state, setState})}
      >
        {state.error ? <div style={{color: 'red'}}>{state.error}</div> : ''}
        <div style={{textAlign: 'center'}}>
          center long/lat: {state.viewState.longitude.toFixed(3)},
          {state.viewState.latitude.toFixed(3)}, 
          zoom: {state.viewState.zoom.toFixed(2)}
        </div>
        <FileUploader 
           onFileRemoved={() => setState({...state, loadedTable: null})} 
           onFileSelected={async (uploadedFile: File) => {
            // TODO - error handling
            const data = (await load(uploadedFile, LOADERS, LOADER_OPTIONS)) as Table;
            setState({
              ...state,
              selectedExample: uploadedFile.name,
              loadedTable: data
            });
          }} 
        />
      </ControlPanel>

      <DeckGL
        layers={renderLayer(state)}
        viewState={state.viewState}
        onViewStateChange={({viewState}) => setState({...state, viewState})}
        controller={{type: MapController, maxPitch: 85}}
        getTooltip={({object}) =>
          object && {
            html: `\
<h2>${object.properties?.name}</h2>
<div>${object.geometry?.coordinates?.[0]}</div>
<div>${object.geometry?.coordinates?.[1]}</div>`,
            style: {
              backgroundColor: '#ddd',
              fontSize: '0.8em'
            }
          }
        }
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
  console.log('Loading', url);
  try {
    const data = (await load(url, LOADERS, LOADER_OPTIONS)) as Table;
    console.log('Loaded data', data);
    const viewState = {...state.viewState, ...example.viewState};
    setState({...state, selectedLoader, selectedExample, viewState, loadedTable: data});
  } catch (error) {
    console.log('Failed to load data', url, error);
    setState({...state, error: `Could not load ${selectedExample}: ${error.message}`});
  }
}

function renderLayer({selectedExample, selectedLoader, loadedTable}) {
  
  const geojson = loadedTable as GeoJSON;
  console.warn('Rendering layer with', geojson);
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
