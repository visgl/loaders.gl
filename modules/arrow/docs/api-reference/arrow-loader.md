# ArrowLoader

> The Arrow loaders are still under development.

The `ArrowLoader` parses the Apache Arrow columnar table format.

| Loader                | Characteristic                                                            |
| --------------------- | ------------------------------------------------------------------------- |
| File Format           | [IPC: Encapsulated Message Format](http://arrow.apache.org/docs/ipc.html) |
| File Extension        | `.arrow`                                                                  |
| File Type             | Binary                                                                    |
| Data Format           | [Columnar Table](/docs/specifications/category-table)                     |
| Decoder Type          | `load`, `parse`, `parseSync`, `parseInBatches`                            |
| Worker Thread Support | Yes                                                                       |
| Streaming Support     | Yes                                                                       |

## Usage

```js
import {ArrowLoader} from '@loaders.gl/arrow';
import {load} from '@loaders.gl/core';

const data = await load(url, ArrowLoader, options);
```

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
