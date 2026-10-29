Arrow JavaScript · examples

# Try the smallest useful Arrow programs.

These examples show the common entry points without hiding the data shape: read IPC, combine buffers, create a table from arrays, and fetch a remote stream.

[Getting started](https://loaders.gl/next/docs/arrowjs/get-started.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/get-started.md)[Reading and writing](https://loaders.gl/next/docs/arrowjs/developer-guide/reading-and-writing.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/developer-guide/reading-and-writing.md)[Arrow in loaders.gl](https://loaders.gl/next/docs/developer-guide/apache-arrow.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/apache-arrow.md)

Four starting points

## Use the example that matches your input.

Arrow JS can consume IPC bytes, build tables from typed arrays, or iterate through a response. The resulting table and record-batch APIs are the same.

01

On disk

Read a complete IPC file

02

Split buffers

Combine schema and record buffers

03

In memory

Create columns from JavaScript arrays

04

Over HTTP

Fetch and iterate through record batches

Detailed guide

## Example details

The snippets below are intentionally small. Follow the linked guides when you need schemas, writers, builders, workers, or loaders.gl integration.

# Examples

Some short examples

### Get a table from an Arrow file on disk (in IPC format)[​](#get-a-table-from-an-arrow-file-on-disk-in-ipc-format "Direct link to Get a table from an Arrow file on disk (in IPC format)")

```
import {readFileSync} from 'fs';

import {tableFromIPC} from 'apache-arrow';



const arrow = readFileSync('simple.arrow');

const table = tableFromIPC([arrow]);



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

### Create a Table when the Arrow file is split across buffers[​](#create-a-table-when-the-arrow-file-is-split-across-buffers "Direct link to Create a Table when the Arrow file is split across buffers")

```
import {readFileSync} from 'fs';

import {tableFromIPC} from 'apache-arrow';



const table = tableFromIPC(

  ['latlong/schema.arrow', 'latlong/records.arrow'].map((file) => readFileSync(file))

);



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

### Create a Table from JavaScript arrays[​](#create-a-table-from-javascript-arrays "Direct link to Create a Table from JavaScript arrays")

```
import {tableFromArrays} from 'apache-arrow';



const LENGTH = 2000;



const rainAmounts = Float32Array.from({length: LENGTH}, () =>

  Number((Math.random() * 20).toFixed(1))

);



const durations = Int32Array.from({length: LENGTH}, (_, i) => i + 1);



const rainfall = tableFromArrays({

  precipitation: rainAmounts,

  duration: durations

});
```

### Load data with `fetch`[​](#load-data-with-fetch "Direct link to load-data-with-fetch")

```
import {tableFromIPC} from 'apache-arrow';



const tableFromResponse = await tableFromIPC(fetch('/simple.arrow'));

const response = await fetch('/simple.arrow');

const tableFromArrayBuffer = await tableFromIPC(await response.arrayBuffer());



console.log(tableFromResponse.toString());

console.log(tableFromArrayBuffer.toString());
```

### Columns look like JS Arrays[​](#columns-look-like-js-arrays "Direct link to Columns look like JS Arrays")

```
import {readFileSync} from 'fs';

import {tableFromIPC} from 'apache-arrow';



const table = tableFromIPC(['latlong/schema.arrow', 'latlong/records.arrow'].map(path => readFileSync(path)));



const column = table.getChild('origin_lat');



if (column) {

  // Copy the data into a typed array.

  const typed = column.toArray();

  assert(typed instanceof Float32Array);



  for (let i = -1, n = column.length; ++i < n; ) {

    assert(column.get(i) === typed[i]);

  }

}
```
