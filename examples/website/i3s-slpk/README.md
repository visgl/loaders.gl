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
