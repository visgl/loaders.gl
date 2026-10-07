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

Enter a CORS-enabled HTTP(S) `tileset.json` URL in **Convert selected 3D Tiles meshes**,
inspect its declared content placements, then explicitly select content and choose SLPK or 3TZ.
Only selected content is fetched. Use the content list's multiple selection controls (Ctrl/Cmd-click) for 3TZ. The source hierarchy's ancestor transforms are retained; 3TZ also retains a conservative
source geometric error. SLPK authors a single final mesh and does not reproduce the source LOD hierarchy. A successful archive can be downloaded or previewed with the same
incremental viewer. This is a partial dataset export, not whole-tileset conversion.

Each selected content must contain exactly one static primitive in self-contained
GLB/B3DM, with native EPSG:4978 coordinates and ellipsoidal heights established by root region bounds.
Unknown/local frames are rejected. Metallic-roughness material factors, alpha controls
and double-sided rendering are preserved. SLPK converts linear material RGB factors to I3S sRGB
while preserving alpha; readers convert them back for rendering. 3TZ also preserves packed linear Float32 or normalized
Uint8/Uint16 vertex colors, packed Float32 or normalized Uint8/Uint16 `TEXCOORD_0`, and one
embedded PNG/JPEG base-color image with its declared wrapping and filtering. Encoded image
bytes are copied without decoding, resizing or transcoding. SLPK rejects vertex colors and textures.
Other texture maps, UV transforms/sets, texture extensions, animation, compressed meshes, external dependencies, multiple primitives,
nested external tilesets and implicit tiling fail explicitly. No feature schema is inferred.

### Explicit SLPK features

For feature-bearing input, fill **SLPK feature mapping (optional JSON)** before converting.
The mapping supports one attribute-backed `EXT_mesh_features` set referencing one inline,
decoded structural metadata table, or legacy B3DM `_BATCHID` and decoded batch columns.
Declare the exact metadata class, every property, and the stable identifier field. All vertices
of a triangle must reference the same row; each output feature must own geometry.

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

Supported target columns are `utf8`, `int32`, `float64`, and explicitly authorized `int64`/`uint64`
as exact decimal strings. Nullable strings retain null versus empty values; numeric nulls are rejected.
Omit `sourceFeatureIdProperty` to use explicit-schema content-local row IDs. Arrays, enums, noData,
multiple classes/feature sets, texture IDs, and mixed-feature triangles are rejected. Every unmapped
property fails. Decimal-string representation is reported in the completed diagnostics. Feature-bearing
3TZ output remains unsupported and fails explicitly; providing a feature mapping with 3TZ rejects
before content I/O.

The decoded input gate includes Arrow column and triangle-association buffers after extraction.
It also charges encoded base-color image bytes. It does not bound allocations during metadata
decoding or Arrow construction.

### Multi-tile 3TZ profile

Select up to 64 contents on **leaf tiles**. The output is a flat collection under a
contentless ADD root, with deterministic relative mesh names and bounds enclosing all
selected placements. Declaration order determines output order, independent of click order.
Repeated source URLs at distinct placements remain distinct tiles. Ancestor transforms and
source geometric error are retained, but the source LOD hierarchy is not reproduced.
Non-leaf multi-selections are rejected to avoid exporting overlapping LOD approximations.
Any failed, empty, or multi-primitive content aborts the entire output.

SLPK continues to accept one mesh. Multi-node I3S authoring, broader hierarchy/refinement
mapping and broader feature associations remain follow-up work.

The demo caps root JSON plus selected content at 16 MiB, declarations at 1,000 contents,
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
