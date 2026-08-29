---
title: selectLoader
description: Choose a compatible loader from extensions, MIME types, and content signatures.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Core module · loader selection"
  title="selectLoader"
  description="Select a loader for a resource using its URL, MIME type, or initial bytes, with support for explicit candidates and the registered loader list."
  tone="blue"
  meta={['Extension matching', 'MIME types', 'Content sniffing']}
  links={[
    {label: 'Core module', to: '/docs/modules/core'},
    {label: 'Register loaders', to: '/docs/modules/core/api-reference/register-loaders'},
    {label: 'LoaderOptions', to: '/docs/modules/core/api-reference/loader-options'}
  ]}
/>

<DocOrientation
  eyebrow="How selection works"
  title="Give applications a loader without hard-coding every format."
  description="Selection uses the signals available for the input: filename, MIME type, and—when safe—initial content bytes. Applications can still provide an explicit loader list or a single known loader."
  tone="blue"
  items={[
    {label: 'URL', value: 'File extension and resource name'},
    {label: 'MIME', value: 'Response or Blob content type'},
    {label: 'Bytes', value: 'Magic-byte and signature detection'},
    {label: 'Registry', value: 'Pre-registered loaders when requested'}
  ]}
/>

<ReferenceBoundary
  title="selectLoader reference"
  description="The sections below document selection functions, supported input forms, candidate lists, registry behavior, and error handling."
  tone="blue"
/>

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

```typescript
import {selectLoaderSync} from '@loaders.gl/core';
import {ArrowLoader} from '@loaders.gl/arrow';
import {CSVLoader} from '@loaders.gl/csv';

selectLoaderSync('filename.csv', [ArrowLoader, CSVLoader]); // => CSVLoader
```

Select a loader from pre-registered loaders in the loader registry:

```typescript
import {registerLoaders, selectLoader} from '@loaders.gl/core';
import {ArrowLoader} from '@loaders.gl/arrow';
import {CSVLoader} from '@loaders.gl/csv';

registerLoaders(ArrowLoader, CSVLoader);

await selectLoader('filename.csv'); // => CSVLoader
```

Select a loader by specifying MIME type (using unregistered MIME types, see below)

```typescript
const data = new Blob([string], {type: 'application/x.csv'});
await selectLoader(blob); // => CSVLoader
```

The async `selectLoader` function can identify loaders without extension and mimeType
by content sniffing `Blob` and `File` objects (useful when user drags and drops files into your application).

```typescript
const data = new Blob(['DRACO...'] /* Binary Draco files start with these characters */]);
await selectLoader(blob, DracoLoader); // => DracoLoader
```

## Functions

### `selectLoader(data: Response | ArrayBuffer | String | Blob, ..., loaders?: LoaderWithParser[], options?: object, context?: object): Promise<Loader>`

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

### `selectLoaderSync(data: Response | ArrayBuffer | String | Blob, ..., loaders?: LoaderWithParser[], options?: object, context?: object): Loader`

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
