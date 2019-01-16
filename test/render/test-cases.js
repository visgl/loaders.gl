import {OrbitView, COORDINATE_SYSTEM} from '@deck.gl/core';
import {PLYLoader} from '@loaders.gl/ply';

import MeshLayer from './mesh-layer/mesh-layer';
import {convertToMesh} from './test-utils';

const PLY_BINARY =
  // loadBinaryFile(path.resolve(__dirname, '../../data/ply/bun_zipper.ply')) ||
  require('test-data/ply/bun_zipper.ply');

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
        id: 'ply-loader-test',
        data: defaultData,
        opacity: 0.5,
        coordinateSystem: COORDINATE_SYSTEM.IDENTITY,
        getPosition: d => d.position,
        mesh: convertToMesh(PLYLoader.parseBinary(PLY_BINARY))
      })
    ],
    referenceImageUrl: './test/render/golden-images/ply-loader.png'
  }
  /*
  ,
  {
    name: 'drc-loader-test',
    views: defaultViews,
    viewState: {
      lookAt: [0, 0.1, 0],
      distance: 0.3
    },
    renderingTimes: 2,
    layers: [
      new MeshLayer({
        id: 'drc-loader-test',
        data: defaultData,
        opacity: 0.5,
        coordinateSystem: COORDINATE_SYSTEM.IDENTITY,
        getPosition: d => d.position,
        mesh: loadFile('test/modules/core/data/drc/bunny.drc', PLYLoader).then(convertToMesh)
      })
    ],
    referenceImageUrl: './test/render/golden-images/ply-loader.png'
  }
  */
];
