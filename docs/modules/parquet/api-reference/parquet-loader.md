# ParquetLoader 🆕 🚧

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.1-blue.svg?style=flat-square" alt="From-v3.1" />
  &nbsp;
	<img src="https://img.shields.io/badge/-BETA-teal.svg" alt="BETA" />
</p>

Streaming loader for Apache Parquet encoded files.

| Loader         | Characteristic                                       |
| -------------- | ---------------------------------------------------- |
| File Format    | [Parquet](/docs/modules/parquet/formats/parquet)      |
| Data Format    | [Classic Table](/docs/specifications/category-table) |
| File Extension | `.parquet`,                                          |
| MIME Type      | N/A (`application/octet-stream`)                     |
| File Type      | Binary                                               |
| Supported APIs | `load`, `parse`, `parseInBatches`                    |

Please refer to the `parquet` format page for information on
which [Parquet format features](/docs/modules/parquet/formats/parquet) are supported.

## Usage

```typescript
import {ParquetLoader} from '@loaders.gl/parquet';
import {load} from '@loaders.gl/core';

const data = await load(url, ParquetLoader, {parquet: options});
```

The ParquetLoader supports streaming parsing, in which case it will yield "batches" of rows.

```typescript
import {ParquetLoader} from '@loaders.gl/parquet';
import {loadInBatches} from '@loaders.gl/core';

const batches = await loadInBatches('geo.parquet', ParquetLoader, {parquet: options}});

for await (const batch of batches) {
  // batch.data will contain a number of rows
  for (const feature of batch.data) {
    switch (feature.geometry.type) {
      case 'Polygon':
      ...
    }
  }
}
```

## Data Format

For details see [parquet documentation](https://parquet.apache.org/docs/).

## Options

Supports table category options such as `batchType` and `batchSize`.

| Option                 | From                                                                                  | Type       | Default                                                                                                                                          | Description                                                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |

