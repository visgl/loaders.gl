# Tile archive viewer

Open an I3S Scene Layer Package (`.slpk`) or a 3D Tiles archive (`.3tz`) by dropping a file
anywhere in the viewer, choosing a local file, or entering an HTTP(S) URL. For remote URLs
without a file extension, select the archive format explicitly.

`SLPKSource` and `Tiles3DArchiveSource` supply `SourceLayer` with random access to archive
resources. Local files use Blob slices; remote files use HTTP byte ranges. The runtime
loads node metadata and visible tile content as you pan and zoom, rather than extracting
the whole archive up front. Archive index metadata is still read during initialization.
Archive viewing parses visible content on the main thread. Conversion uses a separate module worker.

Remote servers must allow CORS and support HTTP byte-range responses (HTTP 206 with a valid
Content-Range header). Cross-origin servers must expose `Content-Range` to the browser,
for example with `Access-Control-Expose-Headers: Content-Range, ETag, Last-Modified`.
A new selection replaces the previous layer. Invalid selections and
tile loading errors appear in the controls. The basemap remains a separate network resource.

The WebGL example includes a small I3S mesh shader extension for deck.gl 9.4: its mesh layer
passes zero to a PBR module that now multiplies vertex color. The extension supplies one at
that call, preserving material colors and picking until the upstream call is updated.
The website home demo reuses the same extension for its I3S building meshes and bundles
its existing I3S worker bundle as an asset, using the standard `workerUrl` option to keep
worker and main-thread loader revisions aligned. Website build and start scripts generate
that bundle; no I3S-specific worker factory or bundler replacement is needed.

## Usage

From the repository root:

```bash
yarn workspace i3s-slpk-loaders-example start
```

The existing example directory and workspace name are retained so existing links and commands
continue to work.

## Bounded browser conversion

Enter a CORS-enabled HTTP(S) `tileset.json` URL in **Convert selected tile meshes**,
inspect its declared content placements, then explicitly select content and choose SLPK or 3TZ.
Only selected content and its declared dependencies are fetched. Both formats accept up to 64
static primitive placements across selected contents; multiple selection requires leaf tiles.
Ancestor transforms are retained; 3TZ retains conservative source geometric error. Output is
flat and does not reproduce source LOD. A successful archive can be downloaded or previewed
with the incremental viewer.

GLB/B3DM triangle lists, strips, fans and Draco compression are supported in native EPSG:4978
with ellipsoidal heights established by root region bounds. Draco runtimes use bundled assets.
External buffers and PNG/JPEG base-color images resolve relative to the selected content through
one shared, cancellable transport budget. Applications can inject an archive-backed fetcher.

Both formats preserve metallic-roughness factors, alpha controls, double-sided rendering, one
PNG/JPEG base-color image and packed Float32 or normalized unsigned UVs. 3TZ preserves
texture filtering, UV transforms and vertex colors. SLPK bakes UV transforms, maps wrapping,
and rejects explicit texture filtering and vertex colors. Other maps, UV sets and unmapped
scene/material extensions fail explicitly.

Both formats use lossless Draco Edge Breaker geometry by default and verify decoded triangle
winding and feature ownership. 3TZ requires `KHR_draco_mesh_compression` support. Encoded
image bytes are retained without transcoding. Independent ArcGIS viewer qualification remains
follow-up work.

### Feature mapping

Both formats accept explicit `MeshSourceFeatureOptions` JSON. Declare the exact metadata class,
every property and stable identifier field; no schema is inferred. One attribute-backed feature
set and one decoded structural table, or legacy B3DM batch metadata, are supported. Each feature
must own geometry, and each nondegenerate triangle must reference one table row.

For a source with exact 64-bit identifiers and nullable names:

```json
{
  "metadataClass": "building",
  "sourceFeatureIdProperty": "source_id",
  "featureIdField": "source_id",
  "integer64Encoding": "decimal-string",
  "schema": {
    "fields": [
      {"name": "source_id", "type": "uint64", "nullable": false},
      {"name": "label", "type": "utf8", "nullable": true}
    ]
  }
}
```

The integer64 policy applies to SLPK; 3TZ keeps binary 64-bit values. Untransformed scalar/string
noData values restore null or the declared default when reading converted GLBs.

SLPK supports `utf8`, `int32`, `float64`, and explicitly authorized `int64`/`uint64` as decimal
strings (`integer64Encoding: "decimal-string"`). Nullable strings retain null versus empty;
numeric nulls are rejected. Nodes share a feature schema and legacy geometry layout. Generated
OBJECTID ranges are distinct across nodes; stable source IDs remain separate attributes.

3TZ writes `EXT_structural_metadata` and `EXT_mesh_features`, retaining exact binary integer
widths including int64/uint64, float32/float64 and UTF-8 strings. Nullable properties use
collision-free noData values. Arrays, enums and Boolean columns are outside this first profile.
Draco verification checks triangle ownership and every encoded geometry attribute.

### Mesh collections

