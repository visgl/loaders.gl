# Using Unbundled Loaders

One of the strengths of loaders.gl is the ability for an application to support a wide range of similar input formats by using a list of loaders. However, bundling many rarely used loaders into the main application bundle has a real cost. In this case, unbundled loaders can be a good option.

Unbundled loaders keep the loader metadata in the main application bundle while deferring the parser implementation until the loader is actually used. This lets applications keep broad format support without paying the full parser bundle cost up front.

## When to use unbundled loaders

Use unbundled loaders when an application needs to recognize or support a format, but most sessions will not actually parse that format. For example, an import tool may support CSV, JSON, Parquet, Shapefile, FlatGeobuf, and several point cloud formats, while any individual user usually uploads only one of them.

The bundled loader import is still the best default when a loader is central to the application path, used frequently, or needed by synchronous APIs without a preload step.

Some modules expose an explicit `/bundled` subpath with the parser-bearing loaders exported under the same names. This is equivalent to importing the parser implementation directly and gives applications a stable import path even if a module's root export is metadata-only.

## Importing unbundled loaders

Unbundled loaders are exposed through a module's `/unbundled` subpath. The import pattern is:

```typescript
import {SomeLoader} from '@loaders.gl/some-module/unbundled';
```

For example, CSV provides metadata-only loaders from `@loaders.gl/csv/unbundled`:

```typescript
import {load} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv/unbundled';

const table = await load(url, CSVLoader);
```

CSV also provides parser-bearing loaders from `@loaders.gl/csv/bundled`:

```typescript
import {CSVLoader} from '@loaders.gl/csv/bundled';
```

The unbundled loader has the same loader id, extensions, MIME types, and option shape as the bundled loader. The difference is that parser methods such as `parse`, `parseSync`, and `parseInBatches` are not present on the imported object. Instead, the loader exposes a `preload` function that core can use to dynamically import the parser-bearing implementation.

## How dynamic loading works

When an async core API such as `load`, `parse`, or `parseInBatches` receives an unbundled loader, it preloads the parser implementation before parsing. The dynamic import gives the application's bundler a natural split point, so the parser implementation can be emitted as a separate application chunk and loaded only when needed.

This is different from pre-built worker loaders. Unbundled loader implementations are not served from the loaders.gl CDN by default. They are application bundle chunks produced by the application's bundler. Pre-built workers, on the other hand, may be loaded as separate worker scripts and can use CDN URLs or explicit `workerUrl` configuration.

## Automatic preload in async APIs

Async core APIs preload unbundled loaders automatically. In most cases, applications can pass an unbundled loader to `load`, `parse`, or `parseInBatches` just like a normal loader:

```typescript
import {parse} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv/unbundled';

const table = await parse(csvText, CSVLoader);
```

The first parse call dynamically imports the parser-bearing implementation. Core caches that implementation, so later async calls with the same loader object do not repeat the dynamic import.

## `preload()`

Applications can also preload an unbundled loader before the first parse call:

```typescript
import {preload} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv/unbundled';

const parserLoader = await preload(CSVLoader);
```

`preload(loader)` returns the parser-bearing loader implementation and caches it in core. Later async parsing calls with the same unbundled loader can reuse that implementation.

This is useful when an application can predict that a format will be needed soon, for example after a user opens an import dialog but before they select a file. It can also make error handling more explicit because preload failures happen before the parsing call.

The returned loader can be used directly:

```typescript
import {parse, preload} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv/unbundled';

const parserLoader = await preload(CSVLoader);
const table = await parse(csvText, parserLoader);
```

## `preload()` and `parseSync`

Synchronous APIs cannot start a dynamic import. To use an unbundled loader with `parseSync`, preload first and then call `parseSync` with the same loader:

```typescript
import {parseSync, preload} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv/unbundled';

await preload(CSVLoader);

const table = parseSync(arrayBuffer, CSVLoader);
```

If the loader has not been preloaded, `parseSync` will throw. If the loaded implementation does not support synchronous parsing, `parseSync` will still throw and the application should use the async `parse` API instead.

Calling `loader.preload()` directly does not populate core's preload cache. Use `preload(loader)` from `@loaders.gl/core` when later `parseSync(data, loader)` should find the cached implementation.

## `preloadSync()`

`preloadSync(loader)` returns the cached parser-bearing implementation if one is already available, or `null` if it has not been loaded:

```typescript
import {preloadSync} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv/unbundled';

const parserLoader = preloadSync(CSVLoader);
```

`preloadSync` does not start a dynamic import. It is only a synchronous cache lookup.

## Availability

Unbundled subpaths are introduced module by module. Check the loader module documentation for the exact public subpath. For CSV, use:

```typescript
import {CSVLoader} from '@loaders.gl/csv/unbundled';
```
