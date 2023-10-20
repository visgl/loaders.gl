import React, {PureComponent} from 'react';
import {createRoot} from 'react-dom/client';
import {Map} from 'react-map-gl';
import maplibregl from 'maplibre-gl';

import DeckGL from '@deck.gl/react';
import {MapController} from '@deck.gl/core/typed';
import {GeoJsonLayer} from '@deck.gl/layers/typed';

import ControlPanel from './components/control-panel';
import FileUploader from './components/file-uploader';

import {Table, GeoJSON} from '@loaders.gl/schema';
import {Loader, load, /* registerLoaders */} from '@loaders.gl/core';
import {ParquetLoader} from '@loaders.gl/parquet';
import {FlatGeobufLoader} from '@loaders.gl/flatgeobuf';
import {GeoPackageLoader} from '@loaders.gl/geopackage';

const LOADERS: Loader[] = [
  ParquetLoader, 
  FlatGeobufLoader,
  GeoPackageLoader
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
  'geopackage': {
    shape: 'geojson-table',
    // table: 'FEATURESriversds'
  }
}

import type {Example} from './examples';
import {INITIAL_LOADER_NAME, INITIAL_EXAMPLE_NAME, INITIAL_MAP_STYLE, EXAMPLES} from './examples';

export const INITIAL_VIEW_STATE = {
  latitude: 49.254,
  longitude: -123.13,
  zoom: 11,
  maxZoom: 16,
  pitch: 45,
  bearing: 0
};

type AppProps = {
  format?: string
};

type AppState = {
  examples: Record<string, Record<string, Example>>,
  // CURRENT VIEW POINT / CAMERA POSITION
  viewState: Record<string, number>,

  // EXAMPLE STATE
  selectedExample: string,
  selectedLoader: string,
  loadedTable: Table | null
}

/**
 * 
 */
export default class App extends PureComponent<AppProps, AppState> {
  constructor(props) {
    super(props);

    let examples: Record<string, Record<string, Example>> = EXAMPLES;
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

    this.state = {
      examples,
      // CURRENT VIEW POINT / CAMERA POSITIO
      viewState: INITIAL_VIEW_STATE,

      // EXAMPLE STATE
      selectedExample: INITIAL_EXAMPLE_NAME,
      selectedLoader: INITIAL_LOADER_NAME,
      loadedTable: null
    };

    this._onExampleChange = this._onExampleChange.bind(this);
    this._onFileRemoved = this._onFileRemoved.bind(this);
    this._onFileSelected = this._onFileSelected.bind(this);
    // this._onFileUploaded = this._onFileUploaded.bind(this);
    this._onViewStateChange = this._onViewStateChange.bind(this);
  }

  _onViewStateChange({viewState}) {
    this.setState({viewState});
  }

  async _onExampleChange(args: {selectedLoader: string, selectedExample: string, example: Example}) {
    const {selectedLoader, selectedExample, example} = args

    const url = example.data;
    console.log('Loading', url);
    const data = await load(url, LOADERS, LOADER_OPTIONS) as Table;
    console.log('Loaded data', data);

    const {viewState} = example;
    this.setState({selectedLoader, selectedExample, viewState, loadedTable: data});
  }

  _onFileRemoved() {
    this.setState({loadedTable: null});
  }

  async _onFileSelected(uploadedFile: File) {
    console.log('Loading', uploadedFile.name);
    const data = await load(uploadedFile, LOADERS, LOADER_OPTIONS) as Table;
    console.log('Loaded data', data);
    this.setState({
      selectedExample: uploadedFile.name,
      loadedTable: data
    });
  }

  // _onFileUploaded(data, uploadedFile) {
  //   this.setState({
  //     selectedExample: uploadedFile.name,
  //     uploadedFile: data
  //   });
  // }

  _renderControlPanel() {
    const {examples, selectedExample, viewState, selectedLoader} = this.state;

    return (
      <ControlPanel
        examples={examples}
        selectedExample={selectedExample}
        selectedLoader={selectedLoader}
        onExampleChange={this._onExampleChange}
      >
        <div style={{textAlign: 'center'}}>
          long/lat: {viewState.longitude.toFixed(5)},{viewState.latitude.toFixed(5)}, zoom:
          {viewState.zoom.toFixed(2)}
        </div>
        {<FileUploader onFileSelected={this._onFileSelected} onFileRemoved={this._onFileRemoved} />}
      </ControlPanel>
    );
  }

  _renderLayer() {
    const {examples, selectedExample, selectedLoader, loadedTable} = this.state;

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
        pointRadiusScale: 500,
        // pointRadiusUnits: 'pixels',
      })
    ];
  }

  render() {
    const {viewState} = this.state;

    return (
      <div style={{position: 'relative', height: '100%'}}>
        {this._renderControlPanel()}
        <DeckGL
          layers={this._renderLayer()}
          viewState={viewState}
          onViewStateChange={this._onViewStateChange}
          controller={{type: MapController, maxPitch: 85}}
          getTooltip={({object}) => object && {
            html: `\
<h2>${object.properties?.name}</h2>
<div>${object.geometry?.coordinates?.[0]}</div>
<div>${object.geometry?.coordinates?.[1]}</div>`,
            style: {
              backgroundColor: '#ddd',
              fontSize: '0.8em'
            }
          }}
        >
          <Map reuseMaps mapLib={maplibregl} mapStyle={INITIAL_MAP_STYLE} preventStyleDiffing />

        </DeckGL>
      </div>
    );
  }
}

export function renderToDOM(container) {
  createRoot(container).render(<App />);
}
