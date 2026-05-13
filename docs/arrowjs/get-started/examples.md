# Examples

Some short examples

### Get a table from an Arrow file on disk (in IPC format)

```typescript
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

### Create a Table when the Arrow file is split across buffers

```typescript
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

### Create a Table from JavaScript arrays

```typescript
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

### Load data with `fetch`

```typescript
import {tableFromIPC} from 'apache-arrow';

const tableFromResponse = await tableFromIPC(fetch('/simple.arrow'));
const response = await fetch('/simple.arrow');
const tableFromArrayBuffer = await tableFromIPC(await response.arrayBuffer());

console.log(tableFromResponse.toString());
console.log(tableFromArrayBuffer.toString());
```

### Columns look like JS Arrays

```typescript
import {readFileSync} from 'fs';
import {tableFromIPC} from 'apache-arrow';

const table = tableFromIPC(['latlong/schema.arrow', 'latlong/records.arrow'].map(readFileSync));

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
