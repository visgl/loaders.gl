# LanceSourceLoader

<p class="badges">
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
