# selectSource

<p class="badges">
  <img src="https://img.shields.io/badge/From-v4.2-blue.svg?style=flat-square" alt="From v4.2" />
</p>

The `selectSource()` function will make a "best effort" to select an appropriate source for a specific url or Blob. `selectSource()` is called internally by the
`createDataSource()` and `createDataSourceSync()` functions, but can also be called directly from applications.

Source selection heuristics are based on:

- Filename (or url) extensions
- MIME types (from `Response` `content-type` headers or `Blob.type`/`File.type` fields)
- Initial bytes - for certain inputs, the initial bytes in the supplied data can be compared against known "magic bytes" for various file formats.

## Usage

Select a source from a list of provided sources (best effort):

```typescript
import {selectSourceSync} from '@loaders.gl/core';
import {PMTilesSource} from '@loaders.gl/pmtiles';
import {MVTSource} from '@loaders.gl/csv';

selectSourceSync('filename.pmtiles', [PMTilesSource, MVTSource]); // => PMTilesSource
```

## Functions

### selectSource()

```ts
selectSource(data: String | Blob, ..., sources?: Source[], options?): Promise<Source | null>`
```

Selects an appropriate source for a file from a list of candidate sources by examining the `data` parameter, looking at URL extension, mimeType ('Content-Type') and/or an initial data chunk.

Parameters:

- `data` - data to perform autodetection against
- `sources` - can be a single source or an array of sources, or null.
- `options.type` - Force selection to a specific type of source (must still be provided in the source list).
- `options.nothrow`=`false` - Return null instead of throwing exception if no source can be found

Returns:

- A single source (or `null` if `options.nothrow` was set and no matching source was found).

Throws:

- If no matching source was found, and `options.nothrow` was not set.

Regarding the `sources` parameter:

- A single source object will be returned without matching.
- a `null` source list will use the pre-registered list of sources.
- A supplied list of sources will be searched for a matching source.

## Supported Data Formats

The acceptable types for `data` are inferred from the supplied loaders and may include:

- strings / data urls
- `File` and `Blob` objects:

## MIME types

If the standard MIME types for each format are not precise enough, sources.gl also supports [unregistered](https://en.wikipedia.org/wiki/Media_type#Unregistered_tree) MIME types. Each source will match the `application/x.<id>` where the `<id>` is the documented `id` of the source, e.g. `application/x.ply`/`application/x.draco`/etc ...

## Remarks

- File extensions - An attempt will be made to extract a file extension by stripping away query parameters and base path before matching against known source extensions.
