export const GLTF_BASE_URL =
  'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/';
export const GLTF_MODEL_INDEX = `${GLTF_BASE_URL}model-index.json`;

export const GLTF_ENV_BASE_URL =
  'https://raw.githubusercontent.com/uber-common/deck.gl-data/master/luma.gl/examples/gltf/';

export const GLTF_DEFAULT_MODEL = 'DamagedHelmet/glTF-Binary/DamagedHelmet.glb';

export async function loadModelList() {
  return await fetch(GLTF_MODEL_INDEX).then((res) => res.json());
}
