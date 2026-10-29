Arrow JavaScript · conversion

# Leave data columnar until the application needs rows.

Arrow tables and vectors are efficient because values stay typed and grouped. Extract rows, columns, arrays, or JSON deliberately, then keep the conversion at the edge of the pipeline.

[Arrow JS guide](https://loaders.gl/next/docs/arrowjs.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs.md)[Table API](https://loaders.gl/next/docs/arrowjs/api-reference/table.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/api-reference/table.md)[Row API](https://loaders.gl/next/docs/arrowjs/api-reference/row.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/api-reference/row.md)

Select the smallest conversion

## Convert only the shape the next operation needs.

A column access can stay typed and compact, while a row object is convenient for UI or application logic. Whole-table JSON is useful for interchange but creates the most materialization.

01

Column

Keep a typed vector for columnar work

02

Chunk

Read one underlying batch with minimal copying

03

Row

Create a temporary object for application logic

04

JSON

Materialize a portable representation at the edge

Detailed guide

## Conversion details

The examples below cover row and column access, chunk-aware reads, typed arrays, JSON conversion, and the costs of materialization.

# Extracting Data

While keeping data in Arrow format enables efficient operations, there are many cases where you need native JavaScript values.

## Converting Data[​](#converting-data "Direct link to Converting Data")

Many Arrow classes support:

* `toArray()` — typically returns a typed array or array.
* `toJSON()` — JSON-style values.
* `toString()` — printable representation.

## Extracting Data by Row[​](#extracting-data-by-row "Direct link to Extracting Data by Row")

Get a temporary object representing a row in a table.

```
const row = table.get(0);
```

Rows do not retain a schema reference. Access by index or use row object helpers such as `toJSON()`.

## Extracting Data by Column[​](#extracting-data-by-column "Direct link to Extracting Data by Column")

Get a column vector by name.

```
const column = table.getChild('data');
```

```
const array = table.getChild('columnName')?.toArray();
```

## Extracting data by Column and Batch[​](#extracting-data-by-column-and-batch "Direct link to Extracting data by Column and Batch")

A low-copy approach is to iterate through chunks and read per-chunk typed arrays when tables are chunked.
