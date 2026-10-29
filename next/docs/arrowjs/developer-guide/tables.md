Arrow JS guide · tables

# Read the columns you need, when you need them.

Arrow tables support both row-oriented inspection and column-oriented access. This guide starts with a small IPC load, then shows the operations most applications use to explore and filter the result.

[Arrow JavaScript](https://loaders.gl/next/docs/arrowjs.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs.md)[Arrow API reference](https://loaders.gl/next/docs/arrowjs/api-reference.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/api-reference.md)[Apache Arrow guide](https://loaders.gl/next/docs/developer-guide/apache-arrow.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/apache-arrow.md)

A table in four moves

## Load, inspect, select, and process.

The same Arrow table can be explored as rows or columns. Keep the column view for typed processing, and convert to row objects only at an application boundary that needs them.

01

Load

Read Arrow IPC into a Table

02

Inspect

Use numRows, schema fields, and field types

03

Select

Read rows or child vectors by name

04

Process

Filter, slice, and pass batches downstream

Detailed guide

## Table access patterns

The examples below cover IPC loading, schema inspection, row access, column vectors, timestamp conversion, and filtering.

References:

* Much of the text in this section is adapted from Brian Hulette's [Using Apache Arrow JS with Large Datasets](https://observablehq.com/@theneuralbit/using-apache-arrow-js-with-large-datasets)

## Loading Arrow Data[​](#loading-arrow-data "Direct link to Loading Arrow Data")

Applications often start with loading some Arrow formatted data. In most cases the simplest path is `tableFromIPC()`.

```
import {tableFromIPC} from 'apache-arrow';

const response = await fetch(dataUrl);

const arrayBuffer = await response.arrayBuffer();

const table = tableFromIPC(new Uint8Array(arrayBuffer));
```

## Getting Records Count[​](#getting-records-count "Direct link to Getting Records Count")

```
const count = table.numRows;
```

## Getting Arrow Schema Metadata[​](#getting-arrow-schema-metadata "Direct link to Getting Arrow Schema Metadata")

```
const fieldNames = table.schema.fields.map((f) => f.name);

// Array(3) ["Latitude", "Longitude", "Date"]



const fieldTypes = table.schema.fields.map((field) => field.type);

// Array(3) [Float, Float, Timestamp]



const fieldTypeNames = fieldTypes.map((type) => type.toString());

// Array(3) ["Float64", "Float64", "Timestamp<MICROSECOND>"]
```

## Accessing Arrow Table Row Data[​](#accessing-arrow-table-row-data "Direct link to Accessing Arrow Table Row Data")

```
const firstRow = table.get(0); // 1st row

const lastRow = table.get(table.numRows - 1);
```

## Record `toJSON` and `toArray`[​](#record-tojson-and-toarray "Direct link to record-tojson-and-toarray")

Convert rows to JSON/arrays:

```
const rowJson = table.get(0).toJSON();

const rowArray = table.get(0).toArray();
```

Similar conversion methods are available on many Arrow classes:

`table.get(0).toJSON();`

## Slicing Arrow Data[​](#slicing-arrow-data "Direct link to Slicing Arrow Data")

```
const every10KRows = Array.from({length: 17}, () => table.get(0).toArray());
```

You can build custom row-range utilities as needed for sampling.

## Iterating over Rows and Cells[​](#iterating-over-rows-and-cells "Direct link to Iterating over Rows and Cells")

```
let cellIndex = 0;

for (let rowIndex = 0; rowIndex < table.numRows; rowIndex++) {

  const row = table.get(rowIndex).toJSON();

  cellIndex = 0;

  for (const cell of Object.values(row)) {

    if (Array.isArray(cell)) {

      const td = '[' + cell.map((value) => (value == null ? 'null' : value)).join(', ') + ']';

      console.log(td);

    } else if (Object.keys(row)[cellIndex] === 'Date') {

      const td = toDate(cell);

      console.log(td);

    } else {

      const td = cell.toString();

      console.log(td);

    }

    cellIndex += 1;

  }

}
```

## Converting Dates[​](#converting-dates "Direct link to Converting Dates")

Arrow timestamp values arrive as two 32-bit integers in JS to preserve precision.

```
function toDate(timestamp) {

  return new Date(timestamp[1] * Math.pow(2, 32) + timestamp[0]);

}
```

## Column Data Vectors[​](#column-data-vectors "Direct link to Column Data Vectors")

Arrow tables expose columns as vectors.

For example, to get timestamps in milliseconds:

```
const timestamps = table.getChild('Date')?.toArray();
```

## Filtering Timestamped Data[​](#filtering-timestamped-data "Direct link to Filtering Timestamped Data")

```
function filterByDate(startDate, endDate) {

  const results = [];

  const dateColumn = table.getChild('Date')?.toArray() ?? [];



  for (let i = 0; i < table.numRows; i++) {

    const value = toDate(dateColumn[i]);

    if (value >= startDate && value <= endDate) {

      results.push({date: value});

    }

  }



  return results;

}
```

Our custom filter-by-date method returns matching rows as JS objects that can be graphed or displayed.
