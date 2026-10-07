---
title: Tile-converter v5 conversion core
description: Experimental platform-neutral contracts for inspecting, converting, and validating tilesets.
---

# Tile-converter v5 conversion core

The portable conversion core is available from `@loaders.gl/tile-converter/v5/core`. Format-specific codecs, Arrow mapping and archive packaging are available from `@loaders.gl/tile-converter/v5/adapters`. Both remain inside the tile-converter application; no code or dependencies are moved to the tiles module. The core has no Node.js imports. Input resolution, format codecs, destination writes, and validation are supplied by adapters so the core can run in browser or Node environments.

The current API exports `inspectTileset`, `convertTileset`, and `validateTileset`, together with types for sources, codecs, sinks, diagnostics, progress, and reports. `convertTileset` reads and converts one input resource at a time, awaits each destination write before requesting more output, supports `AbortSignal`, and reports resource and byte totals. Set `maxOutputResourceBytes` to reject an output resource that exceeds the configured per-resource budget. Policy and validation failures use `TileConversionError` with a stable code and associated diagnostics.

```ts
import {convertTileset} from '@loaders.gl/tile-converter/v5/core';

const report = await convertTileset({
  source,
  codec,
  sink,
  measureInputBytes: resource => resource.byteLength,
  measureOutputBytes: resource => resource.byteLength,
  maxOutputResourceBytes: 16 * 1024 * 1024,
  signal: abortController.signal,
  onProgress: progress => updateProgress(progress)
});
```

This API is experimental. The core provides source adapters and bounded browser sinks; the format adapters provide mesh and point-cloud codecs and archive packaging. Applications still supply input/output integration for other profiles; the legacy `I3SConverter` and `Tiles3DConverter` remain separate.

## Core and format adapters

The core entrypoint exports conversion contracts, inspection, validation, progress,
cancellation, resource limits, source-backed traversal, point-cloud traversal, spatial
preparation, bounded Blob sinks and manifest-backed sinks. It uses the existing tiles
and math dependencies without importing format encoders, Arrow construction or archive
writers. Applications initialize sources and supply codecs, sinks and validators.

The adapters entrypoint exports the existing mesh and point-cloud encoders, source mesh
extraction, Arrow feature mapping, single-mesh output sinks and archive packaging. It
uses the core's shared functions, types and `TileConversionError`; there is one core
implementation per module format.

```ts
import {convertTileset, createTiles3DConversionSpatialContext} from '@loaders.gl/tile-converter/v5/core';
import {createMeshConversionCodec, createSingleMeshTilesetSink} from '@loaders.gl/tile-converter/v5/adapters';
```

Existing `/v5` and `/v5/browser` imports remain compatible and combine their previous
core and adapter exports. The split adds no package dependencies. CLI, v4 and Node
filesystem/service integration remain separate and unchanged. Core and adapters have
ESM, CommonJS and TypeScript declaration exports. The app still declares its existing
format and Node service dependencies; importing the core isolates its runtime and
bundle imports, but does not remove those installation dependencies.

## Draco mesh output

`createMeshConversionCodec` now encodes GLB geometry with lossless Draco Edge Breaker
by default, including GLBs packaged as 3TZ by the mesh sinks. Output requires
`KHR_draco_mesh_compression` support in the reader and contains no uncompressed geometry
fallback. Materials, encoded PNG/JPEG images, samplers and texture transforms are preserved;
images are not recompressed. `encodeMeshTile` remains the synchronous uncompressed encoder.

```ts
const codec = createMeshConversionCodec({
  spatialContext,
  maxPositionError: 0.01,
  // Set draco: false to generate uncompressed GLB geometry instead.
  // dracoLibraryOptions: {useLocalLibraries: true}
});
```

No attribute quantization is enabled. The codec verifies the decoded Float32 positions,
uses decoded vertex counts and bounds in the GLB accessors and placement metadata, and
retains the existing position-rounding budget. Draco may reorder vertices and triangles or
remove unused vertices. Compression is not guaranteed to reduce very small mesh files.

Encoding and verification need both Draco encoder and decoder runtimes. The optional
`dracoLibraryOptions` accepts the existing `LoadLibraryOptions` (`modules`, `CDN`,
`useLocalLibraries`) for applications that inject runtimes or serve local assets. The default
runtime uses the Draco module's CDN configuration. Browser deployments must allow these
assets through CORS and content security policy. The browser archive example runs this work
inside its conversion worker; direct codec calls execute in their caller's environment.

Lossy presets, quantization controls, texture compression and broader external-viewer
qualification remain follow-up work. This GLB policy does not change v5 I3S/SLPK authoring.

## Archive output: 3TZ and SLPK

