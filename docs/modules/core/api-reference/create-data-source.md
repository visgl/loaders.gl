 # createDataSource 🚧

 This function creates a `DataSource` for an 
 (i.e. parses the entire data set in one operation). It can be called on "already loaded" data such as `ArrayBuffer` and `string` objects.

In contrast to `load` and `parse` which parse a single file, the returned `DataSource` is a a class instance that offers an API for querying additional data (such as tiles from a tile server).

## Usage

The return value from `fetch` or `fetchFile` is a `Promise` that resolves to the fetch `Response` object and can be passed directly to the non-sync parser functions:

```typescript
import {createDataSource, parse} from '@loaders.gl/core';
import {OBJLoader} from '@loaders.gl/obj';

const source = await createDataSource(url, OBJLoader);
// Application code here
...
```

Selection is supported.

```typescript
import {fetchFile, parseInBatches} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/obj';

const batchIterator = await createDataSource(url, CSVLoader);
for await (const batch of batchIterator) {
  console.log(batch.length);
}
```

Handling errors

```typescript
try {
  const response = await fetch(url); // fetch can throw in case of network errors
  const data = await parse(response); // parse will throw if server reports an error
} catch (error) {
  console.log(error);
}
```

## Functions

### createDataSource(data: String | Blob, sources: Source\[], options?: Object) : Promise\<DataSource\>

Parses data asynchronously either using the provided source or sources, or using the pre-registered sources (see `register-sources`).

- `data`: loaded data or an object that allows data to be loaded. This parameter can be any of the following types:
  - `String` - Parse from text data in a string. (Only works for sources that support textual input).
  - `File` - A browser file object (from drag-and-drop or file selection operations).

- `sources` - can be a single source or an array of sources. If single source is provided, will force to use it. If ommitted, will use the list of pre-registered sources (see `registerLoaders`)

- `data`: loaded data or an object that allows data to be loaded. See table below for valid input types for this parameter.
- `sources` - can be a single source or an array of sources. If ommitted, will use the list of pre-registered sources (see `registerLoaders`)
- `options`: See [`LoaderOptions`](./source-options).
- `url`: optional, assists in the autoselection of a source if multiple sources are supplied to `source`.

Returns:

- A valid data source or null.

Notes:

### createDataSourceSync(data: String | Blob, sources: Source\[], options?: Object) : Promise\<Any\>



