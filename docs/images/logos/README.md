# Format Logos

This directory holds source logo assets for the documentation format gallery. The website delivery
copies live in `website/static/images/format-logos` and should use the same filenames.

The gallery uses official project logos where available. Formats without one use a simple name
badge with a category symbol, rendered by the gallery component. OGC standards without a dedicated mark pair the unchanged
OGC symbol and a readable OGC label with the format name. All visuals share a common frame; optical size adjustments account
for different proportions and intrinsic asset margins.

Keep source assets and their website delivery copies identical.

The YAML mark is sourced from the [YAML common image assets](https://github.com/yaml/yaml-common/blob/main/image/yaml-logo.svg).
The TOML mark is sourced from the [official TOML logo](https://github.com/toml-lang/toml/blob/main/logos/toml.svg).

## Official project assets

| Asset | Source |
| --- | --- |
| ArcGIS | [Esri media resources](https://www.esri.com/en-us/about/media-relations/b-roll), image attribution: Esri |
| Draco | [Official horizontal Draco artwork](https://github.com/google/draco/blob/main/docs/artwork/draco3d-horiz.svg) |
| GeoArrow | [GeoArrow](https://geoarrow.org/geoarrow_logo.png) |
| glTF and KTX | [Khronos logos](https://www.khronos.org/legal/trademarks/) |
| JSON | [JSON](https://www.json.org/img/json160.gif) |
| NetCDF | [NSF Unidata](https://www.unidata.ucar.edu/software/netcdf/) |
| OGC | [Open Geospatial Consortium](https://www.ogc.org/wp-content/uploads/2026/02/ogc-new-logo-website.svg) |
| OpenUSD | [OpenUSD](https://openusd.org/images/USDLogoUnsized.svg) |
| ORC | [Apache ORC](https://orc.apache.org/img/logo.png) |
| Perfetto | [Perfetto](https://perfetto.dev/assets/brand.png) |
| STAC | [STAC](https://stacspec.org/public/images-original/STAC-01.png) |
| Zarr | [Official Zarr logo repository](https://github.com/zarr-developers/zarr-logo) |

KTX and the KTX logo are trademarks of the Khronos Group Inc.
glTF and the glTF logo are trademarks of the Khronos Group Inc.
The composite OGC badges are documentation labels, not official OGC product logos.

`ogc-mark.svg` crops the official SVG viewBox to its symbol without redrawing the artwork.
ArcGIS service badges append the service name to the official ArcGIS logo.

The shared registry and renderer live in `website/src/components/docs/format-logo.tsx`.
Use `FormatLogo` for format badges, `DocPageHeader`'s `format` property for headers, and
`format` entries in its `logos` array for multiple standards. Keep format asset selection
in the registry so gallery cards, headers, and format navigation stay consistent.
