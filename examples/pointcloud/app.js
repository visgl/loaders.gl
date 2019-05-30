/* eslint-disable no-unused-vars */
import React, {PureComponent} from 'react';
import {render} from 'react-dom';
import DeckGL from '@deck.gl/react';
import {COORDINATE_SYSTEM, OrbitView, LinearInterpolator} from '@deck.gl/core';
import {PointCloudLayer} from '@deck.gl/layers';

import {DracoLoader} from '@loaders.gl/draco';
import {LASLoader} from '@loaders.gl/las';
import {PLYLoader} from '@loaders.gl/ply';
import {PCDLoader} from '@loaders.gl/pcd';
import {OBJLoader} from '@loaders.gl/obj';
// TODO fix LasWorkerLoader
// import {LASWorkerLoader} from '@loaders.gl/las/worker-loader';

import {load, registerLoaders} from '@loaders.gl/core';

import ControlPanel from './components/control-panel';
import fileDrop from './components/file-drop';

import FILE_INDEX from './file-index';

// Additional format support can be added here, see
registerLoaders([DracoLoader, LASLoader, PLYLoader, PCDLoader, OBJLoader]);

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

export default class App extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      viewState: INITIAL_VIEW_STATE,
      pointsCount: 0,
      points: null,
      // control panel
      droppedFile: null
      // example: 'Indoor',
      // category: 'LAZ'
    };

    this._onLoad = this._onLoad.bind(this);
    this._rotateCamera = this._rotateCamera.bind(this);
    this._onViewStateChange = this._onViewStateChange.bind(this);
    this._onExampleChange = this._onExampleChange.bind(this);
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

  _onExampleChange({selectedCategory, selectedExample, example}) {
    const {uri} = example;
    // TODO - timing could be done automatically by `load`.
    load(uri).then(this._onLoad.bind(this));
    this._loadStartMs = Date.now();
    this.setState({
      selectedCategory,
      selectedExample,
      loadTimeMs: undefined
    });
  }

  _onLoad({header, loaderData, attributes, progress}) {
    // metadata from LAZ file header
    const {mins, maxs} = loaderData.header;
    let {viewState} = this.state;

    if (mins && maxs) {
      // File contains bounding box info
      viewState = {
        ...INITIAL_VIEW_STATE,
        target: [(mins[0] + maxs[0]) / 2, (mins[1] + maxs[1]) / 2, (mins[2] + maxs[2]) / 2],
        /* global window */
        zoom: Math.log2(window.innerWidth / (maxs[0] - mins[0])) - 1
      };
    }

    // if (this.props.onLoad) {
    //   this.props.onLoad({count: header.vertexCount, progress: 1});
    // }

    this.setState(
      {
        loadTimeMs: Date.now() - this._loadStartMs,
        pointsCount: header.vertexCount,
        points: attributes.POSITION.value,
        viewState
      },
      this._rotateCamera
    );
  }

  _renderLayers() {
    const {pointsCount, points, selectedExample} = this.state;

    return [
      points &&
        new PointCloudLayer({
          // Layers can't reinitialize with new binary data
          id: `point-cloud-layer-${selectedExample}`,
          coordinateSystem: COORDINATE_SYSTEM.IDENTITY,
          numInstances: pointsCount,
          instancePositions: points,
          getNormal: [0, 1, 0],
          getColor: [255, 255, 255],
          opacity: 0.5,
          pointSize: 0.5
        })
    ];
  }

  _renderControlPanel() {
    const {selectedExample, selectedCategory, pointsCount, loadTimeMs} = this.state;
    return (
      <ControlPanel
        examples={FILE_INDEX}
        selectedCategory={selectedCategory}
        selectedExample={selectedExample}
        onExampleChange={this._onExampleChange}
        // Stats - put in separate stats panel?
        vertexCount={pointsCount}
        loadTimeMs={loadTimeMs}
      />
    );
  }

  render() {
    const {viewState} = this.state;

    return (
      <div>
        {this._renderControlPanel()}
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
      </div>
    );
  }
}

export function renderToDOM(container) {
  render(<App />, container);
}
