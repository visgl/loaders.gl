// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {parse} from '@loaders.gl/core';
import {OBJLoader} from '@loaders.gl/obj';

const OBJ_URL =
  'https://raw.githubusercontent.com/visgl/loaders.gl/master/modules/obj/test/data/cube.obj';

async function main() {
  const header = document.createElement('pre');
  header.innerHTML = 'Loading mesh...';
  document.body.append(header);

  const data = await parse(fetch(OBJ_URL), OBJLoader);

  const content = document.createElement('pre');
  content.innerHTML = JSON.stringify(data, null, 2);
  document.body.append(content);
}

main();
