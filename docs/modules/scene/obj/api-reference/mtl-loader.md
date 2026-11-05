---
title: MTLLoader
description: Read Wavefront MTL material libraries used alongside OBJ meshes.
---

`MTLLoader` reads Wavefront `.mtl` files and returns an array of named materials. Load the material library separately from the [OBJ geometry](./obj-loader.md).

```ts
import {load} from '@loaders.gl/core';
import {MTLLoader} from '@loaders.gl/scene/obj';

const materials = await load('model.mtl', MTLLoader);
```

For synchronous parsing, import `MTLLoaderWithParser` from `@loaders.gl/scene/mtl-loader`.

```ts
import {parseSync} from '@loaders.gl/core';
import {MTLLoaderWithParser} from '@loaders.gl/scene/mtl-loader';

const materials = parseSync('newmtl Red\nKd 1 0 0', MTLLoaderWithParser);
```

The parser reads ambient, diffuse, specular, and emissive RGB values, plus shininess, refraction, and illumination settings. Diffuse, specular, and emissive texture references are returned as strings from the file. Applications resolve those references and load the textures separately. Other directives, including opacity and bump maps, are ignored.
