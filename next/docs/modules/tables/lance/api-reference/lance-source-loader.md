Lance API / source

# Treat a Lance dataset as a readable source.

LanceSourceLoader makes dataset metadata, fragments, data-file descriptions, and selected Arrow batches available through one source lifecycle. It supports local and remote datasets while keeping unsupported encodings visible.

[Lance module](https://loaders.gl/next/docs/modules/tables/lance.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/lance.md)[Arrow readers](https://loaders.gl/next/docs/modules/tables/lance/api-reference/lance-arrow.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/lance/api-reference/lance-arrow.md)[Using sources](https://loaders.gl/next/docs/developer-guide/using-sources.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-sources.md)

Dataset source path

## Inspect the dataset before reading its batches.

The source separates manifest discovery from data-file reads. Applications can understand the dataset shape, select supported columns, and then iterate over bounded Arrow batches.

01

Open

Resolve a Lance dataset URL and load its manifest.

02

Inspect

Read schema, fragments, and data-file metadata.

03

Select

Choose supported column types, names, and limits.

04

Iterate

Read decoded Arrow batches through the source contract.

Detailed guide

## LanceSourceLoader reference

The detailed reference covers creation, source metadata, read options, batch iteration, remote access, and the current Work In Progress boundary.

![Status: Work-In-Progress](https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square)

`LanceSourceLoader` opens a Lance dataset URL and exposes its manifest schema, fragments, data-file metadata, and read-only Arrow batches.

```
import {LanceSourceLoader} from '@loaders.gl/tables/lance';



const source = LanceSourceLoader.createDataSource(datasetURL, {

  lance: {

    version: 3,

    columnTypes: ['double', 'int64'],

    columnNames: ['score', 'id'],

    limit: 100

  }

});



const metadata = await source.getMetadata();

for await (const batch of source.readBatches()) {

  console.log(batch.data);

}
```

This API is Work In Progress. Column types must currently be supplied explicitly, and only the supported fixed-width primitive subset can be read.
