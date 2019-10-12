/* eslint-disable */
/* global URL */
import React, {PureComponent} from 'react';
import {render} from 'react-dom';
import {StaticMap} from 'react-map-gl';

import GL from '@luma.gl/constants';
import {Geometry} from '@luma.gl/core';
import DeckGL from '@deck.gl/react';
import {MapController, FlyToInterpolator, COORDINATE_SYSTEM} from '@deck.gl/core';
import {SimpleMeshLayer} from '@deck.gl/mesh-layers';
import {I3SSLPKLoader, I3STileset} from '@loaders.gl/i3s';

import {centerMap, cesiumRender} from './cesium';

const TEST_DATA_SLPK =
    'https://raw.githubusercontent.com/uber-web/loaders.gl/master/modules/i3s/test/data/DA12_subset.slpk';

const TEST_DATA_URL =
  'https://tiles.arcgis.com/tiles/z2tnIkrLQ2BRzr6P/arcgis/rest/services/SanFrancisco_Bldgs/SceneServer/layers/0'
;

// Set your mapbox token here
const MAPBOX_TOKEN = process.env.MapboxAccessToken; // eslint-disable-line

const TRANSITION_DURAITON = 4000;

const INITIAL_VIEW_STATE = {
  latitude: 40.709693475815506,
  longitude: -74.00717245979908,
  pitch: 45,
  maxPitch: 60,
  bearing: 0,
  minZoom: 2,
  maxZoom: 30,
  zoom: 14
};

export default class App extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      viewState: INITIAL_VIEW_STATE
    };
  }

  async componentDidMount() {
    const tilesetJson = await fetch(TEST_DATA_URL)
      .then(result => result.json());
    console.log(tilesetJson);

    // const result = await I3SSLPKLoader.parse(TEST_DATA_URL);
    // const tilesetJson = result.tilesetJson;

    const tileset = new I3STileset(tilesetJson, TEST_DATA_URL);

    const bbox = tilesetJson.store.extent;
    const longitude = (bbox[0] + bbox[2]) / 2;
    const latitude = (bbox[1] + bbox[3]) / 2;

    const viewState = {
      ...this.state.viewState,
      zoom: 14,
      longitude,
      latitude
    };

    this.setState({
      viewState: {
        ...viewState,
        transitionDuration: TRANSITION_DURAITON,
        transitionInterpolator: new FlyToInterpolator()
      }
    });

    await tileset.update({viewState});
    this.setState({tiles: tileset.results.selectedTiles});

    // render with cesium
    centerMap(viewState);
    cesiumRender(viewState, this.state.tiles);
  }

  _onViewStateChange({viewState}) {
    // centerMap(viewState);
    this.setState({viewState});
  }

  _renderMeshLayers() {
    const {tiles} = this.state;
    const layers = [];
    console.log(tiles && tiles.length)
    tiles &&
      tiles.forEach((tile, node) => {
        const {attributes, matrix, cartographicOrigin, texture} = tile;

        const positions = new Float32Array(attributes.position.value.length);
        for (let i = 0; i < positions.length; i += 3) {
          const offset = matrix.transform(attributes.position.value.subarray(i, i + 3));
          positions.set(offset, i);
        }

        const geometry = new Geometry({
          drawMode: GL.TRIANGLES,
          attributes: {
            positions,
            colors: attributes.color,
            normals: attributes.normal
          }
        });

        const layer = new SimpleMeshLayer({
          id: `mesh-layer-${node}`,
          mesh: geometry,
          data: [{}],
          getPosition: [0, 0, 0],
          getColor: [255, 255, 255],
          texture,
          coordinateOrigin: cartographicOrigin,
          coordinateSystem: COORDINATE_SYSTEM.METER_OFFSETS
        });

        layers.push(layer);
      });

    return layers;
  }

  _renderLayers() {
    return this._renderMeshLayers();
  }

  render() {
    const {viewState} = this.state;
    const layers = this._renderLayers();

    return (
      <div>
        <DeckGL
          layers={layers}
          initialViewState={INITIAL_VIEW_STATE}
          viewState={viewState}
          onViewStateChange={this._onViewStateChange.bind(this)}
          controller={{type: MapController, maxPitch: 85}}
        >
          <StaticMap
            mapStyle={'mapbox://styles/mapbox/dark-v9'}
            mapboxApiAccessToken={MAPBOX_TOKEN}
            preventStyleDiffing
          />
        </DeckGL>
      </div>
    );
  }
}

const deckViewer = document.getElementById('deck-viewer');
render(<App />, deckViewer);
