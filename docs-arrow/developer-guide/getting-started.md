# Getting Started


## Installing Apache Arrow

The Apache Arrow JS bindings are published as an npm module.

```sh
npm install apache-arrow
```
or
```sh
yarn add apache-arrow
```


## Usage Examples


### Get a table from an Arrow file on disk (in IPC format)

```js
import { readFileSync } from 'fs';
import { Table } from 'apache-arrow';

const arrow = readFileSync('simple.arrow');
const table = Table.from([arrow]);

console.log(table.toString());

/*
 foo,  bar,  baz
   1,    1,   aa
null, null, null
   3, null, null
   4,    4,  bbb
   5,    5, cccc
*/
```

### Create a Table when the Arrow file is split across buffers

```js
import { readFileSync } from 'fs';
import { Table } from 'apache-arrow';

const table = Table.from([
    'latlong/schema.arrow',
    'latlong/records.arrow'
].map((file) => readFileSync(file)));

console.log(table.toString());

/*
        origin_lat,         origin_lon
35.393089294433594,  -97.6007308959961
35.393089294433594,  -97.6007308959961
35.393089294433594,  -97.6007308959961
29.533695220947266, -98.46977996826172
29.533695220947266, -98.46977996826172
*/
```

### Create a Table from JavaScript arrays

```js
import {
  Table,
  FloatVector,
  DateVector
} from 'apache-arrow';

const LENGTH = 2000;

const rainAmounts = Float32Array.from(
  { length: LENGTH },
  () => Number((Math.random() * 20).toFixed(1)));

const rainDates = Array.from(
  { length: LENGTH },
  (_, i) => new Date(Date.now() - 1000 * 60 * 60 * 24 * i));

const rainfall = Table.new(
  [FloatVector.from(rainAmounts), DateVector.from(rainDates)],
  ['precipitation', 'date']
);
```

### Load data with `fetch`

```js
import { Table } from "apache-arrow";

const table = await Table.from(fetch(("/simple.arrow")));
console.log(table.toString());

```

### Columns look like JS Arrays

```js
import { readFileSync } from 'fs';
import { Table } from 'apache-arrow';

const table = Table.from([
    'latlong/schema.arrow',
    'latlong/records.arrow'
].map(readFileSync));

const column = table.getColumn('origin_lat');

// Copy the data into a TypedArray
const typed = column.toArray();
assert(typed instanceof Float32Array);

for (let i = -1, n = column.length; ++i < n;) {
    assert(column.get(i) === typed[i]);
}
```
