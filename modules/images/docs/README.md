# Overview

The `@loaders.gl/images` module contains loader and writers for images that follow loaders.gl conventions and work under both node and browser.

## Installation

```bash
npm install @loaders.gl/images
npm install @loaders.gl/core
```

## API

| Loader                                                         | Description |
| -------------------------------------------------------------- | ----------- |
| [`ImageLoader`](modules/image/docs/api-reference/image-loader) |             |
| [`ImageWriter`](modules/image/docs/api-reference/image-writer) |             |

### Binary Image API

A set of functions that can extract information from "unparsed" binary memory representation of certain image formats. These functions are intended to be called on raw `ArrayBuffer` data, before the `ImageLoader` parses it and converts it to a parsed image type.

These functions are used internally to autodetect if image loader can be used to parse a certain `ArrayBuffer`, but are also available to applications.

| Function                                                   | Description |
| ---------------------------------------------------------- | ----------- |
| `getBinaryImageMetadata(imageData : ArrayBuffer) : Object` |             |
