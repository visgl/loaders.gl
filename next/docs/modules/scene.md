# @loaders.gl/scene

Load scene graphs and meshes from glTF/GLB, OBJ/MTL and OpenUSD. Install one package and use the format entrypoint appropriate for the asset.

| Subpath                                                                                             | Formats                                         | Metadata loaders          |
| --------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ------------------------- |
| [gltf](https://loaders.gl/next/docs/modules/scene/gltf.md)                                     | glTF and GLB                                    | `GLTFLoader`, `GLBLoader` |
| [obj](https://loaders.gl/next/docs/modules/scene/obj.md)                                       | OBJ and MTL                                     | `OBJLoader`, `MTLLoader`  |
| [OpenUSD](https://loaders.gl/next/docs/modules/scene/usd/api-reference/usd-loader.md) (`/usd`) | USD ASCII layers and uncompressed USDZ archives | `USDLoader`               |

```
npm install @loaders.gl/core @loaders.gl/scene
```

```
import {parse} from '@loaders.gl/core';

import {GLTFLoader} from '@loaders.gl/scene/gltf';

import {OBJLoader} from '@loaders.gl/scene/obj';

import {USDLoader} from '@loaders.gl/scene/usd';
```

These exports are metadata-only loaders. Async core APIs preload implementations; synchronous APIs need a parser-bearing loader such as `GLTFLoaderWithParser` from `@loaders.gl/scene/gltf/gltf-loader`. Writers and advanced glTF APIs remain under their format subpaths. glTF's schemas are available from `@loaders.gl/scene/gltf/schema` and its explicit JSON schema exports.

OBJ's transport helpers come directly from core and do not require the tables package. Draco, images and textures remain independent shared dependencies. See [Packages](https://loaders.gl/next/docs/packages.md) for the complete package map.

## Sources and credits[​](#sources-and-credits "Direct link to Sources and credits")

See the [package source and license inventory](https://github.com/visgl/loaders.gl/blob/master/modules/scene/THIRD-PARTY-NOTICES.md) and the project-wide [References and credits](https://loaders.gl/next/docs/references-and-credits.md).
