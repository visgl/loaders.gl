# Tile archive viewer

Open an I3S Scene Layer Package (`.slpk`) or a 3D Tiles archive (`.3tz`) by dropping a file
anywhere in the viewer, choosing a local file, or entering an HTTP(S) URL. For remote URLs
without a file extension, select the archive format explicitly.

`SLPKSource` and `Tiles3DArchiveSource` supply `SourceLayer` with random access to archive
resources. Local files use Blob slices; remote files use HTTP byte ranges. The runtime
loads node metadata and visible tile content as you pan and zoom, rather than extracting
the whole archive up front. Archive index metadata is still read during initialization.
Parsing runs on the main thread so the example does not need to download worker scripts.

Remote servers must allow CORS and support HTTP byte-range responses (HTTP 206 with a valid
Content-Range header). Cross-origin servers must expose `Content-Range` to the browser,
for example with `Access-Control-Expose-Headers: Content-Range, ETag, Last-Modified`.
A new selection replaces the previous layer. Invalid selections and
tile loading errors appear in the controls. The basemap remains a separate network resource.

The WebGL example includes a small I3S mesh shader extension for deck.gl 9.4: its mesh layer
passes zero to a PBR module that now multiplies vertex color. The extension supplies one at
that call, preserving material colors and picking until the upstream call is updated.

## Usage

From the repository root:

```bash
yarn workspace i3s-slpk-loaders-example start
```

The existing example directory and workspace name are retained so existing links and commands
continue to work.

## Bounded browser conversion

Enter a CORS-enabled HTTP(S) `tileset.json` URL in **Convert a selected 3D Tiles mesh**,
inspect its declared content placements, then explicitly select one and choose SLPK or 3TZ.
Only that content is fetched. The source hierarchy's ancestor transforms are retained; 3TZ also retains a conservative
source geometric error. SLPK authors a single final mesh and does not reproduce the source LOD hierarchy. A successful archive can be downloaded or previewed with the same
incremental viewer. This is a partial dataset export, not whole-tileset conversion.

The initial profile accepts exactly one static, untextured primitive in self-contained
GLB/B3DM, with native EPSG:4978 coordinates and ellipsoidal heights established by root region bounds.
Unknown/local frames are rejected. Feature metadata,
textures, colors, animation, compressed meshes, external dependencies, multiple primitives,
nested external tilesets and implicit tiling fail explicitly. No feature schema is inferred.

The demo caps root JSON plus selected content at 16 MiB, declarations at 1,000 contents,
decoded geometry at 16 MiB, retained output and archive size at 32 MiB, and position error
at 1 cm. These are byte gates, not a guarantee about peak decoder/serialization memory.
Parsing and archive encoding run on the main thread. Cancel aborts transport and discards
late results; it cannot interrupt synchronous decoding or archive serialization.

The example imports orchestration from `@loaders.gl/tile-converter/v5/core` and format
writers from `/v5/adapters`. Conversion code remains in the tile-converter application.
