Bundle boundaries

# Recognize many formats. Download fewer parsers up front.

Metadata loaders keep metadata in the main application bundle and dynamically load parser implementations when an input actually needs them.

[Loader categories](https://loaders.gl/next/docs/developer-guide/loader-categories.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/loader-categories.md)[Managing dependencies](https://loaders.gl/next/docs/developer-guide/dependencies.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/dependencies.md)

Bundle boundaries

## Recognize many formats. Load fewer parsers up front.

Keep format metadata in the application bundle and defer parser code until a file actually needs it. The async core APIs hide the split point from the normal loading path.

Supported inputs

[**CSV**delimited tables↗](https://loaders.gl/next/docs/modules/tables/csv/formats/csv.md)[**Parquet**columnar files↗](https://loaders.gl/next/docs/modules/tables/parquet/formats/parquet.md)[**glTF**scene assets↗](https://loaders.gl/next/docs/modules/scene/gltf/formats/gltf.md)[**LAS / LAZ**point clouds↗](https://loaders.gl/next/docs/modules/pointclouds/las/formats/las.md)

recogniz&#x65;**→**

import()

On-demand boundary

metadatapreloadcache

bundled for sync · split for async

pars&#x65;**→**

What the app receives

**Metadata**name, extensions, MIME types

**Parser chunk**loaded only when selected

**Application data**table, mesh, scene, or points

Broad format recognition and small startup bundles can coexist when the parser boundary is explicit.

When to split a parser

## Keep the application broad without making startup broad.

Use default metadata imports for asynchronous loading. Import a parser implementation when a synchronous API requires it.

01

Main bundle

Loader metadata and format recognition

02

On demand

Parser implementation loaded at first use

03

Async APIs

Core preloads the parser automatically

04

Sync APIs

Use an explicit parser implementation

Metadata loaders defer parser code until a format is used. They suit import tools that recognize many formats but parse only a few in each session. Import a parser-bearing loader directly when you need synchronous parsing at startup.

## Importing metadata loaders[​](#importing-metadata-loaders "Direct link to Importing metadata loaders")

Grouped format entry points export metadata-only loaders by default:

```
import {load} from '@loaders.gl/core';

import {CSVLoader} from '@loaders.gl/tables/csv';



const table = await load(url, CSVLoader);
```

Use the explicit parser entry point when a synchronous API needs a parser-bearing loader:

```
import {CSVLoaderWithParser} from '@loaders.gl/tables/csv/csv-loader';
```

The metadata loader has the same loader id, extensions, MIME types, and option shape as the bundled loader. The difference is that parser methods such as `parse`, `parseSync`, and `parseInBatches` are not present on the imported object. Instead, the loader exposes a `preload` function that core can use to dynamically import the parser-bearing implementation.

## How dynamic loading works[​](#how-dynamic-loading-works "Direct link to How dynamic loading works")

When an async core API such as `load`, `parse`, or `parseInBatches` receives an metadata loader, it preloads the parser implementation before parsing. The dynamic import gives the application's bundler a natural split point, so the parser implementation can be emitted as a separate application chunk and loaded only when needed.

This is different from pre-built worker loaders. Unbundled loader implementations are not served from the loaders.gl CDN by default. They are application bundle chunks produced by the application's bundler. Pre-built workers, on the other hand, may be loaded as separate worker scripts and can use CDN URLs or explicit `workerUrl` configuration.

## Automatic preload in async APIs[​](#automatic-preload-in-async-apis "Direct link to Automatic preload in async APIs")

Async core APIs preload metadata loaders automatically. In most cases, applications can pass an metadata loader to `load`, `parse`, or `parseInBatches` just like a normal loader:

```
import {parse} from '@loaders.gl/core';

import {CSVLoader} from '@loaders.gl/tables/csv';



const table = await parse(csvText, CSVLoader);
```

The first parse call dynamically imports the parser-bearing implementation. Core caches that implementation, so later async calls with the same loader object and backend option do not repeat the dynamic import.

## `preload()`[​](#preload "Direct link to preload")

Applications can also preload an metadata loader before the first parse call:

```
import {preload} from '@loaders.gl/core';

import {CSVLoader} from '@loaders.gl/tables/csv';



const parserLoader = await preload(CSVLoader);
```

`preload(loader)` returns the parser-bearing loader implementation and caches it in core. Later async parsing calls with the same metadata loader and `options[loader.id].backend` value can reuse that implementation.

This is useful when an application can predict that a format will be needed soon, for example after a user opens an import dialog but before they select a file. It can also make error handling more explicit because preload failures happen before the parsing call.

The returned loader can be used directly:

```
import {parse, preload} from '@loaders.gl/core';

import {CSVLoader} from '@loaders.gl/tables/csv';



const parserLoader = await preload(CSVLoader);

const table = await parse(csvText, parserLoader);
```

## `preload()` and `parseSync`[​](#preload-and-parsesync "Direct link to preload-and-parsesync")

Synchronous APIs cannot start a dynamic import. Preload first, then pass the returned parser-bearing loader to `parseSync`:

```
import {parseSync, preload} from '@loaders.gl/core';

import {CSVLoader} from '@loaders.gl/tables/csv';



const parserLoader = await preload(CSVLoader);

const table = parseSync(arrayBuffer, parserLoader);
```

If the loader has not been preloaded, `parseSync` will throw. If the loaded implementation does not support synchronous parsing, `parseSync` will still throw and the application should use the async `parse` API instead.

Core can also resolve the original metadata loader from its preload cache. Calling `loader.preload()` directly does not populate that cache; use the returned implementation or call core's `preload(loader)`.

## `preloadSync()`[​](#preloadsync "Direct link to preloadsync")

`preloadSync(loader)` returns the cached parser-bearing implementation if one is already available, or `null` if it has not been loaded:

```
import {preloadSync} from '@loaders.gl/core';

import {CSVLoader} from '@loaders.gl/tables/csv';



const parserLoader = preloadSync(CSVLoader);
```

`preloadSync` does not start a dynamic import. It is only a synchronous cache lookup.

## Availability[​](#availability "Direct link to Availability")

Check each format's documentation for its parser entry point. Metadata loaders are available from the bare format subpath, and parser-bearing loaders use a named loader subpath.
