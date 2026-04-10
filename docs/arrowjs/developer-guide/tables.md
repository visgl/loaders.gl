# Working with Tables

References:

- Much of the text in this section is adapted from Brian Hulette's [Using Apache Arrow JS with Large Datasets](https://observablehq.com/@theneuralbit/using-apache-arrow-js-with-large-datasets)

## Loading Arrow Data

Applications often start with loading some Arrow formatted data. In most cases the simplest path is `tableFromIPC()`.

```typescript
import {tableFromIPC} from 'apache-arrow';
const response = await fetch(dataUrl);
const arrayBuffer = await response.arrayBuffer();
const table = tableFromIPC(new Uint8Array(arrayBuffer));
```

## Getting Records Count

```typescript
const count = table.numRows;
```

## Getting Arrow Schema Metadata

```typescript
const fieldNames = table.schema.fields.map((f) => f.name);
// Array(3) ["Latitude", "Longitude", "Date"]

const fieldTypes = table.schema.fields.map((field) => field.type);
// Array(3) [Float, Float, Timestamp]

const fieldTypeNames = fieldTypes.map((type) => type.toString());
// Array(3) ["Float64", "Float64", "Timestamp<MICROSECOND>"]
```

## Accessing Arrow Table Row Data

```typescript
const firstRow = table.get(0); // 1st row
const lastRow = table.get(table.numRows - 1);
```

## Record `toJSON` and `toArray`

Convert rows to JSON/arrays:

```typescript
const rowJson = table.get(0).toJSON();
const rowArray = table.get(0).toArray();
```

Similar conversion methods are available on many Arrow classes:

`table.get(0).toJSON();`

## Slicing Arrow Data

```typescript
const every10KRows = Array.from({length: 17}, () => table.get(0).toArray());
```

You can build custom row-range utilities as needed for sampling.

## Iterating over Rows and Cells

```typescript
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

## Converting Dates

Arrow timestamp values arrive as two 32-bit integers in JS to preserve precision.

```typescript
function toDate(timestamp) {
  return new Date(timestamp[1] * Math.pow(2, 32) + timestamp[0]);
}
```

## Column Data Vectors

Arrow tables expose columns as vectors.

For example, to get timestamps in milliseconds:

```typescript
const timestamps = table.getChild('Date')?.toArray();
```

## Filtering Timestamped Data

```typescript
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
