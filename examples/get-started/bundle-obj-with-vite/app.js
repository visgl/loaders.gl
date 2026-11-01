// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {parse} from '@loaders.gl/core';
import {OBJLoader} from '@loaders.gl/scene/obj';

const OBJ_URL =
  'https://raw.githubusercontent.com/visgl/loaders.gl/master/modules/scene/test/obj/data/cube.obj';

async function main() {
  const data = await parse(fetch(OBJ_URL), OBJLoader);
  document.getElementById('content').innerHTML = JSON.stringify(data, null, 2);
}

main();
