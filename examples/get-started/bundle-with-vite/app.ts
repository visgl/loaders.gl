import {parse} from '@loaders.gl/core';
import {OBJLoader} from '@loaders.gl/obj';
import {CompressedTextureLoader} from '@loaders.gl/textures';

const TEXTURE_URL =
  'https://raw.githubusercontent.com/uber-web/loaders.gl/master/modules/textures/test/data/shannon-astc-12x12.pvr';

const OBJ_URL =
  'https://raw.githubusercontent.com/uber-web/loaders.gl/master/modules/obj/test/data/cube.obj';

async function main() {
  const imageData = await parse(fetch(TEXTURE_URL), CompressedTextureLoader);
  const data = await parse(fetch(OBJ_URL), OBJLoader);
  document.getElementById('content').innerHTML = `Texture: bytes <br/> <br/>` + JSON.stringify(data, null, 2);
}

main();
