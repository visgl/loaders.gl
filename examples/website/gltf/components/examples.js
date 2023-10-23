
import {fetchFile} from '@loaders.gl/core';

export const GLTF_BASE_URL =
  'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/';
export const GLTF_MODEL_INDEX = `${GLTF_BASE_URL}model-index.json`;

export const GLTF_ENV_BASE_URL =
  'https://raw.githubusercontent.com/visgl/deck.gl-data/master/luma.gl/examples/gltf/';

export const GLTF_DEFAULT_MODEL = `${GLTF_BASE_URL}/DamagedHelmet/glTF-Binary/DamagedHelmet.glb`;

const GLTF_FIGHT_HELMET_URL =
  'https://raw.githubusercontent.com/visgl/deck.gl-data/master/formats/gltf/KHR_texture_basisu/FlightHelmet/FlightHelmetUastc.gltf';

export async function loadModelList() {
  const models = await fetchFile(GLTF_MODEL_INDEX).then((res) => res.json());
  models.push({
    name: 'FightHelmet',
    url: GLTF_FIGHT_HELMET_URL,
    variants: {
      glTF: ''
    }
  });
  return models;
}
