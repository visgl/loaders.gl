# Roadmap

## v4.0

loaders.gl is developed under open governance by multiple contributors.
While it is hard to catalog all ongoing work, current development tracks and aspirations include:

- New loaders: `GeoTIFFLoader`, `ZarrLoader`, `AVROLoader`,
- More comprehensive support for `options.shape` to control the output format of loaders.
- More gLTF Extensions: `EXT_mesh_features` and `EXT_structural_metadata` for 1.1 3D Tiles attributes support
- I3S: feature completeness and performance
- `ffmpeg` WASM integration for `@loaders.gl/video`
- EcmaScript module support
- Unbundled loaders.
- Replace `Schema` class with arrow schema if arrowjs tree-shaking improvements are satisfactory.
- Node v18 support (as Node 16 is close to it's support end)

**tile-converter functional extension**:

- Сonversion of S2 bounding volume to Oriented Bounding Boxes format (OBB)
- Support conversion of non-indexed geometry
- 3DTiles Implicit tiling 1.1 support
- [.3tz](https://github.com/Maxar-Corp/3tz-specification/tree/main) (3DTiles archive format) support for conversion into I3S
- Better SLPK (I3S archive format) support:
  - Support Large SLPK (>2gb) input for tile-converter
  - Hash generation for SLPKs
  - `i3s-server` (part of tile-converter npm package) - serve SLPKs as a local HTTP server
  - `slpk-extractor` (part of tile-converter npm package) - extract an SLPK to a dataset that can be served via `i3s-server`
- Pre-processing for conversion 3DTiles > I3S:
  - Detect topology type (for example TRIANGLE and TRIANGLE_STRIP will pass further for conversion, POINT or TRIANGLE_FAN will notify this mesh type is not supported for conversion)
  - Detect attributes classes for `EXT_feature_metadata` and for `EXT_mesh_features` extensions. Choose a class to convert in CLI with arrow keys.


**tile-converter performance and usability optimizations**:
- Exclude Tileset 3D and Tile 3D classes during conversion (it gives a RAM usage improvement)
- Tile-converter: offline conversion. No internet is required during the conversion process
