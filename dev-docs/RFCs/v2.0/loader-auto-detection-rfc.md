# RFC: loader auto detection in loaders.gl

# RFC: Loaders Sub-Module

- **Authors**: Ib Green
- **Date**: Jun 2019
- **Status**: Draft

## Abstract

This RFC proposes improved ways for loaders.gl to auto-detect formats.

## Problem

Successful auto detection of loaders depends on multiple contextual pieces of information being available to the load or parse function.

- URL Extension
- MIME Type
- Content Sniffing

## Enhanced Type Detection

When autoselecting a loader, the `parse` (and sometimes `load`) functions should be supplied with contextual information.

Depending on how `parse` is called, contextual information may be available:

- The standard `fetch` `Response` object allows `url` and `headers` (in which MIME type might be present) to be queried.
- The loaders.gl `fetchFile` function returns `fetch` `Response` objects for `File` and `Blob` objects, providing a uniform interface to such classes.

However, when `parse*()` is called with raw arrayBuffers, strings and asyncIterators, the url and/or MIME type may need to be supplied.

### Proposal 1a: Add type fields to options object

Allow the app to pass in `url` and `mimeType`

```js
import {parse, Response} from '@loaders.gl/core';
const data = await parse(arrayBuffer, {url, mimeType}));
```

### Proposal 1b: Use (a mock) Response class for annotating a file:

```js
import {parse, Response} from '@loaders.gl/core';
const data = await parse(new Response({arrayBuffer, url, mimeType}));
```

If we wanted to override the headers and or url of an actual `Response` object, we may need a way to clone and modify.

### Proposal: Binary type sniffing on ArrayBuffers and Strings (Implemented)

- Many binary formats start with a few magic bytes, simply having code that checks for these.

The `test` field of the loader can be set to a string, which is then assume to be a magic string that must be equal to the first bytes in the file.

### Proposal: Binary type sniffing on AsyncIterators

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

### Proposal: Use MIME types to help guide loader selection

- HTTP Response Headers and Files/Blobs can contain MIME types, and these could be used to help select the appropriate loader.

### Proposal: Weigh multiple signals when categorizing file

URL, binary sniffing, MIME type...
