Core fetch API

# Give the same parsing pipeline a URL or a local file.

`fetchFile` wraps the platform fetch API and adds loaders.gl path-prefix, alias, and Node.js local-file support. It returns a standard `Response`, so the result can flow directly into `parse`.

[Core module](https://loaders.gl/next/docs/modules/core.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core.md)[Parse API](https://loaders.gl/next/docs/modules/core/api-reference/parse.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/api-reference/parse.md)[Path prefix](https://loaders.gl/next/docs/modules/core/api-reference/set-path-prefix.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/api-reference/set-path-prefix.md)

The fetch boundary

## Resolve the input. Return a familiar response.

Remote URLs use the platform fetch path; Node.js paths can resolve through the local filesystem. Downstream code still consumes standard response methods such as \`arrayBuffer\`, \`text\`, and \`json\`.

01

Input

Remote URL, data URL, Blob, or Node.js path

02

Resolve

Platform fetch, path prefix, and test aliases

03

Return

A Response-compatible object

04

Next step

Pass the response to \`parse\` or read it directly

The `fetchFile()` function is an alternative to the built-in [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/fetch) function. `fetchFile` provides additional functionality to support Node.js and testing use cases:

* load from local file system under Node.js
* path prefix resolution
* alias resolution

Detailed guide

## Fetch and response details

The reference below covers remote and local inputs, response methods, Node.js behavior, path prefixes, aliases, and request options.

```
fetchFile(url: string | Blob, options?: RequestInit) : Promise<Response>
```

A wrapper around the platform function with some additions:

Returns:

* A promise that resolves into a fetch [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response) object

  <!-- -->

  * `headers`: `Headers` - A [`Headers`](https://developer.mozilla.org/en-US/docs/Web/API/Headers) object.
  * `arrayBuffer()`: `Promise<ArrayBuffer>` - Loads the file as an `ArrayBuffer`.
  * `text()`: `Promise<string>` - Loads the file and decodes it into text.
  * `json()`: `Promise<unknown>` - Loads the file and parses its JSON contents.
  * `body` : `ReadableStream` - A stream that can be used to incrementally read the contents of the file.

info

Use of `fetchFile` is optional. loaders.gl `parse()` function can be used with data loaded via any mechanism the application prefers, e.g. directly using `fetch`, `XMLHttpRequest` etc.

## Node.js local file system support[​](#nodejs-local-file-system-support "Direct link to Node.js local file system support")

![From-v4.0](https://img.shields.io/badge/From-v4.0-blue.svg?style=flat-square)

Local file paths require the filesystem adapter installed by importing `@loaders.gl/core/polyfills`. HTTP(S) and data URLs use the runtime fetch API.

`fetchFile` will delegate any url that starts with `http://` `https://` or `data:` to the built-in `fetch` function. Other URLs will be interpreted as local files.

## Path prefix resolution[​](#path-prefix-resolution "Direct link to Path prefix resolution")

`fetchFile()` injects any prefix set by the `setPathPrefix()` API. Note that the path prefix mechanism is mainly intended to help small example applications to load data from the right place. It is not intended to support general application use cases, so use sparingly.

## Alias resolution[​](#alias-resolution "Direct link to Alias resolution")

`fetchFile()` also resolves any aliases set by the `_addAliases` function. This internal functionality is mainly intended for and used by loaders.gl own test cases, to allow paths to test data file to be specified in terms of which loaders.gl module they are located in.

## Usage[​](#usage "Direct link to Usage")

Use the `fetchFile` function as follows:

```
import {fetchFile} from '@loaders.gl/core';



// The optional second argument accepts standard fetch RequestInit options.

const response = await fetchFile(url, {headers: {}});



// Now use standard browser Response APIs



// Note: headers are case-insensitive

const contentLength = response.headers.get('content-length');

const mimeType = response.headers.get('content-type');



const arrayBuffer = await response.arrayBuffer();
```

The `Response` object from `fetchFile` is usually passed to `parse` as follows:

```
import {fetchFile, parse} from '@loaders.gl/core';

import {OBJLoader} from '@loaders.gl/scene/obj';



const data = await parse(fetchFile(url), OBJLoader);
```

Note that if you don't need the extra features in `fetchFile`, you can just use the browsers built-in `fetch` method.

```
import {parse} from '@loaders.gl/core';

import {OBJLoader} from '@loaders.gl/scene/obj';



const data = await parse(fetch(url), OBJLoader);
```

## Remarks[​](#remarks "Direct link to Remarks")

* `fetch` is available in [supported Node.js versions](https://loaders.gl/next/docs/developer-guide/node.md#supported-nodejs-versions).
* For `string` URLs - `fetchFile` will delegate to `fetch` after resolving the URL.
* For `File`/`Blob` - a `Response` object will be returned. Any `RequestInit` options are ignored in this case.
* `Response.headers` (`Content-Length` and `Content-Type`) are populated (on a best effort basis for `File`, `Blob` and under Node.js).
* Supports `setPathPrefix`: If path prefix has been set, it will be appended if `url` is relative (e.g. does not start with a `/`).
* Supports `File` and `Blob` objects on the browser (and returns "mock" fetch response objects).
