import {}

import React, {PureComponent} from 'react';
import {createRoot} from 'react-dom/client';
import {Map} from 'react-map-gl';
import maplibregl from 'maplibre-gl';

import DeckGL from '@deck.gl/react';
import {MapController} from '@deck.gl/core/typed';
import {GeoJsonLayer} from '@deck.gl/layers/typed';

import {load, Loader} from '@loaders.gl/core';
import {ParquetLoader} from '@loaders.gl/parquet';
// import {GeoPackageLoader} from '@loaders.gl/geopackage';
// import {FlatGeobufLoader} from '@loaders.gl/flatgeobuf';
// registerLoaders([GeoPackageLoader, FlatGeobufLoader]);
const LOADERS: Loader[] = [ParquetLoader];

import ControlPanel from './components/control-panel';
import FileUploader from './components/file-uploader';
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
  // CURRENT VIEW POINT / CAMERA POSITIO
  viewState: Record<string, number>,

  // EXAMPLE STATE
  selectedExample: string,
  selectedLoader: string,
  uploadedFile: null
}

/**
 * 
 */
export default class App extends PureComponent<AppProps, AppState> {
  constructor(props) {
    super(props);

    let examples: Record<string, Record<string, Example>> = EXAMPLES;
    if (props.format) {
      examples = {[props.format]: EXAMPLES[props.format]};
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
      selectedExample,
      selectedLoader,
      uploadedFile: null
    };

    this._onExampleChange = this._onExampleChange.bind(this);
    this._onFileRemoved = this._onFileRemoved.bind(this);
    this._onFileSelected = this._onFileSelected.bind(this);
    this._onViewStateChange = this._onViewStateChange.bind(this);
    // this._onFileUploaded = this._onFileUploaded.bind(this);
  }

  _onViewStateChange({viewState}) {
    this.setState({viewState});
  }

  _onExampleChange({selectedLoader, selectedExample, example}) {
    const {viewState} = example;
    this.setState({selectedLoader, selectedExample, viewState});
  }

  _onFileRemoved() {
    this.setState({uploadedFile: null});
  }

  async _onFileSelected(uploadedFile: File) {
    const data = await load(uploadedFile, LOADERS[0]);
    this.setState({
      selectedExample: uploadedFile.name,
      uploadedFile: data
    });
  }

  // _onFileUploaded(data, uploadedFile) {
  //   this.setState({
  //     selectedExample: uploadedFile.name,
  //     uploadedFile: data
  //   });
  // }

  _renderControlPanel() {
    const {selectedExample, viewState, selectedLoader} = this.state;

    return (
      <ControlPanel
        examples={EXAMPLES}
        selectedExample={selectedExample}
        selectedLoader={selectedLoader}
        onExampleChange={this._onExampleChange}
      >
        <div style={{textAlign: 'center'}}>
          long/lat: {viewState.longitude.toFixed(5)},{viewState.latitude.toFixed(5)}, zoom:
          {viewState.zoom.toFixed(2)}
        </div>
        {<FileUploader onFileUpSelected={this._onFileSelected} onFileRemoved={this._onFileRemoved} />}
      </ControlPanel>
    );
  }

  _renderLayer() {
    const {selectedExample, selectedLoader, uploadedFile} = this.state;

    let layerData;
    if (uploadedFile) {
      layerData = uploadedFile;
    } else if (EXAMPLES[selectedLoader][selectedExample]) {
      layerData = EXAMPLES[selectedLoader][selectedExample].data;
    } else {
      layerData = EXAMPLES[INITIAL_LOADER_NAME][INITIAL_EXAMPLE_NAME].data;
    }

    return [
      new GeoJsonLayer({
        id: `geojson-${selectedExample}(${selectedLoader})`,
        data: layerData,
        loaders: LOADERS,
        loadOptions: {
          worker: false,
          gis: {
            format: 'geojson',
            reproject: true,
            _targetCrs: 'WGS84'
          }
        },
        dataTransform: (data, previousData) => {
          if (typeof data === 'object' && !Array.isArray(data) && !data.type) {
            return Object.values(data).flat();
          }
          return data;
        },
        opacity: 0.8,
        stroked: false,
        filled: true,
        extruded: true,
        wireframe: true,
        getElevation: (f) => Math.sqrt(f.properties.valuePerSqm) * 10,
        getFillColor: [255, 255, 255],
        getLineColor: [0, 0, 0],
        getLineWidth: 3,
        lineWidthUnits: 'pixels',
        pickable: true
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
