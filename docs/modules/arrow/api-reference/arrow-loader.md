# ArrowLoader

![arrow-logo](../images/apache-arrow-small.png)

> The Arrow loaders are still under development.

The `ArrowLoader` parses the Apache Arrow columnar table format.

| Loader                | Characteristic                                                            |
| --------------------- | ------------------------------------------------------------------------- |
| File Format           | [IPC: Encapsulated Message Format](https://arrow.apache.org/docs/format/Columnar.html#serialization-and-interprocess-communication-ipc) |
| Data Format           | [Columnar Table](/docs/specifications/category-table)                     |
| File Extension        | `.arrow`                                                                  |
| File Type             | Binary                                                                    |
| Decoder Type          | `load`, `parse`, `parseSync`, `parseInBatches`                            |
| Worker Thread Support | Yes                                                                       |
| Streaming Support     | Yes                                                                       |

## Usage

```typescript
import {ArrowLoader} from '@loaders.gl/arrow';
import {load} from '@loaders.gl/core';

const data = await load(url, ArrowLoader, options);
```

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
