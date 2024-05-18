// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import React, {useState} from 'react';
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

import {ExamplePanel, Example, MetadataViewer} from './components/example-panel';
import {EXAMPLES, INITIAL_CATEGORY_NAME, INITIAL_EXAMPLE_NAME} from './examples';

// Additional format support can be added here, see
const POINT_CLOUD_LOADERS = [DracoLoader, LASLoader, PLYLoader, PCDLoader, OBJLoader];

// TODO - move away from registerLoaders
registerLoaders(POINT_CLOUD_LOADERS);

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

/** Application props (used by website MDX pages to configure example */
type AppProps = {
  /** Controls which examples are shown */
  format?: string;
  /** Show tile borders */
  showTileBorders?: boolean;
  /** On tiles load */
  onTilesLoad?: Function;
  /** Any informational text to display in the overlay */
  children?: React.Children;
};

/** Application state */
type AppState = {
  /** Currently active tile source */
  pointData: any;
  /** Metadata loaded from active tile source */
  metadata: string;
  /**Current view state */
  viewState: Record<string, number>;
};

export default function App(props: AppProps = {}) {
  const [state, setState] = useState<AppState>({
    viewState: INITIAL_VIEW_STATE,
    pointData: null,
    metadata: null,
    // TODO - handle errors
    // error: null
  });

  const {pointData, selectedExample} = state;
  
  const layers = [
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
  
  return (
    <div style={{position: 'relative', height: '100%'}}>
      <ExamplePanel
        title="Tileset Metadata"
        examples={EXAMPLES}
        format={props.format}
        initialCategoryName={INITIAL_CATEGORY_NAME}
        initialExampleName={INITIAL_EXAMPLE_NAME}
        onExampleChange={onExampleChange}
      >
        <MetadataViewer metadata={''} />
        {props.children}
        {/* error ? <div style={{color: 'red'}}>{error}</div> : '' */}
        <pre style={{textAlign: 'center', margin: 0}}>
          {/* long/lat: {viewState.longitude.toFixed(5)}, {viewState.latitude.toFixed(5)}, zoom:{' '} */}
          {/* viewState.zoom.toFixed(2) 
                  vertexCount={pointData && pointData.length}
        loadTimeMs={loadTimeMs}
        */}
        </pre>
      </ExamplePanel>

      <DeckGL
        layers={layers}
        views={new OrbitView({})}
        viewState={state.viewState}
        initialViewState={state.viewState}
        controller={{inertia: true}}
        onViewStateChange={onViewStateChange}
        // TODO - move to view
        parameters={{
          clearColor: [0.07, 0.14, 0.19, 1]
        }}
        getTooltip={getTooltip}
      >

      </DeckGL>
    </div>
  );

  /*
    <Attributions attributions={metadata?.attributions} />
    render() {
    const {viewState} = state;
    // eslint-disable-next-line react/prop-types
    const {panel = true} = props;
    return (
      <div style={{position: 'relative', height: '100%'}}>
        <div style={{visibility: panel ? 'default' : 'hidden'}}>{_renderControlPanel()}</div>
        <DeckGL
          views={new OrbitView()}
          viewState={viewState}
          controller={{inertia: true}}
          onViewStateChange={_onViewStateChange}
          layers={_renderLayers()}
          parameters={{
            clearColor: [0.07, 0.14, 0.19, 1]
          }}
        />
      </div>
    );
  }
  */

  function onViewStateChange({viewState}) {
    setState(state => ({...state, viewState}));
  }

  function rotateCamera() {
    const {viewState} = state;
    setState(state => ({
      ...state, 
      viewState: {
        ...viewState,
        rotationOrbit: viewState.rotationOrbit + 10,
        transitionDuration: 600,
        transitionInterpolator,
        onTransitionEnd: rotateCamera
      }
    }));
  }


  async function onExampleChange(example: Example): Promise<void> {
    // TODO - timing could be done automatically by `load`.
    
    setState(state => ({
      ...state, 
      pointData: null,
      metadata: null,
      loadTimeMs: undefined,
      loadStartMs: Date.now()   
    }));

    const {url} = example;
    const {header, loaderData, attributes, progress} = await load(url);

    // metadata from LAZ file header
    const {maxs, mins} =
      loaderData.header?.mins && loaderData.header?.maxs
        ? loaderData.header
        : calculateBounds(attributes);

    let {viewState} = state;

    // File contains bounding box info
    viewState = {
      ...INITIAL_VIEW_STATE,
      target: [(mins[0] + maxs[0]) / 2, (mins[1] + maxs[1]) / 2, (mins[2] + maxs[2]) / 2],
      zoom: Math.log2(window.innerWidth / (maxs[0] - mins[0])) - 1
    };

    setState(
      state => ({
        ...state,
        loadTimeMs: Date.now() - state.loadStartMs,
        // TODO - Some popular "point cloud" formats (PLY) can also generate indexed meshes
        // in which case the vertex count is not correct for display as points
        // Proposal: Consider adding a `mesh.points` or `mesh.pointcloud` option to mesh loaders
        // in which case the loader throws away indices and just return the vertices?
        pointData: convertLoadersMeshToDeckPointCloudData(attributes),
        viewState
      }),
      rotateCamera
    );
  }

  /**
  async function onExampleChange2(args: {example: Example;}) {
    const url = example.data;
    try {

      (async () => {
        const metadata = await tileSource.getMetadata();
        let initialViewState = {...state.viewState, ...example.viewState};
        initialViewState = adjustViewStateToMetadata(initialViewState, metadata);

        setState((state) => ({
          ...state,
          initialViewState,
          metadata: metadata ? JSON.stringify(metadata, null, 2) : ''
        }));
      })();
    } catch (error) {
      console.error('Failed to load data', url, error);
      setState((state) => ({...state, error: `Could not load ${exampleName}: ${error.message}`}));
    }
  }
}

function getTooltip(info) {
  if (info.tile) {
    const {x, y, z} = info.tile.index;
    return `tile: x: ${x}, y: ${y}, z: ${z}`;
  }
  return null;
}
 */

// HELPER FUNCTIONS

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


export function renderToDOM(container) {
  render(<App />, container);
}
