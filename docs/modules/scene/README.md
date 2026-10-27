# @loaders.gl/scene

Load scene graphs and meshes from glTF/GLB, OBJ/MTL and OpenUSD. Install one package and use the format entrypoint appropriate for the asset.

| Subpath | Formats | Metadata loaders |
| --- | --- | --- |
| [gltf](./gltf/README.md) | glTF and GLB | `GLTFLoader`, `GLBLoader` |
| [obj](./obj/README.md) | OBJ and MTL | `OBJLoader`, `MTLLoader` |
| [OpenUSD](./usd/api-reference/usd-loader.md) (`/usd`) | USD ASCII layers and uncompressed USDZ archives | `USDLoader` |

```bash
npm install @loaders.gl/core @loaders.gl/scene
```

```typescript
import {parse} from '@loaders.gl/core';
import {GLTFLoader} from '@loaders.gl/scene/gltf';
import {OBJLoader} from '@loaders.gl/scene/obj';
import {USDLoader} from '@loaders.gl/scene/usd';
```

These exports are metadata-only loaders. Async core APIs preload implementations; synchronous APIs need a parser-bearing loader such as `GLTFLoaderWithParser` from `@loaders.gl/scene/gltf/gltf-loader`. Writers and advanced glTF APIs remain under their format subpaths. glTF's schemas are available from `@loaders.gl/scene/gltf/schema` and its explicit JSON schema exports.

OBJ's transport helpers come directly from core and do not require the tables package. Draco, images and textures remain independent shared dependencies. See [Packages](../../packages.md) for the complete package map.
