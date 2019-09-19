import React, {PureComponent} from 'react';
import {render} from 'react-dom';
import {StaticMap} from 'react-map-gl';
import DeckGL from '@deck.gl/react';

import {MapController, COORDINATE_SYSTEM} from '@deck.gl/core';
import {ScenegraphLayer} from '@deck.gl/mesh-layers';

import {GLTFLoader} from '@loaders.gl/gltf';
import {DracoWorkerLoader} from '@loaders.gl/draco';
import {registerLoaders} from '@loaders.gl/core';

import loadIBLEnvironment from './environment';

// To manage dependencies/bundle size, the app decides which loaders to bring in
registerLoaders([GLTFLoader, DracoWorkerLoader]);

// Set your mapbox token here
const MAPBOX_TOKEN = process.env.MapboxAccessToken; // eslint-disable-line

const GLTF_BASE_URL =
  'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/';

const GLTF_DEFAULT_MODEL =
`${GLTF_BASE_URL}/DamagedHelmet/glTF-Binary/DamagedHelmet.glb`;

export const INITIAL_VIEW_STATE = {
  longitude: -75.61213987669433,
  latitude: 40.04248558075302,
  zoom: 12,
  bearing: 0,
  pitch: 45,
  maxPitch: 60
};

const ORIGIN = [INITIAL_VIEW_STATE.longitude, INITIAL_VIEW_STATE.latitude, 0];

export default class App extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      iblEnvironment: null,
      droppedFile: null
    };
  }

  componentDidMount() {
    // fileDrop(this._deckRef.deckCanvas, (promise, file) => {
    //   // eslint-disable-next-line
    //   // this.setState({ droppedFile: file, tile: null });
    //   // load(promise, Tile3DLoader).then(this._onLoad);
    // });
  }

  _onWebGLInitialized(gl) {
    this.setState({iblEnvironment: loadIBLEnvironment(gl)});
  }

  render() {
    return (
      <DeckGL
        height="100%"
        initialViewState={INITIAL_VIEW_STATE}
        controller={{type: MapController, maxPitch: 85}}
        onWebGLInitialized={this._onWebGLInitialized.bind(this)}
        layers={[
          new ScenegraphLayer({
            id: 'tile-3d-layer',
            data: [{}],
            scenegraph: GLTF_DEFAULT_MODEL,
            loadOptions: {
              gltf: {
                parserVersion: 2
              }
            },
            coordinateSystem: COORDINATE_SYSTEM.METER_OFFSETS,
            coordinateOrigin: ORIGIN,
            sizeScale: 1000,
            _pbr: true,
            _imageBasedLightingEnvironment: this.state.iblEnvironment
          })
        ]}
      >
        <StaticMap
          mapStyle="mapbox://styles/mapbox/light-v9"
          mapboxApiAccessToken={MAPBOX_TOKEN}
          preventStyleDiffing
        />
      </DeckGL>
    );
  }
}

/* global document */
render(<App />, document.body.appendChild(document.createElement("div")));

export function renderToDOM(container) {
  render(<App />, container);
}

