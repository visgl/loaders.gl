# TileJSON / Tilestats

- *[`@loaders.gl/mvt`](/docs/modules/mvt)*
- *[TileJSON specification](https://github.com/mapbox/tilejson-spec/blob/master/3.0.0/README.md)* - *[Tilestats information](https://github.com/mapbox/mapbox-geostats) - *[Tilestats generation](https://github.com/mapbox/mapbox-geostats#output-the-stats)

## TileJSON

A TileJSON file contains JSON-encoded metadata about a vector tileset including which layers, fields (columns) etc can be found in the tiles.
The information in the TileJSON enables clients (such as web viewers) to understand the structure of data in the tileset up front, instead of piecing it together as tiles are loaded.


While all vector tilesets have a TileJSON file, when it is present there is normally a single TileJSON file per tileset. This file is typically found at the root in TMS or XYZ based URL schemas, so that applications can attempt to fetch it in a known place.


## Tilestats

Tilestats is an inofficial "extension" to TileJSON. It provides column statistics, notably:
- the data type of each column
- min/max values for numeric columns (enabling e.g. global color scale calculations).
- a sample of values for each column

Tilestats provide "global" information about the tileset (such as min and max values of each field etc) that can be critical for
creating correct color maps that do not depend on the view. 

Note that tilestats are not always available so applications must be prepared to work in their absence.
However, tilestats are output by major tilers such as [tippecanoe](https://github.com/mapbox/mapbox-geostats#output-the-stats).


## Format Description

Parsed and typed TileJSON, merges Tilestats information if present

```typescript
export type TileJSON
```

## Fields

| Data                | Type               | TileJSON | tilestats | Description                                                          |
| ------------------- | ------------------ | -------- | --------- |
| `name?`             | `string`           |          |           |
| `description?`      | `string`           |          |           |
| `version?`          | `string`           |          |           |
| `tileFormat?`       | `string`           |          |           |
| `tilesetType?`      | `string`           |          |           |
| `generator?`        | `string`           |          |           | Generating application. Tippecanoe adds this.                        |
| `generatorOptions?` | `string`           |          |           | Generating application options. Tippecanoe adds this.                |
| `scheme?`           | `'xyz'` \| `'tms'` |          |           |                                                                      | Tile indexing scheme                                                                                              |
| `tiles?`            | `string[]`         |          |           | Sharded URLs                                                         |
| `boundingBox?`      |                    |          |           | `[min: [w: number, s: number], max: [e: number, n: number]]`         | `[[w, s], [e, n]]`, indicates the limits of the bounding box using the axis units and order of the specified CRS. |
| `maxZoom?`          | number             |          |           | null`                                                                | May be set to the maxZoom of the first layer                                                                      |
| `minZoom?`          | number             |          |           | null`                                                                | May be set to the minZoom of the first layer                                                                      |
| `center?`           | number[]           |          |           | null`                                                                |
| `htmlAttribution?`  | `string`           |          |           |
| `htmlLegend?`       | `string`           |          |           |
| `layers?`           | `TileJSONLayer[]`  |          |           | Combination of tilestats (if present) and tilejson layer information |
| `metaJson?`         | `any``             |          |           | `null`                                                               |                                                                                                                   |  | Any nested JSON metadata |

```ts
export type TileJSONLayer;
```

| Data                | Type              | TileJSON | tilestats | Description                                                                          |
| ------------------- | ----------------- | -------- | --------- | ------------------------------------------------------------------------------------ |
| `name`              | `string`          |          |           | The name (id) of this layer (tilejson.vector_layers[].id / tilestats.layers[].layer) |
| `description?`      | `string`          |          |           | The description of this layer (tilejson.layer.description)                           |
| `featureCount?`     | number`           |          |           | The number of features in this layer (tilestats.layer.count)                         |
| `dominantGeometry?` | `string`          |          |           | The dominant geometry type in this layer (tilestats.layer.geometry)                  |
| `minZoom?`          | number`           |          |           | An array of details about the first 100 attributes in this layer                     |
| `maxZoom?`          | number`           |          |           |                                                                                      |
| `fields`            | `TileJSONField[]` |          |           |


```ts
export type TileJSONField;
```

| Data                | Type       | TileJSON | tilestats | Description                                          |
| ------------------- | ---------- | -------- | --------- | ---------------------------------------------------- |
| name                | string     |          |           | The name of this attribute                           |
| `description?`      | `string`   |          |           |                                                      |
| `type`              | `string`   |          |           |                                                      |
| `min?`              | number`    |          |           | min value (if there are *any* numbers in the values) |
| `max?`              | number`    |          |           | max value (if there are *any* numbers in the values) |
| `uniqueValueCount?` | number`    |          |           | Number of unique values across the tileset           |
| `values?`           | unknown[]` |          |           | An array of this attribute's first 100 unique values |

