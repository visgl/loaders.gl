# ArrowLoader

> The Arrow loaders are still under development. If you are interested in early access, please open an issue.

The `ArrowLoader` parses the Apache Arrow columnar table format.


| Loader                | Characteristic  |
| --------------------- | --------------- |
| File Extension        | `.arrow`        |
| File Type             | Binary          |
| Input Format          | [IPC: Encapsulated Message Format](http://arrow.apache.org/docs/ipc.html) |
| Output Format         | [Columnar Table](/docs/specifications/category-table) |
| Decoder Type          | Synchronous     |
| Worker Thread Support | Yes             |
| Streaming Support     | Yes             |

## Usage

```js
import {ArrowLoader, ArrowWorkerLoader} from '@loaders.gl/arrow';
import {load} from '@loaders.gl/core';

// Decode on main thread
const data = await load(url, ArrowLoader, options);
// Decode on worker thread
const data = await load(url, ArrowWorkerLoader, options);
```

## Options

| Option        | Type      | Default     | Description       |
| ------------- | --------- | ----------- | ----------------- |
