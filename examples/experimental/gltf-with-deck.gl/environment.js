import {GLTFEnvironment} from '@luma.gl/experimental';
import GL from '@luma.gl/constants';

const GLTF_ENV_BASE_URL =
  'https://raw.githubusercontent.com/uber-common/deck.gl-data/master/luma.gl/examples/gltf/';

const CUBE_FACE_TO_DIRECTION = {
  [GL.TEXTURE_CUBE_MAP_POSITIVE_X]: 'right',
  [GL.TEXTURE_CUBE_MAP_NEGATIVE_X]: 'left',
  [GL.TEXTURE_CUBE_MAP_POSITIVE_Y]: 'top',
  [GL.TEXTURE_CUBE_MAP_NEGATIVE_Y]: 'bottom',
  [GL.TEXTURE_CUBE_MAP_POSITIVE_Z]: 'front',
  [GL.TEXTURE_CUBE_MAP_NEGATIVE_Z]: 'back'
};

export default function loadIBLEnvironment(gl) {
  return new GLTFEnvironment(gl, {
    brdfLutUrl: `${GLTF_ENV_BASE_URL}/brdfLUT.png`,
    getTexUrl: (type, dir, mipLevel) =>
      `${GLTF_ENV_BASE_URL}/papermill/${type}/${type}_${CUBE_FACE_TO_DIRECTION[dir]}_${mipLevel}.jpg`
  });
}
