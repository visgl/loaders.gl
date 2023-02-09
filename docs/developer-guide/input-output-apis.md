# Input/Output APIs

loaders.gl is focused on support the input and output of data from JavaScript and TypeScript programs.

To do this one needs acccess to platform APIs for loading data from files and URLs, as well as APIs for manipulating binary data, images etc.

There are a number of different possible APIs to chose from, depending on the version of JavaScript supported by a browser or the version of Node.js being used. In addition, the set of available APIs move 

## Loading data

loaders.gl standardizes on the `fetch()` API. This API emerged in browsers however is now supported out-of-the-box on Node, starting with Node.js v18.

The result of a `fetch` operation is a `Response` object which can be 

For older Node.js versions, `@loaders.gl/polyfills` installs polyfills of `fetch`, `Response` and `Headers` classes.

## Local file access

For local file access in the browser, the `File` class (a derivate of `Blob`, see below) is the tool of choice. 
It is not clear if a counterpart to the `File` class will eventually be supported by Node.js. 

> Note that reading local files in the browser has limitations. Actual file paths are obscured and files can only be created as a result of an interactive file selection or file drop action by the user.

## Saving data

Saving data from a browser is either done by POST requests to a server, or via local downloads. 

## Binary data APIs

A perhaps surprisingly big issue when writing loaders.gl is the choice of binary data APIs.

The `Buffer` class in Node.js is not supported by browsers. Polyfills are available, but they can add considerable size (~50KB) to an application.

loaders.gl tries to avoid use of the `Buffer` class in its core libraries and loaders, preferring to use `ArrayBuffer`, typed arrays and `Blob`s.

The `Blob` (and `File`) classes in the browser have some unique advantages. They leverage an efficient blob storage feature in the browser, and they also enable partial, random-access reads from large blobs in that storage or from local files. `Blob`s are available in Node starting with Node.js v18. For lower versions, a polyfill will be installed by `@laoders.gl/polyfills`.

There is a separate article on binary data.

## Image APIs

The preferred image platform API is the `ImageBitmap`. It is currently only supported on modern browsers, not in Node.js. 

At this stage loaders.gl does not provide an ImageBitmap polyfill, and it is not clear if future versions of Node.js would support something similar natively.