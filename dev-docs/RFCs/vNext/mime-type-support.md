# RFC: MIME type support in loaders.gl

- **Authors**: Ib Green
- **Date**: Jun 2019
- **Status**: Draft

## Abstract

This RFC proposes improved ways for loaders.gl to use MIME types, primarily to auto-detect formats and auto-select loaders.

## Problem

Successful auto detection of loaders depends on multiple contextual pieces of information being available to the load or parse function.

- URL Extension
- Content Sniffing

MIME Types are often available as part of e.g. content-type headers in the `fetch` `Response` object, so why not use them

## Enhanced Type Detection

When autoselecting a loader, the `parse` (and sometimes `load`) functions should be supplied with contextual information.

Depending on how `parse` is called, contextual information may be available:

- The standard `fetch` `Response` object allows `url` and `headers` (in which MIME type might be present) to be queried.
- The loaders.gl `fetchFile` function returns `fetch` `Response` objects for `File` and `Blob` objects, providing a uniform interface to such classes.

However, when `parse*()` is called with raw arrayBuffers, strings and asyncIterators, the url and/or MIME type may need to be supplied by the app.

### Proposal: Add mimeType fields to options object

Allow the app to pass in `url` and `mimeType`

```js
import {parse, Response} from '@loaders.gl/core';
const data = await parse(arrayBuffer, {url, mimeType}));
```

### Proposal: Use (a mock) Response class for annotating a file:

```js
import {parse, Response} from '@loaders.gl/core';
const data = await parse(new Response({arrayBuffer, url, mimeType}));
```

If we wanted to override the headers and or url of an actual `Response` object, we may need a way to clone and modify.

### Proposal: Use MIME types to help guide loader selection

- HTTP Response Headers and Files/Blobs can contain MIME types, and these could be used to help select the appropriate loader.

### Proposal: Weigh multiple signals when categorizing file

URL, binary sniffing, MIME type...
