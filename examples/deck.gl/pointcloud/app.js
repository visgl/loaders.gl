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

import {load, registerLoaders, setLoaderOptions} from '@loaders.gl/core';

import ControlPanel from './components/control-panel';
// import fileDrop from './components/file-drop';

import FILE_INDEX from './file-index';

// Additional format support can be added here, see
registerLoaders([DracoLoader, LASLoader, PLYLoader, PCDLoader, OBJLoader]);
// TODO fix WorkerLoader
setLoaderOptions({worker: false});

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
      colors: null,
      // control panel
      droppedFile: null,
      selectedExample: 'Indoor Scan 800K',
      selectedCategory: 'LAZ'
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
    this._loadStartMs = Date.now();
    this.setState({
      selectedCategory,
      selectedExample,
      pointsCount: null,
      points: null,
      loadTimeMs: undefined
    });
    load(uri).then(this._onLoad.bind(this));
  }

  _getBounds(attributes) {
    const mins = [Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE];
    const maxs = [Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE];

    const pointSize = attributes.POSITION.size;
    const pointCount = attributes.POSITION.value.length / pointSize;

    for (let i = 0; i < pointCount; i += pointSize) {
      const x = attributes.POSITION.value[i];
      const y = attributes.POSITION.value[i + 1];
      const z = attributes.POSITION.value[i + 2];

      if (x < mins[0]) mins[0] = x;
      else if (x > maxs[0]) maxs[0] = x;

      if (y < mins[1]) mins[1] = y;
      else if (y > maxs[1]) maxs[1] = y;

      if (z < mins[2]) mins[2] = z;
      else if (z > maxs[2]) maxs[2] = z;
    }

    return {mins, maxs};
  }

  _onLoad({header, loaderData, attributes, progress}) {
    // metadata from LAZ file header
    const {maxs, mins} =
      loaderData.header.mins && loaderData.header.maxs
        ? loaderData.header
        : this._getBounds(attributes);

    let {viewState} = this.state;

    // File contains bounding box info
    viewState = {
      ...INITIAL_VIEW_STATE,
      target: [(mins[0] + maxs[0]) / 2, (mins[1] + maxs[1]) / 2, (mins[2] + maxs[2]) / 2],
      /* global window */
      zoom: Math.log2(window.innerWidth / (maxs[0] - mins[0])) - 1
    };

    this.setState(
      {
        loadTimeMs: Date.now() - this._loadStartMs,
        // TODO - Some popular "point cloud" formats (PLY) can also generate indexed meshes
        // in which case the vertex count is not correct for display as points
        // Proposal: Consider adding a `mesh.points` or `mesh.pointcloud` option to mesh loaders
        // in which case the loader throws away indices and just return the vertices?
        pointsCount: attributes.POSITION.value.length / attributes.POSITION.size,
        points: attributes.POSITION.value,
        colors: attributes.COLOR_0 ? attributes.COLOR_0.value : null,
        viewState
      },
      this._rotateCamera
    );
  }

  _renderLayers() {
    const {pointsCount, points, colors, selectedExample} = this.state;

    //
    const data = {
      attributes: {
        getPosition: {value: points, size: 3},
        getColor: colors ? {value: colors, size: 3} : null
      }
    };

    return [
      points &&
        new PointCloudLayer({
          // Layers can't reinitialize with new binary data
          id: `point-cloud-layer-${selectedExample}`,
          coordinateSystem: COORDINATE_SYSTEM.IDENTITY,
          numInstances: pointsCount,
          data,
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
