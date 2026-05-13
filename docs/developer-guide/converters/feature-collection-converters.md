# Feature Collection Converters

The GIS converter surface covers both whole feature collections and single geometry values.

## FeatureCollectionConverter

| Field | Value |
| --- | --- |
| Package | `@loaders.gl/gis` |
| `id` | `'feature-collection'` |
| `from` | `'geojson'`, `'flat-geojson'`, `'binary-feature-collection'` |
| `to` | `'geojson'`, `'flat-geojson'`, `'binary-feature-collection'` |
| Typical use | Normalize geospatial features between object, flat, and render-oriented binary forms |

## GeometryConverter

| Field | Value |
| --- | --- |
| Package | `@loaders.gl/gis` |
| `id` | `'geometry'` |
| `from` | `'geojson-geometry'`, `'wkb'`, `'wkt'`, `'twkb'` |
| `to` | `'geojson-geometry'`, `'wkb'`, `'wkt'`, `'twkb'` |
| Typical use | Convert single geometry values without building a feature collection |

## Shape Mapping

| Shape | Meaning |
| --- | --- |
| `geojson` | Standard GeoJSON features |
| `flat-geojson` | Flattened coordinate arrays with geometry metadata |
| `binary-feature-collection` | deck.gl-style renderable points/lines/polygons bins |
| `geojson-geometry` | A single geometry object, not a feature |
| `wkb`, `wkt`, `twkb` | Compact wire formats for single geometries |

## Multi-Geometries

Binary feature collections do not keep a separate top-level family for each multi-geometry type.

Instead:

- `MultiPoint` contributes vertices to the `points` bin
- `MultiLineString` contributes paths to the `lines` bin
- `MultiPolygon` contributes polygon objects and rings to the `polygons` bin

Feature identity is preserved through `featureIds` and `globalFeatureIds`.

## GeometryCollection

`FeatureCollectionConverter` itself is about collection-shape conversion, but render-oriented conversion now supports `GeometryCollection` through the direct geometry-column utilities documented in [Render converters](/docs/developer-guide/converters/render-converters).

For WKB/WKT render conversion:

- `GeometryCollection` is flattened recursively
- point members go to `points`
- line members go to `lines`
- polygon members go to `polygons`
- all members retain the original row index as their global feature id

## Example

```ts
import {convert} from '@loaders.gl/schema-utils';
import {FeatureCollectionConverter, GeometryConverter} from '@loaders.gl/gis';

const binary = convert(features, 'binary-feature-collection', [FeatureCollectionConverter]);
const wkt = convert(binaryGeometry, 'wkt', [GeometryConverter]);
```
