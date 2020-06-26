# loadInBatches

`loadInBatches` opens a `url` as a stream and passes it and options to `parseInBatches`. See the documentation of `load` and `parseInBatches` for more details.

Starting with [![Website shields.io](https://img.shields.io/badge/v2.3-blue.svg?style=flat-square)](http://shields.io), `loadInBatches` can also load and parse multiple files from a list of `File` objects or urls.

In this mode, it iterates over the supplied files, looking for valid loader matches, ignores files that do not match a loader and calls `parseInBatches` on each valid file/loader combination, returning an array of async batch iterators.

More importantly, when called with multiple files, `loadInBatches` makes all the supplied files avialable to all loaders (enabling multi-file loaders such as the ShapefileLoader to access multiple files).

### Usage

```js
const iteratorPromises = await loadInBatches([file1, file2], OBJLoader);
for await (const iterator of iteratorPromises) {
  for await (const batch of iterator) {
    // Just the one batch...
    t.equal(batch.mode, 4, 'mode is TRIANGLES (4)');
  }
}
```

```js
import {fetchFile, parseFilesInBatches} from '@loaders.gl/core';
import {ShapefileLoader} from '@loaders.gl/shapefile';

const batchIterators = await loadFilesInBatches([shpFile, dbfFile, projFile], ShapefileLoader));
for (const batchIterator of batchIterators) {
  // `batchIterator` represents the the output of `parseInBatches` on one of the files
  for await (const batch of batchIterator) {
    switch (batch.batchType) {
      case 'metadata':
        console.log(batch.metadata);
        break;
      default:
        processShapefile(batch);
    }
  }
}
```

### `loadInBatches(url: string | File | ... , loaders: object | object[], options?: object]): Promise<AsyncIrerator<any>>`

### `loadInBatches(files: (string | File | ...)[] | FileList, loaders: object | object[], options?: object]): Promise<AsyncIterator<any>>`

Loads data in batches from a stream, releasing each batch to the application while the stream is still being read.

Parses data with the selected _loader object_. An array of `loaders` can be provided, in which case an attempt will be made to autodetect which loader is appropriate for the file (using url extension and header matching).

- `files`: loaded data or an object that allows data to be loaded. Plese refer to the table below for valid types.
- `loaders` - can be a single loader or an array of loaders. If ommitted, will use the list of registered loaders (see `registerLoaders`)
- `options`: optional, options for the loader (see documentation of the specific loader).

Returns:

- Returns an async iterator that yields batches of data. The exact format for the batches depends on the _loader object_ category.

Notes:

- The `loaders` parameter can also be ommitted, in which case any _loaders_ previously registered with [`registerLoaders`](docs/api-reference/core/register-loaders) will be used.

## Options

A loader object, that can contain a mix of options:

- options specific to `loadInBatches`, see below.
- options defined by the `parseInBatches` and `parse` functions can be specified.
- options specific to any loaders can also be specified (in loader specific sub-objects).

Please refer to the corresponding documentation page for for `parse` and for each loader for details.

| Option                       | Type      | Default | Description                                           |
| ---------------------------- | --------- | ------- | ----------------------------------------------------- |
| `options.ignoreUnknownFiles` | `boolean` | `true`  | Ignores unknown files if multiple files are provided. |
