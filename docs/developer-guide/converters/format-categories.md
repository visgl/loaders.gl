# Format Categories

The converters connect a few distinct format families. Keeping those families straight makes the API much easier to reason about.

## Table Shapes

| Shape | Family | Notes |
| --- | --- | --- |
| `arrow` | Apache Arrow | Raw Arrow `Table` |
| `arrow-table` | loaders.gl table wrapper | Arrow-backed wrapper shape |
| `object-row-table` | loaders.gl table wrapper | row objects |
| `array-row-table` | loaders.gl table wrapper | row arrays |
| `columnar-table` | loaders.gl table wrapper | column-oriented wrapper |
| `geojson-table` | loaders.gl table wrapper | rows with GeoJSON-style geometry/properties |
| `geoarrow` | GeoArrow table | Arrow table with GeoArrow geometry metadata |

## Geometry Formats

| Shape | Family | Notes |
| --- | --- | --- |
| `geojson-geometry` | GeoJSON | single geometry object |
| `wkb` | wire format | binary |
| `wkt` | wire format | text |
| `twkb` | wire format | compact binary |
| `geoarrow.wkb` | GeoArrow encoding | WKB stored in Arrow column |
| `geoarrow.wkt` | GeoArrow encoding | WKT stored in Arrow column |

## Native GeoArrow Encodings

| Shape | Meaning |
| --- | --- |
| `geoarrow.point` | native point column |
| `geoarrow.linestring` | native linestring column |
| `geoarrow.polygon` | native polygon column |
| `geoarrow.multipoint` | native multipoint column |
| `geoarrow.multilinestring` | native multilinestring column |
| `geoarrow.multipolygon` | native multipolygon column |
| `geoarrow.geometry` | dense union over geometry families |
| `geoarrow.geometrycollection` | GeometryCollection encoding |

## Feature Collection Shapes

| Shape | Family | Notes |
| --- | --- | --- |
| `geojson` | object model | standard feature collections |
| `flat-geojson` | flattened geometry model | still feature-oriented |
| `binary-feature-collection` | render model | points/lines/polygons bins |
| `arrow-binary-feature-collection` | Arrow-backed render model | Arrow wrapper over binary bins |

## How Multi-Geometries Map

| Geometry | Render family |
| --- | --- |
| `Point`, `MultiPoint` | `points` |
| `LineString`, `MultiLineString` | `lines` |
| `Polygon`, `MultiPolygon` | `polygons` |

This mapping is why binary feature collections are family-based rather than geometry-class-based.

## How GeometryCollection Maps

`GeometryCollection` does not get its own render bin.

Instead it is flattened into the existing families:

- point members -> `points`
- line members -> `lines`
- polygon members -> `polygons`

The source feature or row identity is preserved in the id arrays.
