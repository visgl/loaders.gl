---
title: Arrow JavaScript examples
description: Start with small Arrow table examples for files, buffers, arrays, and browser requests.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Arrow JavaScript · examples"
  title="Try the smallest useful Arrow programs."
  description="These examples show the common entry points without hiding the data shape: read IPC, combine buffers, create a table from arrays, and fetch a remote stream."
  tone="cyan"
  meta={['Copyable examples', 'IPC files', 'Browser and Node.js']}
  links={[
    {label: 'Getting started', to: '/docs/arrowjs/get-started'},
    {label: 'Reading and writing', to: '/docs/arrowjs/developer-guide/reading-and-writing'},
    {label: 'Arrow in loaders.gl', to: '/docs/developer-guide/apache-arrow'}
  ]}
/>

<DocOrientation
  eyebrow="Four starting points"
  title="Use the example that matches your input."
  description="Arrow JS can consume IPC bytes, build tables from typed arrays, or iterate through a response. The resulting table and record-batch APIs are the same."
  tone="cyan"
  items={[
    {label: 'On disk', value: 'Read a complete IPC file'},
    {label: 'Split buffers', value: 'Combine schema and record buffers'},
    {label: 'In memory', value: 'Create columns from JavaScript arrays'},
    {label: 'Over HTTP', value: 'Fetch and iterate through record batches'}
  ]}
/>

<ReferenceBoundary
  title="Example details"
  description="The snippets below are intentionally small. Follow the linked guides when you need schemas, writers, builders, workers, or loaders.gl integration."
  tone="cyan"
/>

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
