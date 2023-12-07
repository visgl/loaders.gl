# Preferred JavaScript APIs

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

The preferred image platform API is the `ImageBitmap`. It is currently only supported on modern browsers, not in Node.js. 

At this stage loaders.gl does not provide an ImageBitmap polyfill, and it is not clear if future versions of Node.js would support something similar natively.
