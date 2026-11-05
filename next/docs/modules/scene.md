# @loaders.gl/scene

Load scene graphs and meshes from glTF/GLB, OBJ/MTL, OpenUSD and Draco. Install one package and use the format entrypoint appropriate for the asset.

| Format                                                                                                                       | Subpath                                                                                   | Description                              |
| ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------- |
| [![](/next/images/format-logos/draco-logo.svg)](https://loaders.gl/next/docs/modules/scene/draco/formats/draco.md)      | [Package root](https://loaders.gl/next/docs/modules/scene/draco.md)                  | Draco compressed meshes and point clouds |
| [![](/next/images/format-logos/gltf-logo.svg)](https://loaders.gl/next/docs/modules/scene/gltf/formats/gltf.md)         | [`/gltf`](https://loaders.gl/next/docs/modules/scene/gltf.md)                        | glTF and GLB                             |
| —                                                                                                                            | [`/obj`](https://loaders.gl/next/docs/modules/scene/obj.md)                          | OBJ and MTL                              |
| [![](/next/images/format-logos/openusd-logo.svg)OpenUSD](https://loaders.gl/next/docs/modules/scene/usd/formats/usd.md) | [`/usd`](https://loaders.gl/next/docs/modules/scene/usd/api-reference/usd-loader.md) | USD ASCII and uncompressed USDZ          |

```
npm install @loaders.gl/core @loaders.gl/scene
```

```
import {parse} from '@loaders.gl/core';

import {GLTFLoader} from '@loaders.gl/scene/gltf';

import {OBJLoader} from '@loaders.gl/scene/obj';

import {USDLoader} from '@loaders.gl/scene/usd';
```

These exports are metadata-only loaders. Async core APIs preload implementations; synchronous APIs need a parser-bearing loader such as `GLTFLoaderWithParser` from `@loaders.gl/scene/gltf-loader`. Writers and advanced glTF APIs remain under their format subpaths. glTF's schemas are available from `@loaders.gl/scene/gltf/schema` and its explicit JSON schema exports.

OBJ's transport helpers come directly from core and do not require the tables package. Draco, images and textures remain independent shared dependencies. See [Modules](https://loaders.gl/next/docs/modules.md) for the complete package map.

## Sources and credits[​](#sources-and-credits "Direct link to Sources and credits")

See the [package source and license inventory](https://github.com/visgl/loaders.gl/blob/master/modules/scene/THIRD-PARTY-NOTICES.md) and the project-wide [Attributions and Credits](https://loaders.gl/next/docs/references-and-credits.md).

## Format guides[​](#format-guides "Direct link to Format guides")

* [Draco3D](https://loaders.gl/next/docs/modules/scene/draco/formats/draco.md)
* [MaterialX](https://loaders.gl/next/docs/modules/scene/formats/materialx.md)
* [GLB binary](https://loaders.gl/next/docs/modules/scene/gltf/formats/glb.md)
* [glTF](https://loaders.gl/next/docs/modules/scene/gltf/formats/gltf.md)
* [Wavefront OBJ](https://loaders.gl/next/docs/modules/scene/obj/formats/obj.md)
* [OpenUSD](https://loaders.gl/next/docs/modules/scene/usd/formats/usd.md)

## Package exports[​](#package-exports "Direct link to Package exports")

All exported subpaths (<!-- -->49<!-- -->)

These are the package's public exports, including format entry points, parsers, writers, sources, and worker assets.

| Format                                                                                                                       | Import subpath                                   |
| ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| [![](/next/images/format-logos/draco-logo.svg)](https://loaders.gl/next/docs/modules/scene/draco/formats/draco.md)      | `@loaders.gl/scene/draco-javascript-loader`      |
| [![](/next/images/format-logos/draco-logo.svg)](https://loaders.gl/next/docs/modules/scene/draco/formats/draco.md)      | `@loaders.gl/scene/draco-library-options`        |
| [![](/next/images/format-logos/draco-logo.svg)](https://loaders.gl/next/docs/modules/scene/draco/formats/draco.md)      | `@loaders.gl/scene/draco-loader`                 |
| [![](/next/images/format-logos/draco-logo.svg)](https://loaders.gl/next/docs/modules/scene/draco/formats/draco.md)      | `@loaders.gl/scene/draco-loader-types`           |
| [![](/next/images/format-logos/draco-logo.svg)](https://loaders.gl/next/docs/modules/scene/draco/formats/draco.md)      | `@loaders.gl/scene/draco-wasm-loader`            |
| [![](/next/images/format-logos/draco-logo.svg)](https://loaders.gl/next/docs/modules/scene/draco/formats/draco.md)      | `@loaders.gl/scene/draco-worker-node.js`         |
| [![](/next/images/format-logos/draco-logo.svg)](https://loaders.gl/next/docs/modules/scene/draco/formats/draco.md)      | `@loaders.gl/scene/draco-worker.js`              |
| [![](/next/images/format-logos/draco-logo.svg)](https://loaders.gl/next/docs/modules/scene/draco/formats/draco.md)      | `@loaders.gl/scene/draco-writer`                 |
| [![](/next/images/format-logos/draco-logo.svg)](https://loaders.gl/next/docs/modules/scene/draco/formats/draco.md)      | `@loaders.gl/scene/draco-writer-worker-node.cjs` |
| [![](/next/images/format-logos/draco-logo.svg)](https://loaders.gl/next/docs/modules/scene/draco/formats/draco.md)      | `@loaders.gl/scene/draco-writer-worker-node.js`  |
| [![](/next/images/format-logos/draco-logo.svg)](https://loaders.gl/next/docs/modules/scene/draco/formats/draco.md)      | `@loaders.gl/scene/draco-writer-worker.js`       |
|                                                                                                                              | `@loaders.gl/scene/draco3d-loader`               |
| [![](/next/images/format-logos/gltf-logo.svg)GLB](https://loaders.gl/next/docs/modules/scene/gltf/formats/glb.md)       | `@loaders.gl/scene/glb-loader`                   |
| [![](/next/images/format-logos/gltf-logo.svg)GLB](https://loaders.gl/next/docs/modules/scene/gltf/formats/glb.md)       | `@loaders.gl/scene/glb-loader-types`             |
| [![](/next/images/format-logos/gltf-logo.svg)GLB](https://loaders.gl/next/docs/modules/scene/gltf/formats/glb.md)       | `@loaders.gl/scene/glb-writer`                   |
| [![](/next/images/format-logos/gltf-logo.svg)](https://loaders.gl/next/docs/modules/scene/gltf/formats/gltf.md)         | `@loaders.gl/scene/gltf`                         |
| [![](/next/images/format-logos/gltf-logo.svg)](https://loaders.gl/next/docs/modules/scene/gltf/formats/gltf.md)         | `@loaders.gl/scene/gltf-loader`                  |
| [![](/next/images/format-logos/gltf-logo.svg)](https://loaders.gl/next/docs/modules/scene/gltf/formats/gltf.md)         | `@loaders.gl/scene/gltf-loader-types`            |
| [![](/next/images/format-logos/gltf-logo.svg)](https://loaders.gl/next/docs/modules/scene/gltf/formats/gltf.md)         | `@loaders.gl/scene/gltf-source`                  |
| [![](/next/images/format-logos/gltf-logo.svg)](https://loaders.gl/next/docs/modules/scene/gltf/formats/gltf.md)         | `@loaders.gl/scene/gltf-writer`                  |
| [![](/next/images/format-logos/gltf-logo.svg)](https://loaders.gl/next/docs/modules/scene/gltf/formats/gltf.md)         | `@loaders.gl/scene/gltf/bundled`                 |
| [![](/next/images/format-logos/gltf-logo.svg)](https://loaders.gl/next/docs/modules/scene/gltf/formats/gltf.md)         | `@loaders.gl/scene/gltf/gltf-1.schema.json`      |
| [![](/next/images/format-logos/gltf-logo.svg)](https://loaders.gl/next/docs/modules/scene/gltf/formats/gltf.md)         | `@loaders.gl/scene/gltf/gltf-2.1.schema.json`    |
| [![](/next/images/format-logos/gltf-logo.svg)](https://loaders.gl/next/docs/modules/scene/gltf/formats/gltf.md)         | `@loaders.gl/scene/gltf/gltf-2.schema.json`      |
| [![](/next/images/format-logos/gltf-logo.svg)](https://loaders.gl/next/docs/modules/scene/gltf/formats/gltf.md)         | `@loaders.gl/scene/gltf/gltf-all.schema.json`    |
| [![](/next/images/format-logos/gltf-logo.svg)](https://loaders.gl/next/docs/modules/scene/gltf/formats/gltf.md)         | `@loaders.gl/scene/gltf/gltf-format`             |
| [![](/next/images/format-logos/gltf-logo.svg)](https://loaders.gl/next/docs/modules/scene/gltf/formats/gltf.md)         | `@loaders.gl/scene/gltf/gltf.schema.json`        |
| [![](/next/images/format-logos/gltf-logo.svg)](https://loaders.gl/next/docs/modules/scene/gltf/formats/gltf.md)         | `@loaders.gl/scene/gltf/index`                   |
| [![](/next/images/format-logos/gltf-logo.svg)](https://loaders.gl/next/docs/modules/scene/gltf/formats/gltf.md)         | `@loaders.gl/scene/gltf/mesh-arrow`              |
| [![](/next/images/format-logos/gltf-logo.svg)](https://loaders.gl/next/docs/modules/scene/gltf/formats/gltf.md)         | `@loaders.gl/scene/gltf/schema`                  |
| [![](/next/images/format-logos/gltf-logo.svg)](https://loaders.gl/next/docs/modules/scene/gltf/formats/gltf.md)         | `@loaders.gl/scene/gltf/schemas/*`               |
| [![](/next/images/format-logos/gltf-logo.svg)](https://loaders.gl/next/docs/modules/scene/gltf/formats/gltf.md)         | `@loaders.gl/scene/gltf/unbundled`               |
|                                                                                                                              | `@loaders.gl/scene/materialx-loader`             |
|                                                                                                                              | `@loaders.gl/scene/mtl-loader`                   |
|                                                                                                                              | `@loaders.gl/scene/mtl-loader-types`             |
|                                                                                                                              | `@loaders.gl/scene/obj`                          |
|                                                                                                                              | `@loaders.gl/scene/obj-loader`                   |
|                                                                                                                              | `@loaders.gl/scene/obj-loader-types`             |
|                                                                                                                              | `@loaders.gl/scene/obj-worker.js`                |
|                                                                                                                              | `@loaders.gl/scene/obj-writer`                   |
|                                                                                                                              | `@loaders.gl/scene/obj/bundled`                  |
|                                                                                                                              | `@loaders.gl/scene/obj/index`                    |
|                                                                                                                              | `@loaders.gl/scene/obj/mtl-format`               |
|                                                                                                                              | `@loaders.gl/scene/obj/obj-format`               |
|                                                                                                                              | `@loaders.gl/scene/obj/unbundled`                |
| [![](/next/images/format-logos/openusd-logo.svg)OpenUSD](https://loaders.gl/next/docs/modules/scene/usd/formats/usd.md) | `@loaders.gl/scene/usd`                          |
| [![](/next/images/format-logos/openusd-logo.svg)OpenUSD](https://loaders.gl/next/docs/modules/scene/usd/formats/usd.md) | `@loaders.gl/scene/usd-loader`                   |
| [![](/next/images/format-logos/openusd-logo.svg)OpenUSD](https://loaders.gl/next/docs/modules/scene/usd/formats/usd.md) | `@loaders.gl/scene/usd-loader-types`             |
| [![](/next/images/format-logos/openusd-logo.svg)OpenUSD](https://loaders.gl/next/docs/modules/scene/usd/formats/usd.md) | `@loaders.gl/scene/usd/index`                    |
