import {parse} from '@loaders.gl/core';
import {OBJLoader} from '@loaders.gl/obj';

const OBJ_URL =
  'https://raw.githubusercontent.com/uber-web/loaders.gl/master/modules/obj/test/data/cube.obj';

async function main() {
  const data = await parse(fetch(OBJ_URL), OBJLoader);
  document.getElementById('content').innerHTML = JSON.stringify(data, null, 2);
}

main();
