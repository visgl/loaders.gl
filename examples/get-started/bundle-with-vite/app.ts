import {parse} from '@loaders.gl/core';
import {GLTFLoader} from '@loaders.gl/gltf';
import {CompressedTextureLoader} from '@loaders.gl/textures';

const TEXTURE_URL =
  'https://raw.githubusercontent.com/visgl/loaders.gl/master/modules/textures/test/data/shannon-astc-12x12.pvr';

const GLTF_URL =
  'https://raw.githubusercontent.com/visgl/loaders.gl/master/modules/gltf/test/data/glb/DamagedHelmet.glb';

const getTextureBytes = (texture) => texture.map(level => level.data.byteLength).join(',')

async function main() {
  const texture = await parse(fetch(TEXTURE_URL), CompressedTextureLoader);
  const data = await parse(fetch(GLTF_URL), GLTFLoader, {gltf: {postProcess: false}});
  document.getElementById('content').innerHTML = 
    `Texture: [${getTextureBytes(texture)}] bytes <br/> <br/>GLTF = ` + JSON.stringify(data.json, null, 2);
}

main();
