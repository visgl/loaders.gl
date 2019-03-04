# Working with Tables

References:
* Much of the text in this section is adapted from Brian Hulette's [Using Apache Arrow JS with Large Datasets](https://observablehq.com/@theneuralbit/using-apache-arrow-js-with-large-datasets)


## Loading Arrow Data

Applications often start with loading some Arrow formatted data. The Arrow API provides several ways to do this, but in many cases, the simplest approach is to use `Table.from()`.

```js
import {Table} from 'apache-arrow';
const response = await fetch(dataUrl);
const arrayBuffer = await response.arrayBuffer();
const dataTable = arrow.Table.from(new Uint8Array(arrayBuffer));
```

## Getting Records Count

```js
const count = table.count();
```

### Getting Arrow Schema Metadata

```js
const fieldNames = table.schema.fields.map(f => f.name);
// Array(3) ["Latitude", "Longitude", "Date"]
```

```js
const fieldTypes = tables.schema.fields.map(f => f.type)
// Array(3) [Float, Float, Timestamp]

const fieldTypeNames = 
// Array(3) ["Float64", "Float64", "Timestamp<MICROSECOND>"]


### Accessing Arrow Table Row Data

```js
const firstRow = tables.get(0) // 1st row data
const lastRow = tables.get(rowCount-1)
```

## Record toJSON and toArray

It is easy to converting Rows to JSON/Arrays/Strings:

```js
toJSON = Array(3) [41.890751259, -87.71617311899999, Int32Array(2)]
toArray = Array(3) [41.933659084, -87.72369064600001, Int32Array(2)]
```

Similar conversion methods are avaiable on many Arrow classes.

tables.get(0).toJSON()

## Slicing Arrow Data

every10KRow = Array(17) [Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3), Array(3)]

Our custom arrow data range stepper for sampling data:

range = ƒ(start, end, step)

### Iterating over Rows and Cells

```js
for (let row of dataFrame) {
  for (let cell of row) {
    if ( Array.isArray(cell) ) {
      td = '[' + cell.map((value) => value == null ? 'null' : value).join(', ') + ']';
    } else if (fields[k] === 'Date') {
      td = toDate(cell); // convert Apache arrow Timestamp to Date
    } else {
      td = cell.toString();
    }
    k++;
  }
}
```


### Converting Dates

Apache Arrow Timestamp is a 64-bit int of milliseconds since the epoch, represented as two 32-bit ints in JS to preserve precision. The fist number is the "low" int and the second number is the "high" int.

```js
function toDate(timestamp) {
  return new Date((timestamp[1] * Math.pow(2, 32) + timestamp[0])/1000);
}
```


### Getting Column Data Stats

latitude = Object {min: 41.644606368000005, max: 42.022547568, range: 0.3779411999999951}
longitude = Object {min: -87.928909442, max: -87.524532645, range: 0.40437679700001183}
dates = Object {min: 2016-12-31T15:18:25.032, max: 2017-08-25T16:40, range: 20478094968}
Our custom numeric and date column stats functions:

columnStats = ƒ(columnName)
dateStats = ƒ(columnName)
Column Data Vectors
Appache arrow stores columns in typed arrays and vectors:

timestampVector = Vector<Timestamp> {data: M, type: Timestamp, length: 165567, view: we}
Typed vectors have convinience methods to convert Int32 arrays data to JS values you can work with.

For example, to get timestamps in milliseconds:

timestamps = Array(10) [2017-01-01, 2017-01-01, 2017-01-01, 2017-01-01, 2017-01-01, 2017-01-01, 2017-01-01, 2017-01-01, 2017-01-01, 2017-01-01]

### Filtering Timestamped Data

```js
function filterByDate(startDate, endDate) {
  const dateFilter = arrow.predicate.custom(i => {
  	const arrowDate = table.getColumn('Date').get(i);
    const date = toDate(arrowDate);
    return date >= startDate && date <= endDate;
  }, b => 1);

  const getDate;
  const results = [];
  table.filter(dateFilter)
    .scan(
      index => {
        results.push({
          'date': toDate(getDate(index))
        });
      },
      batch => {
        getDate = arrow.predicate.col('Date').bind(batch);
      }
    );

  return results;
}
```

Our custom filter by date method uses custom arrow table predicate filter and scan methods to generate JS friendly data you can map or graph:


### Filtering by Days


### Mapping Arrow Data

