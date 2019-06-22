# RFC: loader auto detection in loaders.gl

# RFC: Loaders Sub-Module

- **Authors**: Ib Green
- **Date**: Jun 2019
- **Status**: Draft

## Summary

This RFC proposes improved ways for loaders.gl to auto-detect formats.


## Problem

Successful auto detection of loaders depends on multiple contextual pieces of information being available to the load or parse function.

- URL Extension
- MIME Type
- Content Sniffing

## Enhanced Type Detection

When autoselecting a loader, the `load` and `parse` functions should be supplied with contextual information.

- The standard fetch `Response` object allows `headers` and `url` to be queried.
- Loaders.gl provides fetch response objects for `File` and `Blob` objects, providing a uniform interface to such classes.

- But for raw arrayBuffers, strings and asyncIterators, the url, MIME type or type needs to be supplied.

### Proposal 1a: Add more fields to options

Allow the

```js
import {parse, Response} from '@loaders.gl/core';
const data = await parse(arrayBuffer, {url, mimeType}));
```


### Proposal 1b: Provide a mock Response class for annotating a file:

```js
import {parse, Response} from '@loaders.gl/core';
const data = await parse(new Response({arrayBuffer, url, mimeType}));
```

An issue could be if we wanted to override the headers and or url of an actual `Response` object.


### MIME types

- HTTP Response Headers and Files/Blobs can contain MIME types, and these could be used to help select the appropriate loader.

### Proposal: Binary type sniffing

- Many binary formats start with a few magic bytes, simply having code that checks for these.

The `test` field of the loader can be set to a string, which is then assume to be a magic string that must be equal to the first bytes in the file.


A complication is streaming, where we need a mechanism to peek into the first array buffer chunk of the stream and then put it back. A custom async iterator wrapper could handle this.

```js
async function*(asyncIterator) {
  const {firstChunk, done} = await asyncIterator.next();
  if (!done) {
    yield firstChunk;
    yielf firstChunk;
  }
  yield *asyncIterator;
}
```

