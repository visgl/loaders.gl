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
import {load, registerLoaders} from '@loaders.gl/core';

import ControlPanel from './components/control-panel';
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

// basic helper method to calculate a models upper and lower bounds
function calculateBounds(attributes) {
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

function convertLoadersMeshToDeckPointCloudData(attributes) {
  const deckAttributes = {
    getPosition: attributes.POSITION
  };
  if (attributes.COLOR_0) {
    deckAttributes.getColor = attributes.COLOR_0;
  }
  // Check PointCloudLayer docs for other supported props?
  return {
    length: attributes.POSITION.value.length / attributes.POSITION.size,
    attributes: deckAttributes
  };
}

export default class App extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      viewState: INITIAL_VIEW_STATE,
      pointData: null,
      // control panel
      selectedExample: 'Richmond Azaelias',
      selectedCategory: 'PLY'
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
        rotationOrbit: viewState.rotationOrbit + 10,
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
      pointData: null,
      loadTimeMs: undefined
    });
    load(uri).then(this._onLoad.bind(this));
  }

  _onLoad({header, loaderData, attributes, progress}) {
    // metadata from LAZ file header
    const {maxs, mins} =
      loaderData.header.mins && loaderData.header.maxs
        ? loaderData.header
        : calculateBounds(attributes);

    let {viewState} = this.state;

    // File contains bounding box info
    viewState = {
      ...INITIAL_VIEW_STATE,
      target: [(mins[0] + maxs[0]) / 2, (mins[1] + maxs[1]) / 2, (mins[2] + maxs[2]) / 2],
      zoom: Math.log2(window.innerWidth / (maxs[0] - mins[0])) - 1
    };

    this.setState(
      {
        loadTimeMs: Date.now() - this._loadStartMs,
        // TODO - Some popular "point cloud" formats (PLY) can also generate indexed meshes
        // in which case the vertex count is not correct for display as points
        // Proposal: Consider adding a `mesh.points` or `mesh.pointcloud` option to mesh loaders
        // in which case the loader throws away indices and just return the vertices?
        pointData: convertLoadersMeshToDeckPointCloudData(attributes),
        viewState
      },
      this._rotateCamera
    );
  }

  _renderLayers() {
    const {pointData, selectedExample} = this.state;

    return [
      pointData &&
        new PointCloudLayer({
          // Layers can't reinitialize with new binary data
          id: `point-cloud-layer-${selectedExample}`,
          coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
          data: pointData,
          getNormal: [0, 1, 0],
          getColor: [255, 255, 255],
          opacity: 0.5,
          pointSize: 0.5
        })
    ];
  }

  _renderControlPanel() {
    const {selectedExample, pointData, selectedCategory, loadTimeMs} = this.state;
    return (
      <ControlPanel
        examples={FILE_INDEX}
        selectedCategory={selectedCategory}
        selectedExample={selectedExample}
        onExampleChange={this._onExampleChange}
        vertexCount={pointData && pointData.length}
        loadTimeMs={loadTimeMs}
      />
    );
  }

  render() {
    const {viewState} = this.state;
    // eslint-disable-next-line react/prop-types
    const {panel = true} = this.props;
    return (
      <div style={{position: 'relative', height: '100%'}}>
        <div style={{visibility: panel ? 'default' : 'hidden'}}>{this._renderControlPanel()}</div>
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
