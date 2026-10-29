Core loading API

# Give loaders a resource. Get usable data back.

The `load()` function combines fetching, loader selection, and parsing for a URL or browser file. It is the shortest path from a resource to the category data your application needs.

[Core module](https://loaders.gl/next/docs/modules/core.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core.md)[Parse in batches](https://loaders.gl/next/docs/modules/core/api-reference/load-in-batches.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/api-reference/load-in-batches.md)

The loader boundary

## Formats change. The application path can stay the same.

Choose a loader explicitly when the format is known, or let the selector choose from a compatible set. The result remains the shape your application is built to consume.

Input formats

[**Parquet**columnar table↗](https://loaders.gl/next/docs/modules/tables/parquet/formats/parquet.md)[**GeoJSON**feature data↗](https://loaders.gl/next/docs/modules/tables/json/formats/geojson.md)[**glTF / GLB**scenegraph↗](https://loaders.gl/next/docs/modules/scene/gltf/formats/gltf.md)[**LAS / LAZ**point cloud↗](https://loaders.gl/next/docs/modules/pointclouds/las/formats/las.md)

selec&#x74;**→**

{ }

Loader selection

explicit · list · registry

retur&#x6E;**→**

Application shapes

[**Table**rows or Arrow columns↗](https://loaders.gl/next/docs/specifications/category-table.md)[**Mesh**positions and attributes↗](https://loaders.gl/next/docs/specifications/category-mesh.md)[**Scenegraph**nodes and materials↗](https://loaders.gl/next/docs/specifications/category-scenegraph.md)[**Point cloud**positions and point fields↗](https://loaders.gl/next/docs/specifications/category-mesh.md)

One loader can be precise; a loader list can be flexible; the result contract is still yours.

The loading path

## Fetch, select, parse, return.

Use one loader when the format is known, or provide a set of loaders when extension and content detection should choose the implementation. The result follows the loader’s category data contract.

01

Input

URL, data URL, File, Blob, or supported loaded data

02

Selection

Explicit loader or best-effort autodetection

03

Execution

Fetch bytes, text, JSON, or a stream as required

04

Output

Category data defined by the selected loader

```
load(

  url: string | File | Blob,

  loaders?: Loader | Loader[],

  options?: LoaderOptions

): Promise<unknown>
```

The `load()` function fetches and parses data with a specific loader object. An array of loader objects can be provided, in which case `load()` attempts to select the appropriate loader from the URL, extension, content type, and file signature.

The `loaders` parameter can be omitted when loaders have been registered with [`registerLoaders`](https://loaders.gl/next/docs/modules/core/api-reference/register-loaders.md). The selected loader tells core whether it needs text, JSON, binary data, or a stream.

Detailed guide

## load inputs and options

The sections below document loader selection, accepted resource types, return values, registered loaders, path prefixes, and loader options.

Use `load()` for resources

* Pass a URL, data URL, browser `File`, or `Blob` when core should fetch the resource.
* Pass an explicit loader when the format is known; pass an array when detection should choose.
* Use [`parse()`](https://loaders.gl/next/docs/modules/core/api-reference/parse.md) when the bytes, text, response, or stream are already available.

The return value depends on the selected loader's category data. For example, a CSV loader may return batches or a table, while a glTF loader returns a scenegraph-shaped object.

## Parameters[​](#parameters "Direct link to Parameters")

* `url` accepts HTTP(S) and data URLs, Node.js file names, browser `File` objects, and `Blob` objects. Non-string inputs are passed directly to the parsing path.
* `loaders` can be one loader, an array of candidate loaders, or omitted in favor of registered loaders.
* `options` combines core fetch/parse options with loader-specific sub-objects. See [`LoaderOptions`](https://loaders.gl/next/docs/modules/core/api-reference/loader-options.md).

Any path prefix set by [`setPathPrefix`](https://loaders.gl/next/docs/modules/core/api-reference/set-path-prefix.md) is applied to relative URLs. If `@loaders.gl/core/polyfills` is installed, the same API can be used under Node.js.

## Options[​](#options "Direct link to Options")

The options object can contain:

* options defined by the `parse` function can be specified.
* options specific to any loaders can also be specified (in loader specific sub-objects).

Please refer to the corresponding documentation page for `parse` and to each loader for details.
