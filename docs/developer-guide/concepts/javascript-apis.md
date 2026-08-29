---
title: Preferred JavaScript APIs
description: Use portable browser and Node.js APIs for loading, writing, binary data, and images.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Developer guide · platform APIs"
  title="Use the platform boundary loaders.gl already understands."
  description="loaders.gl builds on a small set of browser-compatible APIs—fetch, ArrayBuffer, streams, Blob, and ImageBitmap—so the same loader code can run across modern browsers and Node.js."
  tone="blue"
  meta={['Browser and Node.js', 'fetch and ranges', 'ArrayBuffer and streams']}
  links={[
    {label: 'Get started', to: '/docs/developer-guide/get-started'},
    {label: 'Using sources', to: '/docs/developer-guide/using-sources'},
    {label: 'Polyfills', to: '/docs/modules/polyfills/api-reference'}
  ]}
/>

<DocOrientation
  eyebrow="The platform choices"
  title="Keep the boundary portable, then specialize inside it."
  description="Applications can still control requests and local files directly. loaders.gl provides adapters where browser and Node.js APIs differ, while keeping the loader-facing contracts stable."
  tone="blue"
  items={[
    {label: 'Network', value: 'fetch, Response, and HTTP range requests'},
    {label: 'Files', value: 'ReadableFile and WritableFile implementations'},
    {label: 'Binary', value: 'ArrayBuffer, typed arrays, Blob, and DataView'},
    {label: 'Images', value: 'ImageBitmap-first decoding with Node.js support'}
  ]}
/>

<ReferenceBoundary
  title="Platform API details"
  description="The sections below cover fetch, local files, validated ranges, saving data, binary memory, image APIs, and runtime-specific polyfills."
  tone="blue"
/>

loaders.gl supports input and output of data from JavaScript/TypeScript programs. To do this it is necessary to use platform APIs for

- loading data from files and URLs
- writing data to files
- manipulating binary data
- parsing images
- etc

Over the years, a number of different JavaScript APIs have emerged. Depending on the version of JavaScript supported by a browser or the version of Node.js being used. In addition, the set of available APIs move

## Loading data with `fetch()`

loaders.gl standardizes on the `fetch()` API. The result of a `fetch` operation is a `Response` object which can be passed to many loaders.gl functions, meaning that the application can call `fetch()` itself to fully control the requests.

:::info
The `fetch()` API emerged in browsers, but is now also supported natively on Node, starting with Node.js v18.
For older Node.js versions, `@loaders.gl/polyfills` installs polyfills of `fetch`, `Response` and `Headers` classes.
:::

## Local file access

loaders.gl offers a `FileSystem`, `ReadableFile` and `WritableFile` interfaces, and various implementations of these.

For local file access in the browser, the `File` class (a derivate of `Blob`, see below) is the tool of choice.
It is not clear if a counterpart to the `File` class will eventually be supported by Node.js.

> Note that reading local files in the browser has limitations. Actual file paths are obscured and files can only be created as a result of an interactive file selection or file drop action by the user.

The preferred way to provide random-access data to loaders.gl is through `ReadableFile` implementations:

- `HttpFile` reads from URLs and issues HTTP range requests when the server supports them.
- `ArrayBufferFile` provides direct random access to an in-memory `ArrayBuffer` without a `Blob` conversion.
- `BlobFile` wraps browser `Blob` and `File` instances and exposes efficient slicing.
- `NodeFile` provides safe, tree-shakeable access to local files under Node.js without importing `fs` in application code.
- `DataViewReadableFile` adapts in-memory buffers (such as data returned by `fetch`) to the same interface.

`ReadableFile` classes replace the deprecated `FileProvider` utilities; new code should use the `ReadableFile` wrappers exported from `@loaders.gl/loader-utils` (and `DataViewReadableFile` from `@loaders.gl/zip`) to keep loader interactions consistent across platforms.

### Validated HTTP ranges

`HttpFile.open()` pins the remote object's byte length and available `ETag`/`Last-Modified`
validators. Supplying identity from a trusted manifest avoids the opening one-byte probe:

```ts
import {HttpFile} from '@loaders.gl/loader-utils';

const file = await HttpFile.open('https://example.com/data.parquet', {
  byteLength: manifest.byteLength,
  etag: manifest.etag,
  consistency: 'strict'
});

const bytes = await file.read(offset, length, abortController.signal);
console.log(file.getIdentitySnapshot(), file.getTelemetry());
```

Every read requires an exact `206` response and validates `Content-Range`, response length, and the
pinned object identity before returning bytes. `strict` consistency requires validators to remain
visible; the default `best-effort` mode still rejects changed validators but permits servers whose
CORS policy does not expose them. A shared `RangeRequestScheduler` can coalesce nearby reads while
keeping different authentication and validator contexts isolated.

## Saving data

Saving data from a browser is either done by POST requests to a server, or via local downloads.

## Binary data APIs

The choice of binary data API in JavaScript usually comes down to either using Node.js `Buffer` class or a combination of `ArrayBuffer`, `TextEncoder`/`TextDecoder` classes.

The `Buffer` class in Node.js is not supported by browsers. Polyfills are available, but they can add considerable size (~50KB) to an application, and can cause small but frustrating bundling issues.

:::caution
Therefore loaders.gl tries to avoid use of the `Buffer` class in its core libraries and loaders, preferring to use `ArrayBuffer`, typed arrays and `Blob`s.
:::

The `Blob` (and `File`) classes in the browser have some unique advantages. They leverage an efficient blob storage mechanism in the browser, and they also enable partial, random-access reads from large blobs in that storage or from local files. `Blob`s are available in Node starting with Node.js v18. For lower versions, a polyfill will be installed by `@laoders.gl/polyfills`.

## Image APIs

The preferred image platform API is `ImageBitmap`.

In browsers, loaders.gl uses the native `ImageBitmap` API when available. Under Node.js, importing `@loaders.gl/polyfills` installs a minimal `ImageBitmap` polyfill together with a global `getImageBitmapData(image)` helper so that `@loaders.gl/images` can keep using the same bitmap-oriented contract.

This Node.js polyfill is intentionally limited. It is sufficient for loaders.gl image loading and `getImageBitmapData(image)`, but it does not provide a full browser-equivalent `createImageBitmap()` implementation.
