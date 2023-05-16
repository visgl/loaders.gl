# selectLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v2.2-blue.svg?style=flat-square" alt="From-v2.2" /> 
</p>

The `selectLoader()` and `selectLoaderSync()` functions will automatically select
an appropriate loader for a specific resource. `selectLoader()` is called by the
`parse()` and `load()` functions, but can also be called directly from applications.

Loader selection heuristics are based on:

- Filename (or url) extensions
- MIME types (from `Response` `content-type` headers or `Blob.type`/`File.type` fields)
- Initial bytes - for certain inputs, the initial bytes in the supplied data can be compared against known "magic bytes" for various file formats.

**loader registry** - `selectLoader()` and `selectLoaderSync()` are also aware of the
[loader registry](/docs/modules/core/api-reference/register-loaders).
The list of pre-registered loaders will be included in the search for a compatible loader,
unless `options.ignoreRegisteredLoaders` is `true`.

## Usage

Select a loader from a list of provided loaders:

```js
import {selectLoaderSync} from '@loaders.gl/core';
import {ArrowLoader} from '@loaders.gl/arrow';
import {CSVLoader} from '@loaders.gl/csv';

selectLoaderSync('filename.csv', [ArrowLoader, CSVLoader]); // => CSVLoader
```

Select a loader from pre-registered loaders in the loader registry:

```js
import {registerLoaders, selectLoader} from '@loaders.gl/core';
import {ArrowLoader} from '@loaders.gl/arrow';
import {CSVLoader} from '@loaders.gl/csv';

registerLoaders(ArrowLoader, CSVLoader);

await selectLoader('filename.csv'); // => CSVLoader
```

Select a loader by specifying MIME type (using unregistered MIME types, see below)

```js
const data = new Blob([string], {type: 'application/x.csv'});
await selectLoader(blob); // => CSVLoader
```

The async `selectLoader` function can identify loaders without extension and mimeType
by content sniffing `Blob` and `File` objects (useful when user drags and drops files into your application).

```js
const data = new Blob(['DRACO...'] /* Binary Draco files start with these characters */]);
await selectLoader(blob, DracoLoader); // => DracoLoader
```

## Functions

### `selectLoader(data: Response | ArrayBuffer | String | Blob, ..., loaders?: LoaderWithParser[], options?: object, context?: object): Promise<boolean>`

Selects an appropriate loader for a file from a list of candidate loaders by examining the `data` parameter, looking at URL extension, mimeType ('Content-Type') and/or an initial data chunk.

Parameters:

- `data` - data to perform autodetection against
- `loaders` - can be a single loader or an array of loaders, or null.
- `options` - See [`LoaderOptions`](./loader-options).
- `options.nothrow`=`false` - Return null instead of throwing exception if no loader can be found

Returns:

- A single loader (or `null` if `options.nothrow` was set and no matching loader was found).

Throws:

- If no matching loader was found, and `options.nothrow` was not set.

Regarding the `loaders` parameter:

- A single loader object will be returned without matching.
- a `null` loader list will use the pre-registered list of loaders.
- A supplied list of loaders will be searched for a matching loader.

### `selectLoaderSync(data: Response | ArrayBuffer | String | Blob, ..., loaders?: LoaderWithParser[], options?: object, context?: object): boolean`

## Supported Formats

- strings / non-data urls:
- strings / data urls: The mime type will be extracted from the data url prologue (if available)
- fetch `Response` objects: `url` and `headers.get('Content-Type')` fields will be used.
- `File` and `Blob` objects:

Peeking into batched input sources is not supported directly by `selectLoader`:

- `Response`: Avoids requesting initial data to make sure the response body is not marked as used.
- `Stream`: It is not possible to non-destructively peek into a stream.
- `Iterator/AsyncIterator`: it is not possible to peek into an iterator.

Instead use helpers to get access to initialContents and pass it in separately.

## MIME types

If the standard MIME types for each format are not precise enough, loaders.gl also supports [unregistered](https://en.wikipedia.org/wiki/Media_type#Unregistered_tree) MIME types. Each loader will match the `application/x.<id>` where the `<id>` is the documented `id` of the loader, e.g. `application/x.ply`/`application/x.draco`/etc ...

## Remarks

- File extensions - An attempt will be made to extract a file extension by stripping away query parameters and base path before matching against known loader extensions.
- Stream autodetection - Currently not well supported.
