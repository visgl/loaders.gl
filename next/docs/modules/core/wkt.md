# Geometry codecs

`@loaders.gl/core/wkt` provides direct WKT, WKB, and TWKB geometry conversion utilities. Use it when building a loader or processing an existing geometry without core's loader selection, fetching, or worker dispatch.

```
npm install @loaders.gl/core
```

```
import {convertWKTToGeometry, convertGeometryToWKT} from '@loaders.gl/core/wkt';



const geometry = convertWKTToGeometry('POINT (10 20)');

const text = convertGeometryToWKT(geometry);
```

| Export                                           | Purpose                                         |
| ------------------------------------------------ | ----------------------------------------------- |
| `convertWKTToGeometry`, `convertGeometryToWKT`   | Convert between WKT text and geometry objects.  |
| `convertWKBToGeometry`, `convertGeometryToWKB`   | Convert between WKB bytes and geometry objects. |
| `isTWKB`                                         | Test whether input has a supported TWKB header. |
| `convertTWKBToGeometry`, `convertGeometryToTWKB` | Decode and encode TWKB geometry.                |

TWKB helpers are also available from `@loaders.gl/core/wkt/twkb`. The core root does not re-export these utilities, and this subpath does not depend on a format package.

For loader and writer descriptors used with `load`, `parse`, or `encode`, install `@loaders.gl/geospatial` and use its [WKT, WKB, and TWKB APIs](https://loaders.gl/next/docs/modules/geospatial/wkt.md). WKT coordinate-reference-system definitions are a separate API documented by [WKTCRSLoader](https://loaders.gl/next/docs/modules/geospatial/wkt/api-reference/wkt-crs-loader.md).
