// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import React, {useState, useEffect} from 'react';
import {render} from 'react-dom';

import DeckGL from '@deck.gl/react';
import {COORDINATE_SYSTEM, OrbitView, LinearInterpolator} from '@deck.gl/core';
import {PointCloudLayer} from '@deck.gl/layers';

import {load} from '@loaders.gl/core';
import {getDeckBinaryDataFromArrowMesh, getBoundingBoxFromArrowPositions} from '@loaders.gl/geoarrow';
import type {Mesh} from '@loaders.gl/schema';
import {convertTableToMesh} from '@loaders.gl/schema-utils';

import {DracoArrowLoader} from '@loaders.gl/draco';
import {LASArrowLoader} from '@loaders.gl/las';
import {PLYArrowLoader} from '@loaders.gl/ply';
import {PCDArrowLoader} from '@loaders.gl/pcd';
import {OBJArrowLoader} from '@loaders.gl/obj';

import {ExamplePanel, Example, MetadataViewer} from './components/example-panel';
import {EXAMPLES} from './examples';

// Additional format support can be added here, see
const POINT_CLOUD_LOADERS = [DracoArrowLoader, LASArrowLoader, PLYArrowLoader, PCDArrowLoader, OBJArrowLoader];

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
    metadata: null
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
        getColor: [200, 200, 255],
        opacity: 0.5,
        pointSize: 0.5
      })
  ];

  return (
    <div style={{position: 'relative', height: '100%'}}>
      <ExamplePanel
        examples={EXAMPLES}
        format={props.format}
        onExampleChange={onExampleChange}
      >
        {props.children}
        {/* error ? <div style={{color: 'red'}}>{error}</div> : '' */}
        <PointCloudStats
          vertexCount={pointData?.length || 0}
          loadTimeMs={state.loadTimeMs}
          loadStartMs={state.loadStartMs}
        />
        <h3>Schema and Metadata</h3>
        <MetadataViewer metadata={state.metadata} />
      </ExamplePanel>

      <DeckGL
        layers={layers}
        views={new OrbitView({})}
        viewState={state.viewState}
        controller={{inertia: true}}
        onViewStateChange={onViewStateChange}
        // TODO - move to view
        parameters={{
          clearColor: [0.07, 0.14, 0.19, 1]
        }}
      ></DeckGL>
    </div>
  );

  /* <Attributions attributions={metadata?.attributions} /> */

  function onViewStateChange({viewState}) {
    setState((state) => ({...state, viewState}));
  }

  function rotateCamera() {
    console.log('rotateCamera', state.viewState)
    setState((state) => ({
      ...state,
      viewState: {
        ...state.viewState,
        rotationOrbit: state.viewState.rotationOrbit + 10,
        transitionDuration: 600,
        transitionInterpolator,
        onTransitionEnd: rotateCamera
      }
    }));
  }

  async function onExampleChange({
    example,
    exampleName
  }: {
    example: Example;
    exampleName: string;
  }): Promise<void> {
    // TODO - timing could be done automatically by `load`.

    setState((state) => ({
      ...state,
      pointData: null,
      metadata: null,
      loadTimeMs: undefined,
      loadStartMs: Date.now()
    }));

    const {url} = example;
    try {
      const arrowTable = await load(url, POINT_CLOUD_LOADERS);
      const pointCloud = convertTableToMesh(arrowTable);
      const {schema, header, loaderData, attributes} = pointCloud;

      const viewState = getViewState(state, arrowTable, loaderData, attributes);

      const metadata = JSON.stringify({schema, header, loaderData}, null, 2);

      const pointData = getDeckBinaryDataFromArrowMesh(arrowTable.data);

      setState((state) => ({
        ...state,
        loadTimeMs: Date.now() - state.loadStartMs,
        loadStartMs: undefined,
        // TODO - Some popular "point cloud" formats (PLY) can also generate indexed meshes
        // in which case the vertex count is not correct for display as points
        // Proposal: Consider adding a `mesh.points` or `mesh.pointcloud` option to mesh loaders
        // in which case the loader throws away indices and just return the vertices?
        pointData,
        viewState,
        metadata
      }));

      rotateCamera();
    } catch (error) {
      console.error('Failed to load data', url, error);
      setState((state) => ({...state, error: `Could not load ${exampleName}: ${error.message}`}));
    }
  }
}

/**
 * Component that renders formatted stats for the point cloud
 * @param props
 * @returns
 */
function PointCloudStats(props: {vertexCount: number; loadTimeMs: number; loadStartMs: number}) {
  const {vertexCount, loadTimeMs, loadStartMs} = props;
  let message;
  if (vertexCount >= 1e7) {
    message = `${(vertexCount / 1e6).toFixed(0)}M`;
  } else if (vertexCount >= 1e6) {
    message = `${(vertexCount / 1e6).toFixed(1)}M`;
  } else if (vertexCount >= 1e4) {
    message = `${(vertexCount / 1e3).toFixed(0)}K`;
  } else if (vertexCount >= 1e3) {
    message = `${(vertexCount / 1e3).toFixed(1)}K`;
  } else {
    message = `${vertexCount}`;
  }

  let loadMessage = '';
  if (loadTimeMs) {
    loadMessage = `Load time: ${(loadTimeMs / 1000).toFixed(1)}s`;
  } else if (loadStartMs) {
    loadMessage = 'Loading...';
  }

  return (
    <pre style={{textAlign: 'center', margin: 0}}>
      <div>{Number.isFinite(vertexCount) ? `Points: ${message}` : null}</div>
      <div>
        {loadMessage}
      </div>
    </pre>
  );
}

// function getTooltip(info) {
//   if (info.tile) {
//     const {x, y, z} = info.tile.index;
//     return `tile: x: ${x}, y: ${y}, z: ${z}`;
//   }
//   return null;
// }

// HELPER FUNCTIONS

function getViewState(state: AppState, arrowTable: ArrowTable, loaderData, attributes) {
  // metadata from LAZ file header
  const [mins, maxs] =
    loaderData?.header?.mins && loaderData?.header?.maxs
      ? [loaderData?.header?.mins, loaderData?.header?.maxs]
      : getBoundingBoxFromArrowPositions(arrowTable.data.getChild('POSITION'));

  let {viewState} = state;

  // File contains bounding box info
  return {
    ...INITIAL_VIEW_STATE,
    ...viewState,
    target: [(mins[0] + maxs[0]) / 2, (mins[1] + maxs[1]) / 2, (mins[2] + maxs[2]) / 2],
    zoom: Math.log2(window.innerWidth / (maxs[0] - mins[0])) - 1
  };
}

export function renderToDOM(container) {
  render(<App />, container);
}
