---
title: Tile Converter supported features
description: Check which I3S and 3D Tiles layer types, versions, sources, extensions, and output options the converter supports.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Tile converter / compatibility"
  title="Check the conversion boundary before starting a large job."
  description="I3S and 3D Tiles are broad standards with several layer types, payloads, versions, and extensions. This matrix records the subset the tile-converter can currently translate and the cases that remain outside its contract."
  tone="violet"
  meta={['Layer types', 'Input sources', 'Version and extension matrix']}
  links={[
    {label: 'Tile Converter CLI', to: '/docs/modules/tile-converter/cli-reference/tile-converter'},
    {label: 'Experimental v5 API', to: '/docs/modules/tile-converter/api-reference/v5-conversion'},
    {label: 'I3S converter API', to: '/docs/modules/tile-converter/api-reference/i3s-converter'},
    {label: '3D Tiles converter API', to: '/docs/modules/tile-converter/api-reference/3d-tiles-converter'}
  ]}
/>

<DocOrientation
  eyebrow="Compatibility at a glance"
  title="Know what will translate before bytes start moving."
  description="Use the tables below to distinguish supported inputs from partial or unsupported features. A standard version being recognized does not imply every embedded layer or extension is convertible."
  tone="violet"
  items={[
    {label: 'Layers', value: 'Compare I3S and 3D Tiles scene, mesh, point, and composite types.'},
    {label: 'Sources', value: 'Check local folders, services, SLPK containers, and hosted URLs.'},
    {label: 'Versions', value: 'Review supported standard generations and in-progress coverage.'},
    {label: 'Extensions', value: 'Inspect input preservation and output limitations explicitly.'}
  ]}
/>

<ReferenceBoundary
  title="Supported-feature matrix"
  description="The detailed tables below define layer, source, version, extension, and option support for the current converter line."
  tone="violet"
/>

