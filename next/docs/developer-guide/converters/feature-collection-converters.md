Converter guide · GIS shapes

# Change the geometry representation at the boundary.

Use the GIS converters when the same features need to move between standard GeoJSON, flattened coordinates, render-oriented binary bins, or compact WKB/WKT/TWKB values.

[GeoArrow module](https://loaders.gl/next/docs/modules/core/geoarrow.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/geoarrow.md)[Render converters](https://loaders.gl/next/docs/developer-guide/converters/render-converters.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/converters/render-converters.md)[Format categories](https://loaders.gl/next/docs/developer-guide/converters/format-categories.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/converters/format-categories.md)

Choose the shape for the next step

## Keep features readable, compact, or render-ready.

The converter id tells you which boundary you are crossing. Collection converters preserve feature-oriented meaning; geometry converters work on one geometry value; render converters prepare the typed arrays a layer consumes.

01

FeatureCollectionConverter

GeoJSON, flat GeoJSON, and binary feature collections

02

GeometryConverter

Single geometry values and wire formats

03

Identity

Feature and row ids remain available after conversion

04

Use it when

The next consumer expects a different data shape

Detailed guide

## Converter ids and shape mappings

The reference below documents the registered converter contracts, multi-geometries, GeometryCollection handling, and representative usage.

The GIS converter surface covers both whole feature collections and single geometry values.

## FeatureCollectionConverter[​](#featurecollectionconverter "Direct link to FeatureCollectionConverter")

| Field       | Value                                                                                |
| ----------- | ------------------------------------------------------------------------------------ |
| Package     | `@loaders.gl/core/geoarrow`                                                          |
| `id`        | `'feature-collection'`                                                               |
| `from`      | `'geojson'`, `'flat-geojson'`, `'binary-feature-collection'`                         |
| `to`        | `'geojson'`, `'flat-geojson'`, `'binary-feature-collection'`                         |
| Typical use | Normalize geospatial features between object, flat, and render-oriented binary forms |

## GeometryConverter[​](#geometryconverter "Direct link to GeometryConverter")

| Field       | Value                                                                |
| ----------- | -------------------------------------------------------------------- |
| Package     | `@loaders.gl/core/geoarrow`                                          |
| `id`        | `'geometry'`                                                         |
| `from`      | `'geojson-geometry'`, `'wkb'`, `'wkt'`, `'twkb'`                     |
| `to`        | `'geojson-geometry'`, `'wkb'`, `'wkt'`, `'twkb'`                     |
| Typical use | Convert single geometry values without building a feature collection |

## Shape Mapping[​](#shape-mapping "Direct link to Shape Mapping")

| Shape                       | Meaning                                             |
| --------------------------- | --------------------------------------------------- |
| `geojson`                   | Standard GeoJSON features                           |
| `flat-geojson`              | Flattened coordinate arrays with geometry metadata  |
| `binary-feature-collection` | deck.gl-style renderable points/lines/polygons bins |
| `geojson-geometry`          | A single geometry object, not a feature             |
| `wkb`, `wkt`, `twkb`        | Compact wire formats for single geometries          |

## Multi-Geometries[​](#multi-geometries "Direct link to Multi-Geometries")

Binary feature collections do not keep a separate top-level family for each multi-geometry type.

Instead:

* `MultiPoint` contributes vertices to the `points` bin
* `MultiLineString` contributes paths to the `lines` bin
* `MultiPolygon` contributes polygon objects and rings to the `polygons` bin

Feature identity is preserved through `featureIds` and `globalFeatureIds`.

## GeometryCollection[​](#geometrycollection "Direct link to GeometryCollection")

`FeatureCollectionConverter` itself is about collection-shape conversion, but render-oriented conversion now supports `GeometryCollection` through the direct geometry-column utilities documented in [Render converters](https://loaders.gl/next/docs/developer-guide/converters/render-converters.md).

For WKB/WKT render conversion:

* `GeometryCollection` is flattened recursively
* point members go to `points`
* line members go to `lines`
* polygon members go to `polygons`
* all members retain the original row index as their global feature id

## Example[​](#example "Direct link to Example")

```
import {convert} from '@loaders.gl/core/schema-utils';

import {FeatureCollectionConverter, GeometryConverter} from '@loaders.gl/core/geoarrow';



const binary = convert(features, 'binary-feature-collection', [FeatureCollectionConverter]);

const wkt = convert(binaryGeometry, 'wkt', [GeometryConverter]);
```
