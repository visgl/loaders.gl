# @loaders.gl/pointclouds

Point-cloud decoders and writers for LAS/LAZ, PCD and PLY. PLY keeps both point-cloud and mesh/face output; there is one implementation for both uses.

| Format | Subpath                                                                | Description           |
| ------ | ---------------------------------------------------------------------- | --------------------- |
| —      | [`/las`](https://loaders.gl/next/docs/modules/pointclouds/las.md) | LAS and LAZ           |
| —      | [`/pcd`](https://loaders.gl/next/docs/modules/pointclouds/pcd.md) | PCD                   |
| —      | [`/ply`](https://loaders.gl/next/docs/modules/pointclouds/ply.md) | PLY points and meshes |

```
npm install @loaders.gl/core @loaders.gl/pointclouds
```

```
import {parse, parseSync} from '@loaders.gl/core';

import {PLYLoader} from '@loaders.gl/pointclouds/ply';

import {PLYLoaderWithParser} from '@loaders.gl/pointclouds/ply/bundled';



const table = await parse(bytes, PLYLoader);

const mesh = parseSync(bytes, PLYLoaderWithParser, {ply: {shape: 'mesh'}});
```

Package and format roots expose metadata loaders. Call a metadata loader’s `preload()` to load its parser ahead of time. For synchronous parsing, import the parser from `/las/parser`, `/pcd/parser`, or `/ply/parser`. Import `LASWriter` from `@loaders.gl/pointclouds/las/writer` for LAS/LAZ encoding. Worker bundles belong to pointclouds. The built-in LAS/LAZ implementation remains available without the optional compatibility backends.

COPC and Potree tileset traversal remain in `@loaders.gl/tiles-3d`; point decoding does not require installing that runtime. Shared Arrow helpers come from core rather than tables. See [Modules](https://loaders.gl/next/docs/modules.md) for the complete package map.

## Sources and credits[​](#sources-and-credits "Direct link to Sources and credits")

See the [pointclouds notice inventory](https://github.com/visgl/loaders.gl/blob/master/modules/pointclouds/THIRD-PARTY-NOTICES.md) and [Attributions and Credits](https://loaders.gl/docs/references-and-credits).

## Format guides[​](#format-guides "Direct link to Format guides")

* [LAS and LAZ formats](https://loaders.gl/next/docs/modules/pointclouds/las/formats/las.md)
* [PCD](https://loaders.gl/next/docs/modules/pointclouds/pcd/formats/pcd.md)
* [PLY](https://loaders.gl/next/docs/modules/pointclouds/ply/formats/ply.md)

## Package exports[​](#package-exports "Direct link to Package exports")

All exported subpaths (<!-- -->14<!-- -->)

These are the package's public exports, including format entry points, parsers, writers, sources, and worker assets.

| Format | Import subpath                          |
| ------ | --------------------------------------- |
|        | `@loaders.gl/pointclouds/las`           |
|        | `@loaders.gl/pointclouds/las-worker.js` |
|        | `@loaders.gl/pointclouds/las/api`       |
|        | `@loaders.gl/pointclouds/las/bundled`   |
|        | `@loaders.gl/pointclouds/las/parser`    |
|        | `@loaders.gl/pointclouds/las/writer`    |
|        | `@loaders.gl/pointclouds/pcd`           |
|        | `@loaders.gl/pointclouds/pcd-worker.js` |
|        | `@loaders.gl/pointclouds/pcd/bundled`   |
|        | `@loaders.gl/pointclouds/pcd/parser`    |
|        | `@loaders.gl/pointclouds/ply`           |
|        | `@loaders.gl/pointclouds/ply-worker.js` |
|        | `@loaders.gl/pointclouds/ply/bundled`   |
|        | `@loaders.gl/pointclouds/ply/parser`    |
