# @loaders.gl/geotiff

[loaders.gl](https://loaders.gl/docs) is a collection of framework-independent 3D and geospatial parsers and encoders.

This module contains loaders and viewport-driven raster sources for TIFF and GeoTIFF formats.

Exports include:

- `GeoTIFFLoader` for loader-based parsing
- `GeoTIFFSource` / `GeoTIFFRasterSource` for viewport-driven raster access
- `OMETiffSource` / `OMETiffImageSource` for non-geospatial OME-TIFF planes
- `loadGeoTiff()` / `TiffPixelSource` for lower-level pixel-source workflows

`GeoTIFFSource` accepts 2D viewports and returns typed raster payloads suitable for texture upload.
The first version preserves source CRS metadata and rejects reprojection requests instead of
resampling into a different projection.

For documentation please visit the [website](https://loaders.gl).