Use `createTileConversionArchive` from either v5 entrypoint to package the unmodified files
of a successfully finalized browser sink. The selected format requires resources already
encoded for that format. `createSingleMeshTilesetArchive` remains the narrower helper for
the two files from `createSingleMeshTilesetSink`.

```ts
import {createTileConversionArchive} from '@loaders.gl/tile-converter/v5/browser';

const archive = await createTileConversionArchive(sink.getFiles(), {
  format: 'slpk', // Use '3tz' for authored 3D Tiles resources instead.
  maxArchiveBytes: 16 * 1024 * 1024
});
const downloadUrl = URL.createObjectURL(archive);
// Save with the selected .slpk or .3tz extension; revoke after the application is done.
URL.revokeObjectURL(downloadUrl);
```

3TZ requires root `tileset.json`. SLPK requires root `3dSceneLayer.json.gz`, I3S node resources
and individually compressed resources with the archive path layout; PNG/JPEG stay encoded
as images. The format writers own ZIP/index encoding. Selecting `slpk` does not convert a
GLB into I3S geometry or generate scene-layer/node metadata. Use the I3S authoring codec and sink below to generate those resources from a
supported source mesh. Legacy v4 converters retain their broader I3S/SLPK conversion workflow.

Both outputs use deterministic STORE ZIP32 with populated local headers and final indexes.
The budget includes headers/index and is checked before Blob reads. The first SLPK profile
supports archives below 2 GiB; 3TZ stays below the ZIP64 sentinel. Both support at most
65,533 resources and canonical ASCII paths. Invalid formats, budgets, or duplicate IDs fail
explicitly. The output-size budget is not a peak-memory budget. Streaming, ZIP64, cancellation
within the encoder, broader source extraction, and broader viewer qualification remain
future work. The browser example can interrupt packaging by terminating its disposable worker. Applications own input qualification, download UI, and object-URL lifetime.

See [SLPKWriter](/docs/modules/i3s/api-reference/slpk-writer) and
[Tiles3DArchiveWriter](/docs/modules/3d-tiles/api-reference/tiles-3d-archive-writer).

## Source mesh to I3S/SLPK

`createMeshTilesetConversionSource` connects a source-backed `Tileset3D` runtime to
`createI3SMeshConversionCodec` and `createSingleMeshI3SSink`. These APIs are exported from
both v5 entrypoints. The initial profile converts one static untextured GLB/B3DM primitive
from a native, resolved EPSG:4978 source to an I3S 1.7 3D Object layer. Enable decoded glTF
loading when constructing the runtime. A region bounding volume or explicit CRS metadata
must establish the ECEF source frame; sphere/box bounds alone do not imply a CRS.

```ts
import {
  convertTileset,
  createMeshTilesetConversionSource,
  createI3SMeshConversionCodec,
  createSingleMeshI3SSink,
  createTiles3DConversionSpatialContext,
  createTileConversionArchive
} from '@loaders.gl/tile-converter/v5/browser';

const source = createMeshTilesetConversionSource(tileset, {
  unloadContent: true,
  features: {
    metadataClass: 'building',
    sourceFeatureIdProperty: 'source_id',
    featureIdField: 'source_id',
    integer64Encoding: 'decimal-string',
    schema: {fields: [
      {name: 'source_id', type: 'uint64', nullable: false},
      {name: 'label', type: 'utf8', nullable: true}
    ]}
  }
});
const inspection = await source.inspect();
const spatialContext = createTiles3DConversionSpatialContext(inspection.spatialReference!);
const sink = createSingleMeshI3SSink({maxTotalBytes: 16 * 1024 * 1024});
const report = await convertTileset({
  source,
  codec: createI3SMeshConversionCodec({
    spatialContext,
    maxPositionError: 0.001,
    maxResourceBytes: 8 * 1024 * 1024
  }),
  sink,
  measureInputBytes: resource => resource.mesh.attributes.POSITION.value.byteLength,
  measureOutputBytes: resource => Object.values(resource.files).reduce(
    (total, buffer) => total + buffer.byteLength, 0
  )
});
const archive = await createTileConversionArchive(sink.getFiles(), {
  format: 'slpk',
  maxArchiveBytes: 32 * 1024 * 1024
});
```

Omit `features` for unannotated geometry. Feature-bearing inputs require an explicit Arrow
schema. The source supports `_BATCHID` with decoded B3DM batch columns or one
`EXT_mesh_features` attribute set referencing one decoded `EXT_structural_metadata` table.
The declared class, counts, row indices, stable IDs, and geometry association are validated.
Missing defaults can be supplied by the decoded class. noData, enum/array mappings and
64-bit property transforms are rejected until their semantics are separately qualified. Unmapped properties fail rather than disappearing.

