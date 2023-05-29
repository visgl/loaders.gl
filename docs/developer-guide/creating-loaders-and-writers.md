# Creating New Loaders and Writers

> See the a detailed specification of the [loader object format API reference](/docs/specifications/loader-object-format).

## Overview

Applications can also create new loader objects. E.g. if you have existing JavaScript parsing functionality that you would like to use with the loaders.gl core utility functions.

## Creating a Loader Object

You would give a name to the loader object, define what file extension(s) it uses, and define a parser function.

```typescript
export default {
  name: 'JSON',
  extensions: ['json'],
  testText: null,
  parse: async (arrayBuffer) => await JSON.parse(new TextDecoder().decode(arrayBuffer),
  parseTextSync: JSON.parse
};
```

| Field       | Type       | Default  | Description                                                                       |
| ----------- | ---------- | -------- | --------------------------------------------------------------------------------- |
| `name`      | `String`   | Required | Short name of the loader ('OBJ', 'PLY' etc)                                       |
| `extension` | `String`   | Required | Three letter (typically) extension used by files of this format                   |
| `testText`  | `Function` | `null`   | Guesses if a file is of this format by examining the first characters in the file |

A loader must define a parser function for the format, a function that takes the loaded data and converts it into a parsed object.

Depending on how the underlying loader works (whether it is synchronous or asynchronous and whether it expects text or binary data), the loader object can expose the parser in a couple of different ways, specified by provided one of the parser function fields.

## Dependency Management

In general, it is recommended that loaders are "standalone" and avoid importing `@loaders.gl/core`. `@loaders.gl/loader-utils` provides a small set of shared loader utilities.

## Creating Composite Loaders

loaders.gl enables loaders to call other loaders (referred to as "sub-loaders" in this section). This enables loaders for "composite formats" to be "composed" out of loaders for the primitive parts.

Good examples of sub-loaders are the `GLTFLoader` which can delegate Draco mesh decoding to the `DracoLoader` and image decoding to the various `ImageLoaders` and the `BasisLoader`.

Naturally, Composite loaders can call other composite loaders, which is for instance used by the `Tiles3DLoader` which uses the `GLTFLoader` to parse embedded glTF data in certain tiles.

## Calling loaders inside loaders

To call another loader, a loader should use the appropriate `parse` function provided in the `context` parameter.

A conceptual example of a 3D Tiles loader calling the `GLTFLoader` with some additional options.

```typescript
export async function parse3DTile(arrayBuffer, options, context) {
  const tile = {};
  // Extract embedded GLB (if present) into `tile.gltfArrayBuffer`
  ...
  if (tile.gltfArrayBuffer) {
    const {parse} = context;
    tile.gltf = await parse(tile.gltfArrayBuffer, GLTFLoader, {
      gltf: {...}
    });
  }
}
```

Remarks:

- While a loader could potentially import `parse` from `@loaders.gl/core` to invoke a sub-loader, it is discouraged, not only from a dependency management reasons, but it prevents loaders.gl from properly handling parameters and allow worker-loaders to call other loaders.

## LoaderContext

When a loader is being called (i.e. one of its `parse*()` functions is being called), a `LoaderContext` object is supplied.

## Accessing the Response object

Loaders will often use the [fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) to retrieve data. In most cases, a loader will only be concerned with the data payload, but in some cases it may be desirable to access the underlying [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) object, available on the `context` parameter.

An example of accessing a HTTP header.

```typescript
export async function parseWithHeader(arrayBuffer, options, context) {
  const {parse, response} = context;
  const contentLength = response.headers.get('content-length');
  const data = await parse(arrayBuffer, JSONLoader);
}
```
