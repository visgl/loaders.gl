import {FormatLogo} from '@site/src/components/docs/format-logo';
import {ModuleSubpaths} from '@site/src/components/docs/module-subpaths';

# @loaders.gl/scene

Load scene graphs and meshes from glTF/GLB, OBJ/MTL, OpenUSD and Draco. Install one package and use the format entrypoint appropriate for the asset.

| Format | Subpath | Description |
| --- | --- | --- |
| <FormatLogo slug="draco" /> | [Package root](./draco/README.md) | Draco compressed meshes and point clouds |
| <FormatLogo slug="gltf" /> | [`/gltf`](./gltf/README.md) | glTF and GLB |
| — | [`/obj`](./obj/README.md) | OBJ and MTL |
| <FormatLogo slug="usd" /> | [`/usd`](./usd/api-reference/usd-loader.md) | USD text, initial binary crate subset, and stored USDZ |

```bash
npm install @loaders.gl/core @loaders.gl/scene
```

```typescript
import {parse} from '@loaders.gl/core';
import {GLTFLoader} from '@loaders.gl/scene/gltf';
import {OBJLoader} from '@loaders.gl/scene/obj';
import {USDLoader} from '@loaders.gl/scene/usd';
```

These exports are metadata-only loaders. Async core APIs preload implementations; synchronous APIs need a parser-bearing loader such as `GLTFLoaderWithParser` from `@loaders.gl/scene/gltf-loader`. Writers and advanced glTF APIs remain under their format subpaths. glTF's schemas are available from `@loaders.gl/scene/gltf/schema` and its explicit JSON schema exports.

OBJ's transport helpers come directly from core and do not require the tables package. Draco, images and textures remain independent shared dependencies. See [Modules](../README.md) for the complete package map.

## Sources and credits

See the [package source and license inventory](https://github.com/visgl/loaders.gl/blob/master/modules/scene/THIRD-PARTY-NOTICES.md)
and the project-wide [Attributions and Credits](/docs/references-and-credits).


## Format guides

- [STL](./stl/README.md)

- [Draco3D](./draco/formats/draco.md)
- [MaterialX](./formats/materialx.md)
- [GLB binary](./gltf/formats/glb.md)
- [glTF](./gltf/formats/gltf.md)
- [Wavefront OBJ](./obj/formats/obj.md)
- [OpenUSD](./usd/formats/usd.md)


## Package exports

<ModuleSubpaths module="scene" />
