/* global fetch */
import React, {PureComponent} from 'react';
import {render} from 'react-dom';
import DeckGL from '@deck.gl/react';
import {COORDINATE_SYSTEM, OrbitView, LinearInterpolator} from '@deck.gl/core';
import {PointCloudLayer} from '@deck.gl/layers';

import '@loaders.gl/polyfills';
import {load, registerLoaders} from '@loaders.gl/core';
import {
  Tile3DLoader,
  Tile3DFeatureTable,
  Tile3DBatchTable,
  parseRGB565
} from '@loaders.gl/3d-tiles';

import ControlPanel from './control-panel';
import fileDrop from './file-drop';

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

const DATA_URI = 'https://raw.githubusercontent.com/uber-web/loaders.gl/master';
const INDEX_FILE = `${DATA_URI}/modules/3d-tiles/test/data/index.json`;

const INITIAL_VIEW_STATE = {
  target: [0, 0, 0],
  rotationX: 0,
  rotationOrbit: 0,
  orbitAxis: 'Y',
  fov: 50,
  minZoom: -10,
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

export default class App extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      viewState: INITIAL_VIEW_STATE,
      featureTable: null,
      batchTable: null,
      tile: null,
      droppedFile: null,
      example: 'PointCloudNormals',
      category: 'PointCloud'
    };

    this._deckRef = null;

    this._onLoad = this._onLoad.bind(this);
    this._onViewStateChange = this._onViewStateChange.bind(this);
    this._rotateCamera = this._rotateCamera.bind(this);
    this._getColor = this._getColor.bind(this);

    this._loadExample = this._loadExample.bind(this);
    this._onSelectExample = this._onSelectExample.bind(this);
  }

  componentDidMount() {
    fileDrop(this._deckRef.deckCanvas, (promise, file) => {
      this.setState({droppedFile: file, tile: null});
      load(promise, MeshTile3DLoader).then(this._onLoad);
    });

    // fetch index file
    fetch(INDEX_FILE)
      .then(resp => resp.json())
      .then(data => {
        this.setState({data});
        const {category, example} = this.state;
        this._loadExample(category, example);
      });
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

  _loadExample(category, example) {
    const {data} = this.state;
    this.setState({tile: null});

    if (data && category && example) {
      const selectedExample = data[category].examples[example];
      const url = `${DATA_URI}/${selectedExample.path}/${selectedExample.files[0]}`;
      load(url).then(this._onLoad);
    }
  }

  _onLoad(tile) {
    const featureTable = new Tile3DFeatureTable(tile.featureTableJson, tile.featureTableBinary);
    let batchTable = null;
    if (tile.batchIds) {
      const {batchTableJson, batchTableBinary} = tile;
      batchTable = new Tile3DBatchTable(
        batchTableJson,
        batchTableBinary,
        featureTable.getGlobalProperty('BATCH_LENGTH')
      );
    }

    const {mins, maxs} = getDataRange(tile.positions);
    let {viewState} = this.state;

    if (mins && maxs) {
      // File contains bounding box info
      viewState = {
        ...viewState,
        target: [(mins[0] + maxs[0]) / 2, (mins[1] + maxs[1]) / 2, (mins[2] + maxs[2]) / 2],
        /* global window */
        zoom: Math.log2(window.innerWidth / (maxs[0] - mins[0])) - 1.5
      };
    }

    tile.pointsCount = tile.featureTableJson.POINTS_LENGTH;

    this.setState(
      {
        tile,
        featureTable,
        batchTable,
        viewState
      },
      this._rotateCamera
    );
  }

  /* eslint-disable max-statements */
  _getColor(object, {index, data, target}) {
    if (!this.state.tile) {
      return null;
    }

    const {
      tile: {colors, isRGB565, constantRGBA, batchIds},
      batchTable
    } = this.state;
    if (colors) {
      if (isRGB565) {
        const color = parseRGB565(data.colors.value[index]);
        target[0] = color[0];
        target[1] = color[1];
        target[2] = color[2];
        target[3] = 255;
      } else {
        target[0] = data.colors.value[index * 3];
        target[1] = data.colors.value[index * 3 + 1];
        target[2] = data.colors.value[index * 3 + 2];
        target[3] = data.colors.size === 4 ? data.colors[index * 3 + 4] : 255;
      }

      return target;
    }

    if (constantRGBA) {
      return constantRGBA;
    }

    if (batchIds && batchTable) {
      const batchId = batchIds[index];
      // TODO figure out what is `dimensions` used for
      const dimensions = batchTable.getProperty(batchId, 'dimensions');
      const color = dimensions.map(d => d * 255);
      return [...color, 255];
    }

    return [255, 255, 255];
  }

  /* eslint-enable max-statements */

  _renderLayers() {
    if (!this.state.tile) {
      return null;
    }

    const {pointsCount, positions, colors, normals} = this.state.tile;

    return (
      positions &&
      new PointCloudLayer({
        data: {
          colors: {value: colors, size: 4},
          normals: {value: positions, size: 3},
          length: positions.length / 3
        },
        id: '3d-point-cloud-layer',
        coordinateSystem: COORDINATE_SYSTEM.IDENTITY,
        numInstances: pointsCount,
        instancePositions: positions,
        getColor: this._getColor,
        getNormal: normals
          ? (object, {index, data, target}) => {
              target[0] = data.normals[index * 3];
              target[1] = data.normals[index * 3 + 1];
              target[2] = data.normals[index * 3 + 2];
              return target;
            }
          : [0, 1, 0],
        opacity: 0.5,
        pointSize: 1.5
      })
    );
  }

  _onSelectExample({category, example}) {
    this.setState({category, example}, () => {
      const {data} = this.state;
      if (data && category && example) {
        this._loadExample(category, example);
      }
    });
  }

  _renderControlPanel() {
    const {data, example, category} = this.state;
    return (
      <ControlPanel
        data={data}
        category={category}
        example={example}
        onChange={this._onSelectExample}
      />
    );
  }

  render() {
    const {viewState} = this.state;

    return (
      <DeckGL
        ref={_ => (this._deckRef = _)}
        width="100%"
        height="100%"
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
