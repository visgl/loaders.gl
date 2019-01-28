# File Utilities

A set of file load and save utilities that (attempt to) work consistently across browser and node.


## Functions

### loadFile(url : String [, options : Object]) : ArrayBuffer

Notes:
* Any path prefix set by `setPathPrefix` will be appended to relative urls.


### loadImage(url : String [, options : Object]) : Image / HTMLImageElement

<p class="badges">
   <img src="https://img.shields.io/badge/browser-only-red.svg?style=flat-square" alt="browser only" />
</p>

This is a basic image loading function that only works in the browser. For image loading and writing that works across both browser and node, refer to the `@loaders.gl/images` module.

`options.crossOrigin` - Provides control of the requests cross origin field.


### readFile(file : File)

<p class="badges">
   <img src="https://img.shields.io/badge/browser-only-red.svg?style=flat-square" alt="browser only" />
</p>

Reads a file in the browser. The file must be a `File` object returned from file selection or drag-and-drop operations.


### setPathPrefix(prefix : String)

This sets a path prefix that is automatically prepended to relative path names provided to load functions.


### getPathPrefix() : String

Returns the current path prefix set by `setPathPrefix`.


## Remarks

* The path prefix support is intentionally designed as a limited scope mechanism that can help e.g. in situations like getting test cases to load data from the right place. It was not intended to support general application use cases.