The source applies node placement, the glTF up axis, RTC center, and tile placement once.
Absolute positions remain Float64; normals use the inverse transpose of the placement.
The codec then applies the shared source-to-ECEF spatial context once. It reports measured
position rounding and explicitly authorized 64-bit decimal-string mappings in `report`.
The sink exposes files only after successful finalization and clears partial files on abort.
A second mesh resource aborts this single-mesh output; hierarchy generation is separate work.

The initial source rejects animation, skins, morphs, GPU instancing, mirrored or singular
placements, unmapped material/feature extensions, and tileset/group/tile/content
metadata that needs its own mapping. Decoded reader cleanup follows shared traversal; the
application still owns the runtime, worker, decoder, and archive lifetime. Synchronous
encoding cannot be interrupted by an AbortSignal mid-operation; applications can terminate a
disposable worker instead. Resource/retained-output/archive caps do
not constitute a total peak-memory budget.

Unannotated resources can also use the existing GLB codec and 3D Tiles/3TZ sink. The source
retains `TEXCOORD_0` (packed Float32 or normalized Uint8/Uint16) and one embedded PNG/JPEG
base-color image from a glTF buffer view or base64 data URI, including declared wrapping/filtering and
`KHR_texture_transform` offset/rotation/scale on `TEXCOORD_0`. Load source content with
`gltf.excludeExtensions: {KHR_texture_transform: false}` so the adapter receives the original
UVs and authored transform. The GLB writer retains the transform as a required extension;
conversion does not bake it into UVs. Encoded
image bytes are forwarded without pixel decoding or transcoding. Inline images accept
`data:image/png;base64,...` or `data:image/jpeg;base64,...`; an optional image `mimeType` must
match the URI. Base64 is decoded directly into a typed array without fetching the image;
the decoded encoded-image bytes count against the input gates. External image URLs,
other data-URI encodings/MIME types,
other UV sets, texture-info extensions other than `KHR_texture_transform`,
texture/image/sampler extensions and other texture maps are
rejected. The I3S codec continues to reject textured geometry. The GLB
codec explicitly rejects feature-bearing resources until its target metadata writer is
qualified. See [I3S mesh authoring](/docs/modules/i3s/api-reference/i3s-mesh-writer) for the
precise target property/null profile.

### Browser example

The [tile archive example](/examples/i3s-slpk) can inspect an explicit 3D Tiles URL,
convert selected self-contained static mesh contents to SLPK or 3TZ, and preview or
download the partial archive. It demonstrates the separate core and adapters entrypoints,
required byte/precision budgets, cancellation and explicit profile rejection. See the
[example README](https://github.com/visgl/loaders.gl/tree/master/examples/website/i3s-slpk)
for limits and supported inputs. The controls accept an explicit JSON `MeshSourceFeatureOptions`
mapping for single-mesh SLPK output; no schema is inferred. The decoded byte gate charges geometry, encoded base-color image bytes,
Arrow columns and triangle associations after extraction. Exact 64-bit decimal-string mappings are
reported as diagnostics. Untextured material factors are preserved in both formats; `COLOR_0` is
preserved for 3TZ and rejected for SLPK. Embedded PNG/JPEG base-color textures and
`TEXCOORD_0` are preserved for 3TZ; textured SLPK and feature-bearing 3TZ remain unsupported.


### Partial mesh collections

`createMeshTilesetSink` (`/v5/adapters`) accepts independent mesh codec outputs with the
same ECEF frame and precision requirements as the single-mesh sink. Required options are
`maxTotalBytes`, `maxMeshes`, and `geometricError`. It emits deterministic relative GLB
resources and a contentless ADD root enclosing every placed leaf. Its geometric error
covers the enclosing diagonal; leaf errors retain the supplied source/rounding budget.
Unique source placement
IDs are required. Final JSON counts toward the retained-output budget; failed conversion
aborts all output. Applications own source selection and conservative geometric error.
This flat collection does not reproduce a source LOD hierarchy.

The [tile archive example](https://loaders.gl/examples/i3s-slpk) supports up to 64 explicitly
selected leaf contents for partial 3TZ output, with aggregate input/decoded byte gates.
SLPK output retains its single-mesh profile. Multi-node I3S authoring and preservation of
broader source hierarchy, refinement and feature associations remain separate work.

### Browser worker execution

The archive viewer example runs selected-content loading, decoding, conversion and packaging in
one disposable module worker per operation. It transfers only finalized archive bytes and the
conversion report back to the controls. Cancel or unmount terminates the worker; failed and canceled
operations expose no downloadable archive. Inspection remains on the main thread. This example
boundary does not add a public worker API or move the conversion implementation between modules.

Existing transport, decoded-input and retained-output byte gates still apply. Moving work off the
main thread does not cap peak decoder/Arrow/packager allocations or make packaging streaming.
