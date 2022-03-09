# @loaders.gl/schema

> Table


## Schemas

## Batches

## Table APIs

The table API is modelled after a subset of the Apache Arrow API:

| Class                                                              | Arrow Counterpart | Description  |
| ------------------------------------------------------------------ | ----------------- | ------------ |
| [`Table`](modules/schema/docs/api-reference/table.md)              | Table             | Table        |
| [`TableSchema`](modules/schema/docs/api-reference/table-schema.md) | `Schema`          | Table schema |
| [`TableBatch`](modules/schema/docs/api-reference/table-batch.md)   | `RecordBatch`     | Table batch  |


## Determining shape of loaded data

loaders.gl favors formats that wrap the data with a `shape` field so that the type of the returned data can be determined at run-time:

```typescript
export type NewDataType = {
  shape: "new-data-type",
  data: TypeOfData,
  schema?: Schema
}
```

However a number of traditional return formats do not include such a wrapper.

## Controlling the shape of loaded data

Loaders are encouraged to provide a `shape` option to allow applications to control the return format. Since different loaders offer different selection of shapes, the option is set per loader.

```typescript
const tile = await load(url, MVTLoader, {mvt: {shape: 'geojson-table', ...}});
assert(tile.shape === 'geojson-table');
processTile(tile.data);
```

### Table Category

| Shape | Category | Types / Description | 
| --- | --- | --- |
| `table` | `Table` |
| `array-row-table` | `ArrayRowTable` |
| `object-row-table` | `ObjectRowTable` |
| `columnar-table` | `ColumnarTable` |

- Tables can be 
- row-oriented, i.e. organized as an array of rows
- columnar, containing one array per column

Rows can contain either
- an array of values, where the column name is found in the schema.
- object with key-value pairs, where the key is the column name

```json
{
  "shape": , 
  "data": 
}
```

## GIS Category


| Shape | Category | Types / Description | 
| --- | --- | --- |
| `geojson` | `GeoJSON` | GeoJSON is a `features` array wrapped at the top level  | 
| `array-row-table` | `ArrayRowTable` |
| `object-row-table` | `ObjectRowTable` |
| `geojson-table` | `GeojsonTable` | GeoJSON table essentially contains the `features` array from the 

