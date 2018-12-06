import {OrbitView, COORDINATE_SYSTEM} from 'deck.gl';
import {loadFile, PLYLoader} from 'loaders.gl';
import path from 'path';

import MeshLayer from './mesh-layer/mesh-layer';
import {convertToMesh} from './test-utils';

export const WIDTH = 800;
export const HEIGHT = 450;

const defaultViews = [new OrbitView({
  fov: 30,
  near: 0.001,
  far: 100
})];

const defaultData = [{position: [0, 0, 0]}];

export const TEST_CASES = [
  {
    name: 'ply-loader-test',
    views: defaultViews,
    viewState: {
      lookAt: [0, 0.1, 0],
      distance: 0.3
    },
    renderingTimes: 2,
    layers: [
      new MeshLayer({
        id: 'obj-loader-test',
        data: defaultData,
        opacity: 0.5,
        coordinateSystem: COORDINATE_SYSTEM.IDENTITY,
        getPosition: d => d.position,
        mesh: loadFile('test/modules/core/data/ply/bun_zipper.ply', PLYLoader).then(convertToMesh),
      })
    ],
    referenceImageUrl: './test/render/golden-images/ply-loader.png'
  }
];
