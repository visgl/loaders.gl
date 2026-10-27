# @loaders.gl/pointclouds

Point-cloud decoders and writers for LAS/LAZ, PCD and PLY. PLY keeps both point-cloud and mesh/face output; there is one implementation for both uses.

| Subpath | Formats | Metadata loader |
| --- | --- | --- |
| [las](./las/README.md) | LAS and LAZ | `LASLoader` |
| [pcd](./pcd/README.md) | PCD | `PCDLoader` |
| [ply](./ply/README.md) | PLY points and meshes | `PLYLoader` |

```bash
npm install @loaders.gl/core @loaders.gl/pointclouds
```

```typescript
import {parse, parseSync} from '@loaders.gl/core';
import {PLYLoader} from '@loaders.gl/pointclouds/ply';
import {PLYLoaderWithParser} from '@loaders.gl/pointclouds/ply/ply-loader';

const table = await parse(bytes, PLYLoader);
const mesh = parseSync(bytes, PLYLoaderWithParser, {ply: {shape: 'mesh'}});
```

Package and format roots expose metadata loaders. Parser-bearing loaders use named implementation entrypoints, and each format retains its writer APIs. Worker bundles belong to pointclouds. The built-in LAS/LAZ implementation remains available without the optional compatibility backends.

COPC and Potree tileset traversal remain in `@loaders.gl/tiles-3d`; point decoding does not require installing that runtime. Shared Arrow helpers come from core rather than tables. See [Packages](../../packages.md) for the complete package map.

## Sources and credits

See the [pointclouds notice inventory](https://github.com/visgl/loaders.gl/blob/master/modules/pointclouds/THIRD-PARTY-NOTICES.md)
and [References and credits](https://loaders.gl/docs/references-and-credits).