Both archive formats retain every static primitive/node placement in declaration order. 3TZ
uses `meshes/0.glb`, `meshes/1.glb`, etc. under an enclosing contentless ADD root. SLPK uses
separate geometry, attribute and texture resources per node, with legacy and paged indices.
The 64th SLPK leaf crosses a node-page boundary. Failure of any resource aborts the archive.
Source hierarchy/refinement preservation remains follow-up work.

The decoded input gate includes Arrow column and triangle-association buffers after extraction.
It also charges encoded base-color image bytes. It does not bound allocations during metadata
decoding or Arrow construction.

The demo caps root JSON plus selected content and external dependencies at 16 MiB, declarations at 1,000 contents,
aggregate decoded geometry plus encoded image bytes at 16 MiB, retained output and archive size at 32 MiB, and position error
at 1 cm. These are byte gates, not a guarantee about peak decoder/serialization memory.
Selected-content fetching, decoding, conversion and archive encoding run in a disposable module
worker. Archive packaging transfers one byte-view chunk at a time. For download/preview, the
main thread snapshots its exact byte range into a Blob part, checks the aggregate archive budget, and acknowledges it
before the worker pulls another chunk. Only completed output becomes a downloadable/previewable
`File`; chunk order and the final byte count are checked. Cancel and unmount terminate the worker,
including synchronous decoding or packaging, and release partial Blob parts. Each retry starts a
new worker; failed or canceled work publishes no archive.

Inspection remains on the main thread. The worker no longer allocates or transfers a complete
archive or entry buffer. Packaging reads/copies payload blocks of at most 64 KiB, with a checksum
pass before each populated header and a second pass that transfers blocks on demand. Finalized
conversion resources and index/directory metadata still consume worker memory. The main thread retains the complete result
as Blob parts for download/preview. Neither output mode caps total peak memory.
Packaging checks cancellation between block reads and does not prefetch the next output block.

### Direct file saving

Where `showSaveFilePicker` is available, **Convert and save to file** opens the native save
dialog from the button click. This browser API requires a secure context (HTTPS or localhost).
It supports the same bounded SLPK and 3TZ profiles. The download/preview action remains available
in other browsers.

Direct saving writes each transferred byte view to a native writable file stream and awaits the
write before acknowledging the next worker chunk. It does not collect archive Blob parts or
create a download URL. The file closes only after successful conversion, chunk validation and
the final byte-count check. Cancel or failure before close aborts the stream; native file writes
are not committed until close, so an existing destination retains its previous contents.

**Saving archive** marks final file commit: Cancel is disabled once close starts. Success is
reported only after close completes. Saved archives can be opened later through the viewer
file controls; direct saving does not create an automatic preview. The worker still retains
finalized conversion resources and archive index metadata. An enforceable total decoding and
conversion memory budget remains follow-up work.
Worker scripts and their module chunks must be served by the application and allowed by its content security policy.

The example imports orchestration from `@loaders.gl/tile-converter/v5/core` and format
writers from `/v5/adapters`. Conversion code remains in the tile-converter application.

### I3S conversion input

The conversion controls accept an I3S `3DObject` or `IntegratedMesh` layer URL (with CORS),
or a local SLPK file up to 16 MiB. Inspection traverses legacy nodes or node pages without
loading geometry, textures or attributes. It offers only leaf mesh nodes for explicit selection;
source hierarchy and LOD refinement are not reproduced in the flat partial output.

Both SLPK and 3TZ output reuse the v5 source-coordinate adapter and writers. Supported source
appearance is basic PBR factors and one encoded PNG/JPEG base-color map. Attribute resources
require an explicit mapping, for example:

```json
{
  "metadataClass": "buildings",
  "objectIdProperty": "OBJECTID",
  "sourceFeatureIdProperty": "feature_id",
  "maxAttributeBytes": 1048576,
  "schema": {
    "fields": [
      {"name": "feature_id", "type": "int32", "nullable": false},
      {"name": "name", "type": "utf8", "nullable": true}
    ]
  }
}
```

Choose source column names/types that actually exist. Every remaining property must be mapped;
64-bit SLPK output requires `integer64Encoding: "decimal-string"`. No schema or CRS is inferred.
The browser profile uses available built-in CRS operations and declared ellipsoidal heights;
missing geoid/grid/epoch operations fail instead of downloading resources. For 3TZ, supply a
conservative geometric error in meters: an I3S screen-size threshold does not provide a metric
error bound. The encoder's measured error allowance is added to that declared bound.

Layer/header/dependency responses share the 16 MiB input budget; decoded geometry, encoded
images and Arrow columns have a separate aggregate 16 MiB gate. Inspection visits at most
1,000 nodes and conversion selects at most 64 leaf meshes. Local SLPK uses indexed reads and
keeps the File in the worker request rather than reading the complete archive into an ArrayBuffer.
Its file-size and indexed-read limits are checked before reads, and response limits after GZIP
expansion. These gates do not bound decoder/decompressor peak allocations. Remote SLPK
conversion, 3TZ conversion input and broader hierarchy/appearance profiles remain separate work;
the archive viewer continues to support remote and local SLPK/3TZ viewing.

Conversion, packaging and direct file saving use the existing disposable worker and acknowledged
streaming protocol. Cancel terminates the worker; failed conversion produces no completed archive.
