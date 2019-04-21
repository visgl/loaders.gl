/* eslint-disable no-unused-vars */
import React, {PureComponent} from 'react';
import {render} from 'react-dom';
import DeckGL, {COORDINATE_SYSTEM, PointCloudLayer, OrbitView, LinearInterpolator} from 'deck.gl';

import {Tile3DLoader} from '@loaders.gl/3d-tiles';
import {load, registerLoaders} from '@loaders.gl/core';

function parseSync(arrayBuffer, options, url, loader) {
  const result = Tile3DLoader.parseSync(arrayBuffer, options, url, loader);
  return result;
}

export const MeshTile3DLoader = {
  name: '3D Tile Pointloud',
  extensions: ['pnts'],
  parseSync,
  binary: true
};

registerLoaders(MeshTile3DLoader);

const PNTS_URL = `./PointCloudNormals/PointCloudNormals.pnts`;

const INITIAL_VIEW_STATE = {
  target: [0, 0, 0],
  rotationX: 0,
  rotationOrbit: 0,
  orbitAxis: 'Y',
  fov: 50,
  minZoom: 0,
  maxZoom: 10,
  zoom: 1
};

const transitionInterpolator = new LinearInterpolator(['rotationOrbit']);

function getDataRange(data, step = 3) {
  const mins = [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY];
  const maxs = [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY];
  const numOfPoints = data.length / step;
  for (let i = 0; i < numOfPoints; i++) {
    mins[0] = Math.min(mins[0], data[i * step]);
    mins[1] = Math.min(mins[1], data[i * step + 1]);
    mins[2] = Math.min(mins[2], data[i * step + 2]);

    maxs[0] = Math.max(maxs[0], data[i * step]);
    maxs[1] = Math.max(maxs[1], data[i * step + 1]);
    maxs[2] = Math.max(maxs[2], data[i * step + 2]);
  }

  return {mins, maxs};
}

function parseDataObject(input, output, index, count) {
  output[0] = input[index * 3];
  output[1] = input[index * count + 1];
  output[2] = input[index * count + 2];
}

export class App extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      viewState: INITIAL_VIEW_STATE,
      pointsCount: 0,
      colors: null,
      positions: null
    };

    this._onLoad = this._onLoad.bind(this);
    this._onViewStateChange = this._onViewStateChange.bind(this);
    this._rotateCamera = this._rotateCamera.bind(this);

    load(PNTS_URL).then(this._onLoad);
  }

  _onViewStateChange({viewState}) {
    this.setState({viewState});
  }

  _rotateCamera() {
    const {viewState} = this.state;
    this.setState({
      viewState: {
        ...viewState,
        rotationOrbit: viewState.rotationOrbit + 30,
        transitionDuration: 600,
        transitionInterpolator,
        onTransitionEnd: this._rotateCamera
      }
    });
  }

  _onLoad({positions, colors, normals, featureTableJson}) {
    const {mins, maxs} = getDataRange(positions);
    let {viewState} = this.state;

    if (mins && maxs) {
      // File contains bounding box info
      viewState = {
        ...viewState,
        target: [(mins[0] + maxs[0]) / 2, (mins[1] + maxs[1]) / 2, (mins[2] + maxs[2]) / 2],
        /* global window */
        zoom: Math.log2(window.innerWidth / (maxs[0] - mins[0])) - 1
      };
    }

    this.setState(
      {
        pointsCount: featureTableJson.POINTS_LENGTH,
        positions,
        colors,
        normals,
        viewState
      },
      this._rotateCamera
    );
  }

  _renderLayers() {
    const {pointsCount, positions, colors, normals} = this.state;

    return (
      positions &&
      new PointCloudLayer({
        data: {positions, colors, normals, length: positions.length / 3},
        id: '3d-point-cloud-layer',
        coordinateSystem: COORDINATE_SYSTEM.IDENTITY,
        numInstances: pointsCount,
        getPosition: (object, {index, data, target}) => {
          target[0] = data.positions[index * 3];
          target[1] = data.positions[index * 3 + 1];
          target[2] = data.positions[index * 3 + 2];
          return target;
        },
        getColor: (object, {index, data, target}) => {
          target[0] = data.colors[index * 3];
          target[1] = data.colors[index * 3 + 1];
          target[2] = data.colors[index * 3 + 2];
          target[3] = 255;
          return target;
        },
        getNormal: (object, {index, data, target}) => {
          target[0] = data.normals[index * 3];
          target[1] = data.normals[index * 3 + 1];
          target[2] = data.normals[index * 3 + 2];
          return target;
        },
        opacity: 0.5,
        pointSize: 1.5
      })
    );
  }

  render() {
    const {viewState} = this.state;

    return (
      <DeckGL
        views={new OrbitView()}
        viewState={viewState}
        controller={true}
        onViewStateChange={this._onViewStateChange}
        layers={this._renderLayers()}
        parameters={{
          clearColor: [0.07, 0.14, 0.19, 1]
        }}
      />
    );
  }
}

export function renderToDOM(container) {
  render(<App />, container);
}
