---
title: save and saveSync
description: Encode data with a writer and deliver the result through the loaders.gl core output path.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Core API / writing"
  title="Write data through the same boundary you use to load it."
  description="save() selects the input representation a writer expects, passes the data through the writer, and returns the encoded result. saveSync() provides the same path when both the input and writer support synchronous work."
  tone="mint"
  meta={['Writer-aware input', 'Async and sync paths', 'Path-prefix aware']}
  links={[
    {label: 'Core module', to: '/docs/modules/core'},
    {label: 'Using writers', to: '/docs/developer-guide/using-writers'},
    {label: 'Writer categories', to: '/docs/developer-guide/loader-categories'}
  ]}
/>

<DocOrientation
  eyebrow="Output path"
  title="Choose a writer. Let core handle the representation."
  description="Writers may prefer text, JSON, binary data, or another category shape. save() keeps that choice in the writer contract so application code does not need a separate transport branch for every format."
  tone="mint"
  items={[
    {label: 'Input', value: 'A URL, data URL, File, or synchronously readable path.'},
    {label: 'Writer', value: 'A writer or ordered list of candidate writers.'},
    {label: 'Encoding', value: 'Convert the supplied data into the writer’s preferred form.'},
    {label: 'Result', value: 'Return encoded text, bytes, or the writer-defined output.'}
  ]}
/>

<ReferenceBoundary
  title="save reference"
  description="The detailed reference covers save and saveSync signatures, input representations, writer options, path prefixes, and synchronous limitations."
  tone="mint"
/>

`save` and `saveSync` function can be used with any writer. `save` takes a `url` and a writer object, checks what type of data that writer prefers to work on (e.g. text, JSON, binary, stream, ...), saves the data in the appropriate way, and passes it to the writer.

## Functions

### save(url : String | File, writer : Object [, options : Object]) : Promise.ArrayBuffer| Promi

se.String

The `save` function can be used with any writer.

`save` takes a `url` and a writer object, checks what type of data that writer prefers to work on (e.g. text, JSON, binary, stream, ...), saves the data in the appropriate way, and passes it to the writer.

- `url` - Can be a string, either a data url or a request url, or in Node.js, a file name, or in the browser, a File object.
- `data` - saveed data, either in binary or text format.
- `writer` - can be a single writer or an array of writers.
- `options` - optional, contains both options for the read process and options for the writer (see documentation of the specific writer).
- `options.dataType`=`arraybuffer` - By default reads as binary. Set to 'text' to read as text.

Returns:

- Return value depends on the category

Notes:

- Any path prefix set by `setPathPrefix` will be appended to relative urls.

### saveSync(url : String [, options : Object]) : ArrayBuffer | String

Similar to `save` except saves and parses data synchronously.

Note that for `saveSync` to work, the `url` needs to be saveable synchronously _and_ the writer used must support synchronous parsing. Synchronous saveing only works on data URLs or files in Node.js. In many cases, the asynchronous `save` is more appropriate.
