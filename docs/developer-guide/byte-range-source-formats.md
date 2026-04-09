# Byte-Range Source Formats

loaders.gl supports several Sources for cloud-native formats that store many logical assets in
one or a few large byte-range-addressable files.

## Covered Sources

| Source | Module | Large file or files | Application unit | URL behavior |
| ------ | ------ | ------------------- | ---------------- | ------------ |
| `PMTilesSource` | `@loaders.gl/pmtiles` | `.pmtiles` | vector or image tile | Uses range requests through the PMTiles package and the loaders.gl scheduler for URL archives. |
| `GeoTIFFSource` | `@loaders.gl/geotiff` | `.tif`, `.tiff`, COG | image window or Web Mercator tile | Uses geotiff.js with a custom scheduled range client. |
| `OMETiffSource` | `@loaders.gl/geotiff` | `.ome.tif`, `.ome.tiff` | raster plane or pixel tile | Uses the same GeoTIFF range client and exposes OME dimension selection. |
| `COPCSource` | `@loaders.gl/copc` | `.copc.laz` | COPC hierarchy node | Uses a scheduled Getter for the COPC package. |
| `PotreeSource` | `@loaders.gl/potree` | `metadata.json`, `hierarchy.bin`, `octree.bin` | Potree octree node | Uses range requests for PotreeConverter 2.x hierarchy and point data. |

## Which Source Should I Use?

Use `PMTilesSource` for map tile archives. It preserves the tile's original image or vector
tile encoding and can parse common tile payloads.

Use `GeoTIFFSource` for georeferenced map rasters. It is intended for north-up GeoTIFF and
Cloud-Optimized GeoTIFF images.

Use `OMETiffSource` for microscopy TIFFs with OME metadata. It keeps OME's non-spatial
dimensions visible through `selection`.

Use `COPCSource` for LAZ point clouds that follow the Cloud-Optimized Point Cloud layout.
COPC is a single LAZ-compatible file with hierarchy and point data reachable by byte range.

Use `PotreeSource` for Potree datasets. Legacy `cloud.js` datasets keep the existing
file-per-node path; PotreeConverter 2.x datasets should be opened at `metadata.json` or the
dataset directory.

## Tradeoff

Batched range loading improves throughput when a viewport requests several nearby tiles or
nodes. It adds up to `batchDelayMs` of intentional delay before transport starts. Tune or
disable the delay for workflows that load only one random tile at a time.

