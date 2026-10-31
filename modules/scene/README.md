# @loaders.gl/scene

glTF, GLB, OBJ, MTL, and OpenUSD scene loaders and writers.

Supported formats: glTF, GLB, OBJ, MTL, OpenUSD, USD, USDA, USDZ. OpenUSD support covers ASCII USDA and uncompressed USDZ archives with an ASCII root layer.

## Installation

```bash
npm install @loaders.gl/core @loaders.gl/scene
```

## Loaders

- `USDLoader` loads ASCII USDA layers and uncompressed USDZ archives with an ASCII root layer.

```typescript
import {load} from '@loaders.gl/core';
import {USDLoader} from '@loaders.gl/scene';

const stage = await load('scene.usda', USDLoader);
```

The loader can compose referenced layers, authored variants, and local overrides. Binary USDC
crate layers are not yet supported.

## Sources and credits

See [THIRD-PARTY-NOTICES.md](./THIRD-PARTY-NOTICES.md) for implementation lineage
and applicable notices, and the project-wide [References and credits](https://loaders.gl/docs/references-and-credits).

## Draco geometry

`DracoLoader` metadata is available from the scene root. Import `DracoLoaderWithParser` from `@loaders.gl/scene/draco-loader` for direct parsing, `DracoWriter` and encoding helpers from `@loaders.gl/scene/draco-writer`, and `getDracoLibraryOptions` from `@loaders.gl/scene/draco-library-options` for bundled runtime URLs. Draco supports both meshes and point clouds.
