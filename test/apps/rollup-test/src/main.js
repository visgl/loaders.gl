import { parse } from '@loaders.gl/core';
import { OBJLoader } from "@loaders.gl/obj";

async function test() {
    const data = await parse(fetch('https://raw.githubusercontent.com/uber-web/loaders.gl/master/modules/obj/test/data/cube.obj'), OBJLoader);
    console.log(data)
}

test();