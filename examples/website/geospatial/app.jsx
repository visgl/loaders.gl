import React, {PureComponent} from 'react';
import {render} from 'react-dom';
import {StaticMap} from 'react-map-gl';

import DeckGL from '@deck.gl/react';
import {MapController} from '@deck.gl/core';
import {GeoJsonLayer} from '@deck.gl/layers';

import ControlPanel from './components/control-panel';
import FileUploader from './components/file-uploader';
import {INITIAL_LOADER_NAME, INITIAL_EXAMPLE_NAME, INITIAL_MAP_STYLE, EXAMPLES} from './examples';

export const INITIAL_VIEW_STATE = {
  latitude: 49.254,
  longitude: -123.13,
  zoom: 11,
  maxZoom: 16,
  pitch: 45,
  bearing: 0
};

export class App extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      // CURRENT VIEW POINT / CAMERA POSITIO
      viewState: INITIAL_VIEW_STATE,

      // EXAMPLE STATE
      selectedExample: INITIAL_EXAMPLE_NAME,
      selectedLoader: INITIAL_LOADER_NAME,
      uploadedFile: null
    };

    this._onExampleChange = this._onExampleChange.bind(this);
    this._onFileRemoved = this._onFileRemoved.bind(this);
    this._onFileUploaded = this._onFileUploaded.bind(this);
    this._onViewStateChange = this._onViewStateChange.bind(this);
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

  _onFileUploaded(data, uploadedFile) {
    this.setState({
      selectedExample: uploadedFile.name,
      uploadedFile: data
    });
  }

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
        {<FileUploader onFileUploaded={this._onFileUploaded} onFileRemoved={this._onFileRemoved} />}
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
        pickable: true,
        // TODO: Why aren't these loadOptions aren't passed for an uploaded file???
        loadOptions: {
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
        }
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
          <StaticMap mapStyle={INITIAL_MAP_STYLE} preventStyleDiffing />
        </DeckGL>
      </div>
    );
  }
}

export function renderToDOM(container) {
  render(<App />, container);
}
