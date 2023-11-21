# GeoArrowLoader

![arrow-logo](../images/apache-arrow-small.png)

The `GeoArrowLoader` parses Apache Arrow columnar table format files, and looks for `GeoArrow` type extensions to parse geometries from the table.

| Loader                | Characteristic                                                            |
| --------------------- | ------------------------------------------------------------------------- |
| File Format           | [IPC: Encapsulated Message Format](https://arrow.apache.org/docs/format/Columnar.html#serialization-and-interprocess-communication-ipc) |
| Data Format           | [Geometry Table](/docs/specifications/category-table)                     |
| File Extension        | `.arrow`                                                                  |
| File Type             | Binary                                                                    |
| Decoder Type          | `load`, `parse`, `parseSync`, `parseInBatches`                            |
| Worker Thread Support | Yes                                                                       |
| Streaming Support     | Yes                                                                       |

## Usage

```typescript
import {GeoArrowLoader} from '@loaders.gl/arrow';
import {load} from '@loaders.gl/core';

const data = await load(url, GeoArrowLoader, options);
```

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
