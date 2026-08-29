---
title: LanceSourceLoader
description: Open a Lance dataset, inspect its manifest and fragments, and read supported columns as Arrow batches.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Lance API / source"
  title="Treat a Lance dataset as a readable source."
  description="LanceSourceLoader makes dataset metadata, fragments, data-file descriptions, and selected Arrow batches available through one source lifecycle. It supports local and remote datasets while keeping unsupported encodings visible."
  tone="mint"
  meta={['Manifest and fragments', 'Arrow batches', 'Read-only source']}
  links={[
    {label: 'Lance module', to: '/docs/modules/lance'},
    {label: 'Arrow readers', to: '/docs/modules/lance/api-reference/lance-arrow'},
    {label: 'Using sources', to: '/docs/developer-guide/using-sources'}
  ]}
/>

<DocOrientation
  eyebrow="Dataset source path"
  title="Inspect the dataset before reading its batches."
  description="The source separates manifest discovery from data-file reads. Applications can understand the dataset shape, select supported columns, and then iterate over bounded Arrow batches."
  tone="mint"
  items={[
    {label: 'Open', value: 'Resolve a Lance dataset URL and load its manifest.'},
    {label: 'Inspect', value: 'Read schema, fragments, and data-file metadata.'},
    {label: 'Select', value: 'Choose supported column types, names, and limits.'},
    {label: 'Iterate', value: 'Read decoded Arrow batches through the source contract.'}
  ]}
/>

<ReferenceBoundary
  title="LanceSourceLoader reference"
  description="The detailed reference covers creation, source metadata, read options, batch iteration, remote access, and the current Work In Progress boundary."
  tone="mint"
/>

<p className="badges">
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

`LanceSourceLoader` opens a Lance dataset URL and exposes its manifest schema,
fragments, data-file metadata, and read-only Arrow batches.

```ts
import {LanceSourceLoader} from '@loaders.gl/lance';

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

This API is Work In Progress. Column types must currently be supplied
explicitly, and only the supported fixed-width primitive subset can be read.
