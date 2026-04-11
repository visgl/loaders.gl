// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {MapViewState, OrbitViewState} from '@deck.gl/core';
import {createDataSource} from '@loaders.gl/core';
import {COPCSource} from '@loaders.gl/copc';
import {PotreeSource} from '@loaders.gl/potree';
import type {PointCloudTilesetSource} from '@loaders.gl/tiles';

export type PointTileMapViewState = MapViewState & {
  nearZMultiplier?: number;
  farZMultiplier?: number;
};

export type PointTileOrbitViewState = OrbitViewState & {
  minZoom?: number;
  maxZoom?: number;
};

export type PointTileViewState = PointTileMapViewState | PointTileOrbitViewState;

export type PointTileSourceExample = {
  id: string;
  label: string;
  format: 'potree' | 'copc';
  viewMode: 'map' | 'orbit';
  datasetName: string;
  location: string;
  expectedAppearance: string;
  description: string;
  url: string;
  pointSize: number;
  color: [number, number, number];
  initialViewState?: Partial<PointTileViewState>;
  createPointCloudDataSource: () => PointCloudTilesetSource;
};

const POTREE_FARMLAND_URL =
  'https://raw.githubusercontent.com/visgl/deck.gl-data/refs/heads/master/formats/potree/1.8/3dm_32_291_5744_1_nw-converted';
const POTREE_LION_URL =
  'https://raw.githubusercontent.com/visgl/loaders.gl/master/modules/potree/test/data/lion_takanawa';
const COPC_ELLIPSOID_URL =
  'https://raw.githubusercontent.com/visgl/loaders.gl/master/modules/copc/test/data/ellipsoid.copc.laz';
const COPC_MIAMI_URL =
  'https://noaa-nos-coastal-lidar-pds.s3.amazonaws.com/laz/geoid18/9271/20180425_324741D.copc.laz';

function createPotreeDataSource(url: string): PointCloudTilesetSource {
  return createDataSource(url, [PotreeSource], {
    core: {type: 'potree'},
    potree: {}
  }) as PointCloudTilesetSource;
}

function createCopcDataSource(
  url: string,
  sourceCoordinateSystem?: string
): PointCloudTilesetSource {
  return createDataSource(url, [COPCSource], {
    core: {type: 'copc'},
    copc: {
      sourceCoordinateSystem
    }
  }) as PointCloudTilesetSource;
}

export const POINT_TILE_SOURCE_EXAMPLES: PointTileSourceExample[] = [
  {
    id: 'potree-lion',
    label: 'Lion Takanawa',
    format: 'potree',
    viewMode: 'orbit',
    datasetName: 'Lion Takanawa',
    location: 'Local Cartesian sample from the loaders.gl Potree test fixtures',
    expectedAppearance:
      'A compact statue scan in local coordinates, rendered in an orbit camera rather than on the map.',
    description: 'Small Potree 1.7 fixture used in loaders.gl tests.',
    url: POTREE_LION_URL,
    pointSize: 2,
    color: [214, 158, 46],
    initialViewState: {
      target: [1.6, -0.45, 4.9],
      rotationX: 25,
      rotationOrbit: 30,
      minZoom: 0,
      maxZoom: 12,
      zoom: 7.2
    },
    createPointCloudDataSource: () => createPotreeDataSource(POTREE_LION_URL)
  },
  {
    id: 'potree-farmland',
    label: 'Dutch Farmland LIDAR',
    format: 'potree',
    viewMode: 'map',
    datasetName: 'Dutch Farmland LIDAR',
    location: 'Near Bennekom, Netherlands',
    expectedAppearance:
      'A real outdoor point cloud over roads and farm fields, not a dense landmark scan.',
    description: 'Point-cloud octree streamed from a georeferenced Potree 1.8 dataset.',
    url: POTREE_FARMLAND_URL,
    pointSize: 2,
    color: [55, 126, 184],
    createPointCloudDataSource: () => createPotreeDataSource(POTREE_FARMLAND_URL)
  },
  {
    id: 'copc-ellipsoid',
    label: 'Ellis Island Ellipsoid',
    format: 'copc',
    viewMode: 'map',
    datasetName: 'Ellis Island Ellipsoid',
    location: 'Ellis Island, New York',
    expectedAppearance:
      'A synthetic ellipsoid near Ellis Island, not a real landmark scan.',
    description: 'Small synthetic COPC fixture loaded through hierarchy pages.',
    url: COPC_ELLIPSOID_URL,
    pointSize: 2,
    color: [208, 97, 40],
    createPointCloudDataSource: () => createCopcDataSource(COPC_ELLIPSOID_URL)
  },
  {
    id: 'copc-miami',
    label: 'COPC Miami',
    format: 'copc',
    viewMode: 'map',
    datasetName: 'Miami Coastal LIDAR',
    location: 'Miami-Dade County, Florida',
    expectedAppearance:
      'A dense coastal lidar strip with ground and urban features from a NOAA collection.',
    description: 'Public NOAA coastal lidar COPC tile in a projected UTM coordinate system.',
    url: COPC_MIAMI_URL,
    pointSize: 1.5,
    color: [36, 160, 117],
    createPointCloudDataSource: () => createCopcDataSource(COPC_MIAMI_URL)
  }
];

export const DEFAULT_EXAMPLE_ID = POINT_TILE_SOURCE_EXAMPLES[0]?.id || 'potree-farmland';
