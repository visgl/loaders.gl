import {parse} from '@loaders.gl/core';
import {OBJLoader} from '@loaders.gl/obj';
import {CompressedTextureLoader} from '@loaders.gl/textures';

const TEXTURE_URL =
  'https://raw.githubusercontent.com/uber-web/loaders.gl/master/modules/textures/test/data/shannon-astc-12x12.pvr';

const OBJ_URL =
  'https://raw.githubusercontent.com/uber-web/loaders.gl/master/modules/obj/test/data/cube.obj';

const getTextureBytes = (texture) => texture.map(level => level.data.byteLength).join(',')

async function main() {
  const texture = await parse(fetch(TEXTURE_URL), CompressedTextureLoader);
  const data = await parse(fetch(OBJ_URL), OBJLoader);
  document.getElementById('content').innerHTML = 
    `Texture: [${getTextureBytes(texture)}] bytes <br/> <br/>OBJ Mesh = ` + JSON.stringify(data, null, 2);
}

main();
