# Roadmap

loaders.gl is developed under open governance by multiple contributors working with their own priorities.
While it is hard to predict what work will be completed and when, current development tracks and aspirations include:

## v5.0

- **Cloud native** (raster/data): `GeoTIFFLoader`, `ZarrLoader`, kerchunk, NetCDF4, ... 
- **Cloud native** (point clouds): `COPCService`, `POTreeV2Service`...
- Unbundled loaders (load non-worker loaders as separate bundle, similar to how workers are loaded today).
- More comprehensive support for `options.shape` to control the output format of loaders.
- `ffmpeg` WASM integration for `@loaders.gl/video`

## v4.x

- `TableTileSource` - tile adapter for WMS (support binary in/out)
- `Tile3DSource` - tile source for 3D Tiles
- Better examples, integrate examples into pages, improve drag and drop for testing.
- Better schema support in all loaders
- Option to return Apache Arrow from all loaders
- user controlled logging
- `BasisLoader` - WebGPU / luma v9 compatibility

"Completionist tasks" 
- ArcGISImageServerSource
- ArcGISFeatureServerSource
- WFSSource
- WMTSSource
- ...

## v4.0 ✅

- EcmaScript module support ✅
- More gLTF Extensions: `EXT_mesh_features` and `EXT_structural_metadata` for 1.1 3D Tiles attributes support ✅
- More comprehensive support for `options.shape` to control the output format of loaders.  ✅
- Node v18 support.  ✅
