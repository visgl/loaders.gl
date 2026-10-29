Extension point

# Add one format without learning the whole runtime.

A loader describes how to recognize and parse input. A writer describes how to encode a compatible result. The surrounding core APIs handle fetching, workers, batching, and composition.

[Loader object format](https://loaders.gl/next/docs/specifications/loader-object-format.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/specifications/loader-object-format.md)[Composite loaders](https://loaders.gl/next/docs/developer-guide/composite-loaders.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/composite-loaders.md)

A small public contract

## Describe the format. Supply the transformation.

Keep metadata, parsing, and output behavior explicit so applications can use the new loader through the same load, batch, worker, and source APIs as built-in formats.

01

Identify

Name, extensions, MIME types, and tests

02

Parse

Text, binary, sync, async, or batched input

03

Compose

Call sub-loaders through the parser context

04

Ship

Keep workers and browser boundaries explicit

> See the detailed specification of the [loader object format API reference](https://loaders.gl/next/docs/specifications/loader-object-format.md).

## Overview[​](#overview "Direct link to Overview")

Applications can also create new loader objects. E.g. if you have existing JavaScript parsing functionality that you would like to use with the loaders.gl core utility functions.

Detailed guide

## Loader and writer implementation

The detailed sections below define object fields, parser variants, dependencies, composition, and access to the fetch response.

## Creating a Loader Object[​](#creating-a-loader-object "Direct link to Creating a Loader Object")

You would give a name to the loader object, define what file extension(s) it uses, and define a parser function.

```
export default {

  id: 'custom-json',

  name: 'JSON',

  module: 'custom-json',

  version: '1.0.0',

  mimeTypes: ['application/json'],

  options: {},

  extensions: ['json'],

  parse: async (arrayBuffer) => JSON.parse(new TextDecoder().decode(arrayBuffer)),

  parseTextSync: JSON.parse

};
```

See the [loader object specification](https://loaders.gl/next/docs/specifications/loader-object-format.md) for required metadata, detection tests, and supported parser methods.

A loader must define a parser function for the format, a function that takes the loaded data and converts it into a parsed object.

Depending on how the underlying loader works (whether it is synchronous or asynchronous and whether it expects text or binary data), the loader object can expose the parser in a couple of different ways, by providing the appropriate parser methods.

## Dependency Management[​](#dependency-management "Direct link to Dependency Management")

In general, it is recommended that loaders are "standalone" and avoid importing `@loaders.gl/core`. `@loaders.gl/core/loader-utils` provides a small set of shared loader utilities.

## Creating Composite Loaders[​](#creating-composite-loaders "Direct link to Creating Composite Loaders")

loaders.gl enables loaders to call other loaders (referred to as "sub-loaders" in this section). This enables loaders for "composite formats" to be "composed" out of loaders for the primitive parts. For more information see [Composite Loaders](https://loaders.gl/next/docs/developer-guide/composite-loaders.md).

## Accessing the Response object[​](#accessing-the-response-object "Direct link to Accessing the Response object")

Loaders will often use the [fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) to retrieve data. In most cases, a loader will only be concerned with the data payload, but in some cases it may be desirable to access the underlying [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) object, available on the `context` parameter.

An example of accessing a HTTP header.

```
export async function parseWithHeader(arrayBuffer, options, context) {

  const contentLength = context.response?.headers.get('content-length');

  return {contentLength, data: JSON.parse(new TextDecoder().decode(arrayBuffer))};

}
```
