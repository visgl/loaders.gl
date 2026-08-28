# Zarr, GeoZarr, and OME-Zarr

<p class="badges">
  <a href="/docs/developer-guide/common-scan-architecture">
    <img src="https://img.shields.io/badge/Scan-Supported-2f855a.svg?style=flat-square" alt="Scan supported" />
  </a>
</p>

- _[`@loaders.gl/zarr`](/docs/modules/zarr)_
- _[Zarr specification](https://zarr-specs.readthedocs.io/)_
- _[OME-Zarr specification](https://ngff.openmicroscopy.org/)_

Zarr stores typed multidimensional arrays as independently addressable chunks. OME-Zarr adds
bioimaging conventions such as multiscale image pyramids, channels, and labeled dimensions.
GeoZarr and CF/xarray conventions add coordinate reference systems, transforms, coordinate arrays,
and named scientific dimensions.

## Format support

| Capability | Zarr v2 | Zarr v3 | OME-Zarr | GeoZarr / CF |
| --- | --- | --- | --- | --- |
| Metadata discovery | Supported | Supported | Supported | Supported |
| Chunk reads and codecs | Supported | Supported | Supported | Supported |
| Multidimensional arrays | Supported | Supported | Supported | Supported |
| Multiscale image levels | Format-specific | Format-specific | Supported | Not assumed |
| Spatial CRS and transform | Not inherent | Not inherent | Not required | Supported |
| Named time/z/band selection | Array-dependent | Array-dependent | Supported | Supported |

## Scan support

| Scan feature | OME-Zarr | GeoZarr / CF |
| --- | --- | --- |
| Entry point | `getRaster()` | `getRaster()` |
| Discovery | Channels, dimensions, levels | Variable, dtype, dimensions, bounds, CRS |
| Spatial selection | Image window | Native-CRS viewport window |
| Resolution | Multiscale level pushdown | Native resolution |
| Non-spatial selection | Channels, time, z | Named dimension indices |
| Physical access | Selected chunks | Selected chunks |
| Output | Typed image data | Typed raster data |
| Reprojection | Not applicable to ordinary image coordinates | Not performed |

The common contract standardizes discovery and query meaning; it does not hide the array's native
dimension labels, chunk layout, or coordinate system.
