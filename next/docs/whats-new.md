What's new

# From cloud data to visualization.

loaders.gl 5 brings catalog discovery, columnar queries, raster access, and tile authoring into one data toolkit.

[Upgrade guide](https://loaders.gl/next/docs/upgrade-guide.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/upgrade-guide.md)[Try the examples](https://loaders.gl/next/examples)

<!-- -->

[ ↗](https://loaders.gl/next/examples)

## v5.0[​](#v50 "Direct link to v5.0")

loaders.gl 5 organizes loaders, writers, and sources by data family. Install a package and import the format you use. See the [Upgrade Guide](https://loaders.gl/next/docs/upgrade-guide.md#upgrading-to-v50) for stable v4 migrations.

* **Cloud and table data.** [Table sources](https://loaders.gl/next/docs/modules/tables.md) support column and row selection across Parquet, Arrow, and lakehouse formats. [Core queries](https://loaders.gl/next/docs/modules/core/query.md) push supported filters and projections to the source. [SQL](https://loaders.gl/next/docs/modules/sql.md) provides an opt-in DuckDB integration.
* **Raster and scientific data.** [Raster](https://loaders.gl/next/docs/modules/raster.md) supports range reads and terrain meshes. [Scientific](https://loaders.gl/next/docs/modules/scientific.md) groups multidimensional arrays and VTK, NRRD, and PDB formats.
* **3D content and tiles.** [Scene](https://loaders.gl/next/docs/modules/scene.md) groups glTF, Draco, and mesh formats. [Tile Converter](https://loaders.gl/next/docs/modules/tile-converter.md) defaults to the v5 engine.
* **Documents and images.** [Documents](https://loaders.gl/next/docs/modules/documents.md) groups text and structured formats. [Images](https://loaders.gl/next/docs/modules/images.md) adds OpenEXR, color lookup tables, and measured lighting profiles.
* **Optional implementations.** Use metadata loaders with `load()` and `parse()`. Import a format's bundled loader when you need its parser immediately, such as with `parseSync()`.

## v4.5[​](#v45 "Direct link to v4.5")

Added Gaussian splat loaders, Chrome Trace parsing, experimental TypeScript Parquet, and Mapbox and MapLibre style loading.

## v4.4[​](#v44 "Direct link to v4.4")

Added MapLibre Tile support and unified texture outputs, including Radiance HDR.

## v4.3[​](#v43 "Direct link to v4.3")

Improved loader type inference and introduced typed source and range request interfaces.

## v4.2[​](#v42 "Direct link to v4.2")

Improved loader object typing and moved the website examples to deck.gl v9.

## v4.1[​](#v41 "Direct link to v4.1")

Added GeoArrow loading and required Apache Arrow 15 or later.

## v4.0[​](#v40 "Direct link to v4.0")

Added typed loaders, more writers, file format documentation, and support for Node.js 18 and 20.

## v3.4[​](#v34 "Direct link to v3.4")

Moved the documentation to Docusaurus and upgraded to TypeScript 5.

## v3.3[​](#v33 "Direct link to v3.3")

Added official Vite support and moved most examples to Vite.

## v3.2[​](#v32 "Direct link to v3.2")

Added support for the recommended Arrow file and stream MIME types.

## v3.1[​](#v31 "Direct link to v3.1")

Added KTX2 support to BasisLoader and introduced KTX2BasisWriter.

## v3.0[​](#v30 "Direct link to v3.0")

Improved TypeScript support and expanded typed loaders and options.

## v2.3[​](#v23 "Direct link to v2.3")

Added Shapefile loading, more compression codecs, and binary geospatial output.

## v2.2[​](#v22 "Direct link to v2.2")

Published TypeScript declarations for packages with public functions and classes.

## v2.1[​](#v21 "Direct link to v2.1")

Expanded geospatial loaders and 3D content support.

## v2.0[​](#v20 "Direct link to v2.0")

Added loader-specific options, composite loaders, and dynamic loading of heavy decoders.

## v1.3[​](#v13 "Direct link to v1.3")

Improved 3D Tiles support and the glTF 2 parser.

## v1.2[​](#v12 "Direct link to v1.2")

Added binary file auto-detection and improved Arrow support in Node.

## v1.1[​](#v11 "Direct link to v1.1")

Introduced GLTFLoader and early 3D Tiles support.

## v1.0[​](#v10 "Direct link to v1.0")

Initial release.

See the [changelog](https://github.com/visgl/loaders.gl/blob/master/CHANGELOG.md) for release-by-release details.
