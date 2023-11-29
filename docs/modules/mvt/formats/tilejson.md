# TileJSON / Tilestats

- *[`@loaders.gl/mvt`](/docs/modules/mvt)*
- *[TileJSON specification](https://github.com/mapbox/tilejson-spec/blob/master/3.0.0/README.md)* - *[Tilestats information](https://github.com/mapbox/mapbox-geostats) - *[Tilestats generation](https://github.com/mapbox/mapbox-geostats#output-the-stats)

## TileJSON

A TileJSON file contains JSON-encoded metadata about a vector tileset including which layers and fields (columns) can be found in the tiles.

The information in the TileJSON enables clients (such as web viewers) to understand the structure of data in the tileset up front, instead of piecing it together as tiles are loaded.


While not all vector tilesets have a TileJSON file, when it is present there is normally a single TileJSON file per tileset, and this file is typically found at the root in TMS or XYZ based URL schemas, so that applications can make a speculative attempt to fetch it from a known place.

## tilestats

`tilestats`` is an inofficial "extension" to TileJSON. It provides column statistics, notably:
- the data type of each column
- min/max values for numeric columns (enabling e.g. global color scale calculations).
- a sample of values for each column

tilestats provide "global" information about the data in the tileset that can allows for e.g.
the creation of correct color maps that do not depend on the view (which requires knowing a priori the min and max values of each field / column).

Note that tilestats are not always available for a given tileset, so applications must be prepared to work in their absence.
However, tilestats are output by major tilers such as [tippecanoe](https://github.com/mapbox/mapbox-geostats#output-the-stats).

## Format Description

loaders.gl returns a typed `TileJSON` object, with merged tilestats information (if present).

```typescript
export type TileJSON
```

## Fields

| Data                | Type               | TileJSON | tilestats | Description                                                           |
| ------------------- | ------------------ | -------- | --------- | --------------------------------------------------------------------- |
| `name?`             | `string`           |          |           | Name of the tileset.                                                  |
| `description?`      | `string`           |          |           | Short description of the tileset.                                     |
| `version?`          | `string`           |          |           | Version of the tileset.                                               |
| `tileFormat?`       | `string`           |          |           | Format of the tiles in the tileset..                                  |
| `tilesetType?`      | `string`           |          |           | Type of tileset.                                                      |
| `generator?`        | `string`           |          |           | Generating application. (e.g. tippecanoe adds this).                  |
| `generatorOptions?` | `string`           |          |           | Generating application options. (e.g. tippecanoe adds this).          |
| `scheme?`           | `'xyz'` \| `'tms'` |          |           | Tile indexing scheme. Typically `tms`, i.e `z/x/y` coordinates.       |
| `tiles?`            | `string[]`         |          |           | Sharded URLs (can increased loading speed on HTTP 1 connections)      |
| `boundingBox?`      | `[[w, s], [e, n]]` |          |           | limits of bounding box using axis units and order of specified CRS.   |
| `maxZoom?`          | `number`           |          |           | May be set to the maxZoom of the first layer                          |
| `minZoom?`          | `number`           |          |           | May be set to the minZoom of the first layer                          |
| `center?`           | `number[]`         |          |           | Center point of the data in the tileset                               |
| `htmlAttribution?`  | `string`           |          |           | Attribution (can contain HTML syntax)                                 |
| `htmlLegend?`       | `string`           |          |           | Legend (can contain HTML syntax)                                      |
| `layers?`           | `TileJSONLayer[]`  |          |           | Layer information (combines tilestats (if present) and tilejson info) |
| `metaJson?`         | `any`              |          |           | Any unparsed, nested JSON metadata                                              |

- `boundingBox` typing: `[min: [w: number, s: number], max: [e: number, n: number]]`

```ts
export type TileJSONLayer;
```

| Data                | Type              | TileJSON | tilestats | Description                                                                          |
| ------------------- | ----------------- | -------- | --------- | ------------------------------------------------------------------------------------ |
| `name`              | `string`          |          |           | The name (id) of this layer (tilejson.vector_layers[].id / tilestats.layers[].layer) |
| `description?`      | `string`          |          |           | The description of this layer (tilejson.layer.description)                           |
| `featureCount?`     | `number`          |          |           | The number of features in this layer (tilestats.layer.count)                         |
| `dominantGeometry?` | `string`          |          |           | The dominant geometry type in this layer (tilestats.layer.geometry)                  |
| `minZoom?`          | `number`          |          |           | An array of details about the first 100 attributes in this layer                     |
| `maxZoom?`          | `number`          |          |           |                                                                                      |
| `fields`            | `TileJSONField[]` |          |           |                                                                                      |


```ts
export type TileJSONField;
```

| Data                | Type        | TileJSON | tilestats | Description                                          |
| ------------------- | ----------- | -------- | --------- | ---------------------------------------------------- |
| `name`              | `string`    |          |           | The name of this attribute                           |
| `description?`      | `string`    |          |           |                                                      |
| `type`              | `string`    |          |           |                                                      |
| `min?`              | `number`    |          |           | min value (if there are *any* numbers in the values) |
| `max?`              | `number`    |          |           | max value (if there are *any* numbers in the values) |
| `uniqueValueCount?` | `number`    |          |           | Number of unique values across the tileset           |
| `values?`           | `unknown[]` |          |           | An array of this attribute's first 100 unique values |
