Core module · loader selection

# selectLoader

Select a loader for a resource using its URL, MIME type, or initial bytes, with support for explicit candidates and the registered loader list.

[Core module](https://loaders.gl/next/docs/modules/core.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core.md)[Register loaders](https://loaders.gl/next/docs/modules/core/api-reference/register-loaders.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/api-reference/register-loaders.md)[LoaderOptions](https://loaders.gl/next/docs/modules/core/api-reference/loader-options.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/api-reference/loader-options.md)

How selection works

## Give applications a loader without hard-coding every format.

Selection uses the signals available for the input: filename, MIME type, and—when safe—initial content bytes. Applications can still provide an explicit loader list or a single known loader.

01

URL

File extension and resource name

02

MIME

Response or Blob content type

03

Bytes

Magic-byte and signature detection

04

Registry

Pre-registered loaders when requested

Detailed guide

## selectLoader reference

The sections below document selection functions, supported input forms, candidate lists, registry behavior, and error handling.

The `selectLoader()` and `selectLoaderSync()` functions will automatically select an appropriate loader for a specific resource. `selectLoader()` is called by the `parse()` and `load()` functions, but can also be called directly from applications.

Loader selection heuristics are based on:

* Filename (or url) extensions
* MIME types (from `Response` `content-type` headers or `Blob.type`/`File.type` fields)
* Initial bytes - for certain inputs, the initial bytes in the supplied data can be compared against known "magic bytes" for various file formats.

**loader registry** - `selectLoader()` and `selectLoaderSync()` are also aware of the [loader registry](https://loaders.gl/next/docs/modules/core/api-reference/register-loaders.md). The list of pre-registered loaders will be included in the search for a compatible loader, unless `options.core.ignoreRegisteredLoaders` is `true`.

## Usage[​](#usage "Direct link to Usage")

Select a loader from a list of provided loaders:

```
import {selectLoaderSync} from '@loaders.gl/core';

import {ArrowLoader} from '@loaders.gl/tables/arrow';

import {CSVLoader} from '@loaders.gl/tables/csv';



selectLoaderSync('filename.csv', [ArrowLoader, CSVLoader]); // => CSVLoader
```

Select a loader from pre-registered loaders in the loader registry:

```
import {registerLoaders, selectLoader} from '@loaders.gl/core';

import {ArrowLoader} from '@loaders.gl/tables/arrow';

import {CSVLoader} from '@loaders.gl/tables/csv';



registerLoaders([ArrowLoader, CSVLoader]);



await selectLoader('filename.csv'); // => CSVLoader
```

Select a loader by specifying MIME type (using unregistered MIME types, see below)

```
const blob = new Blob([csvText], {type: 'application/x.csv'});

await selectLoader(blob, [CSVLoader]); // => CSVLoader
```

The async `selectLoader` function can identify loaders without extension and mimeType by content sniffing `Blob` and `File` objects (useful when user drags and drops files into your application).

```
import {DracoLoader} from '@loaders.gl/draco';



const blob = new Blob(['DRACO...']); // Illustrative magic-byte prefix

await selectLoader(blob, [DracoLoader]); // => DracoLoader
```

## Functions[​](#functions "Direct link to Functions")

### `selectLoader(data: Response | ArrayBuffer | String | Blob, ..., loaders?: LoaderWithParser[], options?: object, context?: object): Promise<Loader>`[​](#selectloaderdata-response--arraybuffer--string--blob--loaders-loaderwithparser-options-object-context-object-promiseloader "Direct link to selectloaderdata-response--arraybuffer--string--blob--loaders-loaderwithparser-options-object-context-object-promiseloader")

Selects an appropriate loader for a file from a list of candidate loaders by examining the `data` parameter, looking at URL extension, mimeType ('Content-Type') and/or an initial data chunk.

Parameters:

* `data` - data to perform autodetection against
* `loaders` - can be a single loader or an array of loaders, or null.
* `options` - See [`LoaderOptions`](https://loaders.gl/next/docs/modules/core/api-reference/loader-options.md).
* `options.core.nothrow`=`false` - Return null instead of throwing exception if no loader can be found

Returns:

* A single loader (or `null` if `options.core.nothrow` was set and no matching loader was found).

Throws:

* If no matching loader was found, and `options.core.nothrow` was not set.

Regarding the `loaders` parameter:

* A single loader object will be returned without matching.
* a `null` loader list will use the pre-registered list of loaders.
* A supplied list of loaders will be searched for a matching loader.

### `selectLoaderSync(data: Response | ArrayBuffer | String | Blob, ..., loaders?: LoaderWithParser[], options?: object, context?: object): Loader`[​](#selectloadersyncdata-response--arraybuffer--string--blob--loaders-loaderwithparser-options-object-context-object-loader "Direct link to selectloadersyncdata-response--arraybuffer--string--blob--loaders-loaderwithparser-options-object-context-object-loader")

## Supported Formats[​](#supported-formats "Direct link to Supported Formats")

* strings / non-data urls:
* strings / data urls: The mime type will be extracted from the data url prologue (if available)
* fetch `Response` objects: `url` and `headers.get('Content-Type')` fields will be used.
* `File` and `Blob` objects:

Peeking into batched input sources is not supported directly by `selectLoader`:

* `Response`: Avoids requesting initial data to make sure the response body is not marked as used.
* `Stream`: It is not possible to non-destructively peek into a stream.
* `Iterator/AsyncIterator`: it is not possible to peek into an iterator.

Instead use helpers to get access to initialContents and pass it in separately.

## MIME types[​](#mime-types "Direct link to MIME types")

If the standard MIME types for each format are not precise enough, loaders.gl also supports [unregistered](https://en.wikipedia.org/wiki/Media_type#Unregistered_tree) MIME types. Each loader will match the `application/x.<id>` where the `<id>` is the documented `id` of the loader, e.g. `application/x.ply`/`application/x.draco`/etc ...

## Remarks[​](#remarks "Direct link to Remarks")

* File extensions - An attempt will be made to extract a file extension by stripping away query parameters and base path before matching against known loader extensions.
* Stream autodetection - Currently not well supported.