The tile-converter converts data between [3D Tiles](https://github.com/CesiumGS/3d-tiles/tree/main/specification) and [I3S](https://github.com/Esri/i3s-spec). Both specifications include many internal formats and data types; the converter does not cover every feature. This sheet summarizes the current compatibility boundary.

## Experimental v5 conversion support

These profiles describe the current repository implementation. V5 is experimental and has
separate APIs from the legacy CLI. Successful conversion of a selected profile does not
qualify every dataset, standard version or extension combination.

| Input profile | Authored output | Execution and boundaries |
| --- | --- | --- |
| Static GLB/B3DM mesh contents from 3D Tiles | I3S/SLPK or GLB-based 3D Tiles/3TZ | API and browser example; resolved native EPSG:4978 input, static placements and explicit feature mapping |
| I3S `3DObject` or `IntegratedMesh` node meshes | I3S/SLPK or GLB-based 3D Tiles/3TZ | API and browser example; source-coordinate decoding, declared CRS/height operations and explicit attribute mapping |
| Decoded point Mesh/Arrow data or selected point-source tiles | PNTS, partial 3D Tiles or 3TZ | API only; explicit coordinate/precision/sampling-error contract; broader LAS/COPC/I3S input qualification remains open |
| Finalized I3S or 3D Tiles resources | Indexed SLPK or 3TZ | Blob or streaming packaging; packaging alone performs no format conversion |

Mesh output uses the current I3S **1.7 3DObject** or 3D Tiles **1.1 GLB** writer profile.
An IntegratedMesh input is authored as 3DObject output; its layer semantics are not preserved.
Point output uses **3D Tiles 1.0 PNTS**, deprecated in 1.1. Collection sinks create flat partial
hierarchies; they do not preserve source LOD, ADD/REPLACE refinement or parent/child sampling.

### Browser input and output

The [archive example](/examples/i3s-slpk) supports the following conversion inputs:

| Input | Partial SLPK output | Partial 3TZ output | Requirement |
| --- | --- | --- | --- |
| HTTP(S) 3D Tiles tileset URL | Supported | Supported | Explicit static GLB/B3DM contents; declared ECEF frame; CORS |
| HTTP(S) I3S layer URL | Supported | Supported | `3DObject`/`IntegratedMesh` leaf selection; CORS; metric geometric error for 3TZ |
| Local SLPK file | Supported | Supported | At most 16 MiB; supported I3S mesh profile; metric geometric error for 3TZ |
| Remote SLPK archive | Supported | Supported | At most 16 MiB; HTTP byte ranges and exposed validators; supported I3S mesh profile; metric geometric error for 3TZ |
| Local/remote 3TZ archive | Supported | Supported | At most 16 MiB; explicit root `tileset.json`, resolved native ECEF and supported static meshes; remote byte ranges and exposed validators |

The example inspects metadata on the main thread and performs selected-content loading,
conversion and packaging in a disposable worker. It supports download/preview and direct
file saving where `showSaveFilePicker` is available. Cancellation terminates the worker;
failed operations expose no completed archive.

Limits are **1,000** inspected declarations/nodes, **64** selected contents and total mesh
placements, **16 MiB** aggregate response bytes, a separate **16 MiB** gate for decoded geometry, encoded images and
Arrow columns, **32 MiB** retained output/archive bytes and **1 cm** position-rounding error.
SLPK and 3TZ inputs also bound indexed reads before reading and responses after decompression.
All conversion archives are capped at 16 MiB. Remote inputs use strict validator-aware HTTP
range reads and retain the inspected object identity when the conversion worker reopens the
archive. CORS must expose `Content-Range` and `ETag` or `Last-Modified`; servers that ignore
Range requests are rejected. URL query credentials stay on the archive request. Dependency
URLs are resolved only inside that archive, including relative content/image/buffer paths;
external dependencies and traversal outside its root are rejected.
These gates do not cap decoder, decompressor, Arrow or packaging peak memory.

### Appearance, features and spatial handling

- Both mesh targets preserve supported PBR factors, one encoded PNG/JPEG base-color image and
  one UV set. GLB retains UV transforms/filtering and supported vertex colors; I3S bakes UV
  transforms, retains wrapping and rejects explicit filtering/vertex colors. I3S atlas regions,
  additional texture maps and richer appearance profiles are unsupported.
- Draco Edge Breaker is enabled by default in both mesh codecs, with decoded geometry and
  feature-ownership checks. GLB readers require `KHR_draco_mesh_compression`; `draco: false`
  selects raw geometry. The synchronous `encodeMeshTile` helper remains uncompressed.
- Feature-bearing inputs require an explicit Arrow schema and geometry-to-row ownership.
  Supported scalar/string fields retain exact IDs, Unicode and qualified null semantics.
  GLB retains binary int64/uint64; I3S requires explicit decimal-string encoding for those fields.
  Automatic schema inference, multiple classes, nested/enum and texture-feature profiles are
  not supported by the initial mappings.
- Reprojection is opt-in. Current collection writers require their supported ECEF/ellipsoidal
  profile; source units, CRS and height operations are applied explicitly where required.
  CRS/geoid/grid resources are application-owned. I3S screen-size LOD thresholds are not metric
  error bounds, so I3S-to-3TZ requires a declared geometric error in meters.

Hermetic Chromium tests exercise both conversion directions, exact feature values, selected
appearance and spatial profiles, both archive writers and the real browser worker. Per-package
coverage is checked in Chromium-only and merged reports. This does not establish independent
Cesium/ArcGIS interoperability or total peak-memory qualification.

### Remaining work

V5 CLI/file-service integration, full archive input/traversal qualification, source hierarchy/LOD,
broader appearance/metadata/CRS profiles, durable restart and independent viewer/memory
qualification remain open. Point-cloud/building workflows need further source qualification;
untiled Arrow/GeoParquet authoring and experimental format conversion remain separate work.
See the [modernization tracker](https://github.com/visgl/loaders.gl/issues/4047) for dependencies
and acceptance gates, and the [v5 API guide](/docs/modules/tile-converter/api-reference/v5-conversion)
for application integration.

## Legacy v4 CLI support

The following evidence and compatibility tables apply to the legacy converter classes and CLI.
They do not describe the experimental v5 APIs or browser example above.

### Test evidence

The compatibility tables describe the converter's stated capabilities. They do not imply that every version, source, extension, or combination has a hermetic regression test. The required **Tile converter tests** CI job runs `yarn test-tile-converter` after building packages and workers. Its local fixtures currently exercise representative conversions in both directions, Draco output, validation, generated bounds, metadata-class handling, SLPK and 3TZ paths, and graceful handling of failing tile content. The suite also smoke-tests the published package entrypoint.

| Area | Evidence in required CI | Coverage boundary |
| --- | --- | --- |
| 3D Tiles to I3S | Representative local tileset conversion, Draco, validation, generated bounds, attributes and textures | Does not qualify every 3D Tiles version or extension combination |
| I3S to 3D Tiles | SLPK conversion and glTF attribute conversion helpers | A full large-dataset round trip is not part of the fast job |
| I3S archives | Local SLPK and 3TZ fixtures | Remote services and hosted sources are not contacted |
| Partial input failure | A fixture with valid and failing content verifies that only available node meshes are written | This does not promise recovery from every malformed input |
| Package entrypoint | Imports and constructs both exported converters through `@loaders.gl/tile-converter` | CLI installation and invocation are not covered by this smoke test |

Large Frankfurt content checks remain outside the required fast job. Some excluded I3S-to-3D Tiles helper cases still depend on remote fixture URLs or private I3S test imports; they can move into a hermetic lane after those dependencies are removed.

### I3S coordinate systems

The legacy I3S-to-3D Tiles CLI requires WGS-84 longitude/latitude input (EPSG:4326).
Reproject projected I3S datasets, including Web Mercator (EPSG:3857), before conversion.
Explicit unsupported layer, node-index, or vertex CRS declarations produce an error before
output is written. Missing CRS declarations retain the legacy WGS-84 assumption.
The portable v5 spatial APIs have a separate CRS option surface; their transformation
support does not extend the legacy CLI's coordinate-system support.

### Layer types

| Specification | Layer type           | Status                                                                                             |
| ------------- | -------------------- | -------------------------------------------------------------------------------------------------- |
| `I3S`         | 3D objects           | ✅ Supported                                                                                          |
| `I3S`         | Integrated mesh      | ✅ Supported                                                                                          |
| `I3S`         | Point                | ❌ Not supported                                                                                      |
| `I3S`         | Point cloud          | ❌ Not supported                                                                                      |
| `I3S`         | Building scene layer | ⚠️ It is possible to convert a single sublayer (if it is of 3D objects of Integrated mesh layer type) |
| `3DTiles`     | Batched 3D Model     | ✅ Supported                                                                                          |
| `3DTiles`     | Instanced 3D Model   | ❌ Not supported                                                                                      |
| `3DTiles`     | Point Cloud          | ❌ Not supported                                                                                      |
| `3DTiles`     | Composite            | ❌ Not supported                                                                                      |

### Input data source types

| Specification | Data source type         | Status                          |
| ------------- | ------------------------ | ------------------------------- |
| `I3S`         | SLPK                     | ✅ Supported as local HTTP service |
| `I3S`         | HTTP REST service        | ✅ Supported                       |
| `3DTiles`     | Local file system folder | ✅ Supported                       |
| `3DTiles`     | Cesium ION URL           | ✅ Supported                       |

### Versions

| Specification | Version  | Status                                                                |
| ------------- | -------- | --------------------------------------------------------------------- |
| `I3S`         | 1.6, 1.7 | ✅ Supported only as input data                                          |
| `I3S`         | 1.8      | ✅ Supported                                                             |
| `3DTiles`     | 1.0      | ✅ Supported                                                             |
| `3DTiles`     | vNext    | ⚠️ Partial support (see [3DTiles vNext support](#3dtiles-vnext-support)) |
| `3DTiles`     | 1.1      | ⚠️ In progress                                                           |

### 3DTiles vNext support

Some 3DTiles vNext extensions are supported as input data.

| Belongs to | Extension                    | Status                   |
| ---------- | ---------------------------- | ------------------------ |
| `3DTiles`  | `3DTILES_content_gltf`       | ✅ Supported                |
| `3DTiles`  | `3DTILES_multiple_contents`  | ❌ Not supported            |
| `3DTiles`  | `3DTILES_implicit_tiling`    | ✅ Supported                |
| `3DTiles`  | `3DTILES_bounding_volume_S2` | ✅ Supported                |
| `3DTIles`  | `3DTILES_metadata`           | Not applicable for `I3S` |
| `glTF`     | `EXT_mesh_features`          | ✅ Supported                |
| `glTF`     | `EXT_feature_metadata`       | ✅ Supported                |
| `glTF`     | `EXT_structural_metadata`    | ✅ Supported                |

### Internal data types

| Specification      | Data type                    | Description                   | Status             |
| ------------------ | ---------------------------- | ----------------------------- | ------------------ |
| `I3S`              | `Draco`                      | Compressed geometry           | ✅ Supported          |
| `3DTiles` (`glTF`) | `KHR_draco_mesh_compression` | Draco Compressed geometry     | ✅ Supported as input |
| `3DTiles` (`glTF`) | `EXT_meshopt_compression`    | Optimized geometry            | ✅ Supported as input |
| `3DTiles` (`glTF`) | `KHR_texture_transform`      | UV coordinates transformation | ✅ Supported as input |
| `I3S`, `3DTiles`   | `PNG`, `JPEG`                | Texture formats               | ✅ Supported          |
| `I3S`              | `KTX2` with `Basis` texture  | Compressed texture format     | ✅ Supported          |
| `I3S`              | `DDS`                        | Compressed texture format     | ✅ Supported as input |
| `3DTIles`          | `KTX2` with `Basis` texture  | Compressed texture format     | ✅ Supported as input |

### Mesh topology types

`I3S` specification supports only `TRIANGLE` mesh topology type.

| Specification | Mesh type        | Status                  |
| ------------- | ---------------- | ----------------------- |
| `3DTiles`     | `POINTS`         | Not applicable in `I3S` |
| `3DTiles`     | `LINES`          | Not applicable in `I3S` |
| `3DTiles`     | `LINE_LOOP`      | Not applicable in `I3S` |
| `3DTiles`     | `LINE_STRIP`     | Not applicable in `I3S` |
| `3DTiles`     | `TRIANGLES`      | ✅ Supported               |
| `3DTiles`     | `TRIANGLE_STRIP` | ✅ Supported as input      |
| `3DTiles`     | `TRIANGLE_FAN`   | ❌ Not supported           |
