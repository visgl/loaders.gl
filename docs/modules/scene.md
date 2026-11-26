# @loaders.gl/scene

Load scene graphs and meshes from glTF/GLB, OBJ/MTL, OpenUSD and Draco. Install one package and use the format entrypoint appropriate for the asset.

| Format                                                                                                        | Subpath                                                                         | Description                                            |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------ |
| [![](/images/format-logos/draco-logo.svg)](https://loaders.gl/docs/modules/scene/draco/formats/draco.md)      | [Package root](https://loaders.gl/docs/modules/scene/draco.md)                  | Draco compressed meshes and point clouds               |
| [![](/images/format-logos/gltf-logo.svg)](https://loaders.gl/docs/modules/scene/gltf/formats/gltf.md)         | [`/gltf`](https://loaders.gl/docs/modules/scene/gltf.md)                        | glTF and GLB                                           |
| —                                                                                                             | [`/obj`](https://loaders.gl/docs/modules/scene/obj.md)                          | OBJ and MTL                                            |
| [![](/images/format-logos/openusd-logo.svg)OpenUSD](https://loaders.gl/docs/modules/scene/usd/formats/usd.md) | [`/usd`](https://loaders.gl/docs/modules/scene/usd/api-reference/usd-loader.md) | USD text, initial binary crate subset, and stored USDZ |

```
npm install @loaders.gl/core @loaders.gl/scene
```

```
import {parse} from '@loaders.gl/core';

import {GLTFLoader} from '@loaders.gl/scene/gltf';

import {OBJLoader} from '@loaders.gl/scene/obj';

import {USDLoader} from '@loaders.gl/scene/usd';
```

These exports are metadata-only loaders. Async core APIs preload implementations; synchronous APIs need a parser-bearing loader such as `GLTFLoaderWithParser` from `@loaders.gl/scene/gltf`. Writers and advanced glTF APIs remain under their format subpaths. glTF's schemas are available from `@loaders.gl/scene/gltf/schema` and its explicit JSON schema exports.

OBJ's transport helpers come directly from core and do not require the tables package. Draco, images and textures remain independent shared dependencies. See [Modules](https://loaders.gl/docs/modules.md) for the complete package map.

Focused parser subpaths load individual implementations. For example, import the implementation from `@loaders.gl/scene/obj/parser`. The format metadata loaders use these subpaths in `preload()`.

## Sources and credits[​](#sources-and-credits "Direct link to Sources and credits")

See the [package source and license inventory](https://github.com/visgl/loaders.gl/blob/master/modules/scene/THIRD-PARTY-NOTICES.md) and the project-wide [Attributions and Credits](https://loaders.gl/docs/references-and-credits.md).

## Format guides[​](#format-guides "Direct link to Format guides")

* [STL](https://loaders.gl/docs/modules/scene/stl.md)

* [Draco3D](https://loaders.gl/docs/modules/scene/draco/formats/draco.md)

* [MaterialX](https://loaders.gl/docs/modules/scene/formats/materialx.md)

* [GLB binary](https://loaders.gl/docs/modules/scene/gltf/formats/glb.md)

* [glTF](https://loaders.gl/docs/modules/scene/gltf/formats/gltf.md)

* [Wavefront OBJ](https://loaders.gl/docs/modules/scene/obj/formats/obj.md)

* [OpenUSD](https://loaders.gl/docs/modules/scene/usd/formats/usd.md)

## Package exports[​](#package-exports "Direct link to Package exports")

All exported subpaths (<!-- -->41<!-- -->)

These are the package's public exports, including format entry points, parsers, writers, sources, and worker assets.

| Format                                                                                                        | Import subpath                                   |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
|                                                                                                               | `@loaders.gl/scene/api`                          |
| [![](/images/format-logos/draco-logo.svg)](https://loaders.gl/docs/modules/scene/draco/formats/draco.md)      | `@loaders.gl/scene/draco`                        |
| [![](/images/format-logos/draco-logo.svg)](https://loaders.gl/docs/modules/scene/draco/formats/draco.md)      | `@loaders.gl/scene/draco-worker-node.js`         |
| [![](/images/format-logos/draco-logo.svg)](https://loaders.gl/docs/modules/scene/draco/formats/draco.md)      | `@loaders.gl/scene/draco-worker.js`              |
| [![](/images/format-logos/draco-logo.svg)](https://loaders.gl/docs/modules/scene/draco/formats/draco.md)      | `@loaders.gl/scene/draco-writer-worker-node.cjs` |
| [![](/images/format-logos/draco-logo.svg)](https://loaders.gl/docs/modules/scene/draco/formats/draco.md)      | `@loaders.gl/scene/draco-writer-worker-node.js`  |
| [![](/images/format-logos/draco-logo.svg)](https://loaders.gl/docs/modules/scene/draco/formats/draco.md)      | `@loaders.gl/scene/draco-writer-worker.js`       |
| [![](/images/format-logos/draco-logo.svg)](https://loaders.gl/docs/modules/scene/draco/formats/draco.md)      | `@loaders.gl/scene/draco/bundled`                |
| [![](/images/format-logos/draco-logo.svg)](https://loaders.gl/docs/modules/scene/draco/formats/draco.md)      | `@loaders.gl/scene/draco/draco3d-parser`         |
| [![](/images/format-logos/draco-logo.svg)](https://loaders.gl/docs/modules/scene/draco/formats/draco.md)      | `@loaders.gl/scene/draco/javascript-parser`      |
| [![](/images/format-logos/draco-logo.svg)](https://loaders.gl/docs/modules/scene/draco/formats/draco.md)      | `@loaders.gl/scene/draco/wasm-parser`            |
| [![](/images/format-logos/gltf-logo.svg)GLB](https://loaders.gl/docs/modules/scene/gltf/formats/glb.md)       | `@loaders.gl/scene/glb`                          |
| [![](/images/format-logos/gltf-logo.svg)GLB](https://loaders.gl/docs/modules/scene/gltf/formats/glb.md)       | `@loaders.gl/scene/glb/bundled`                  |
| [![](/images/format-logos/gltf-logo.svg)GLB](https://loaders.gl/docs/modules/scene/gltf/formats/glb.md)       | `@loaders.gl/scene/glb/parser`                   |
| [![](/images/format-logos/gltf-logo.svg)](https://loaders.gl/docs/modules/scene/gltf/formats/gltf.md)         | `@loaders.gl/scene/gltf`                         |
| [![](/images/format-logos/gltf-logo.svg)](https://loaders.gl/docs/modules/scene/gltf/formats/gltf.md)         | `@loaders.gl/scene/gltf/bundled`                 |
| [![](/images/format-logos/gltf-logo.svg)](https://loaders.gl/docs/modules/scene/gltf/formats/gltf.md)         | `@loaders.gl/scene/gltf/gltf-1.schema.json`      |
| [![](/images/format-logos/gltf-logo.svg)](https://loaders.gl/docs/modules/scene/gltf/formats/gltf.md)         | `@loaders.gl/scene/gltf/gltf-2.1.schema.json`    |
| [![](/images/format-logos/gltf-logo.svg)](https://loaders.gl/docs/modules/scene/gltf/formats/gltf.md)         | `@loaders.gl/scene/gltf/gltf-2.schema.json`      |
| [![](/images/format-logos/gltf-logo.svg)](https://loaders.gl/docs/modules/scene/gltf/formats/gltf.md)         | `@loaders.gl/scene/gltf/gltf-all.schema.json`    |
| [![](/images/format-logos/gltf-logo.svg)](https://loaders.gl/docs/modules/scene/gltf/formats/gltf.md)         | `@loaders.gl/scene/gltf/gltf.schema.json`        |
| [![](/images/format-logos/gltf-logo.svg)](https://loaders.gl/docs/modules/scene/gltf/formats/gltf.md)         | `@loaders.gl/scene/gltf/mesh-arrow`              |
| [![](/images/format-logos/gltf-logo.svg)](https://loaders.gl/docs/modules/scene/gltf/formats/gltf.md)         | `@loaders.gl/scene/gltf/parser`                  |
| [![](/images/format-logos/gltf-logo.svg)](https://loaders.gl/docs/modules/scene/gltf/formats/gltf.md)         | `@loaders.gl/scene/gltf/schema`                  |
| [![](/images/format-logos/gltf-logo.svg)](https://loaders.gl/docs/modules/scene/gltf/formats/gltf.md)         | `@loaders.gl/scene/gltf/schemas/*`               |
|                                                                                                               | `@loaders.gl/scene/materialx`                    |
|                                                                                                               | `@loaders.gl/scene/materialx/bundled`            |
|                                                                                                               | `@loaders.gl/scene/materialx/parser`             |
|                                                                                                               | `@loaders.gl/scene/mtl`                          |
|                                                                                                               | `@loaders.gl/scene/mtl/bundled`                  |
|                                                                                                               | `@loaders.gl/scene/mtl/parser`                   |
|                                                                                                               | `@loaders.gl/scene/obj`                          |
|                                                                                                               | `@loaders.gl/scene/obj-worker.js`                |
|                                                                                                               | `@loaders.gl/scene/obj/bundled`                  |
|                                                                                                               | `@loaders.gl/scene/obj/parser`                   |
|                                                                                                               | `@loaders.gl/scene/stl`                          |
|                                                                                                               | `@loaders.gl/scene/stl/bundled`                  |
|                                                                                                               | `@loaders.gl/scene/stl/parser`                   |
| [![](/images/format-logos/openusd-logo.svg)OpenUSD](https://loaders.gl/docs/modules/scene/usd/formats/usd.md) | `@loaders.gl/scene/usd`                          |
| [![](/images/format-logos/openusd-logo.svg)OpenUSD](https://loaders.gl/docs/modules/scene/usd/formats/usd.md) | `@loaders.gl/scene/usd/bundled`                  |
| [![](/images/format-logos/openusd-logo.svg)OpenUSD](https://loaders.gl/docs/modules/scene/usd/formats/usd.md) | `@loaders.gl/scene/usd/parser`                   |
