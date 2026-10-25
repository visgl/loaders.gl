# Experimental TypeScript HDF5 reader

`HDF5TypeScriptFile` provides an independent, range-capable subset of HDF5 reading through `@loaders.gl/scientific/hdf5`:

```ts
import {HDF5TypeScriptFile} from '@loaders.gl/scientific/hdf5';

const file = await HDF5TypeScriptFile.fromBytes(bytes);
const dataset = await file.readDataset('/group/values');
```

`fromURL(url)` uses validated HTTP `206` range requests. Metadata and selected payloads can be fetched without buffering the entire file when the HDF5 layout is supported. `readDataset` handles supported contiguous numeric datasets; `readChunkedDataset(path, selection)` handles supported chunked numeric layouts and half-open hyperslabs.

The current implementation supports v2/v3 superblocks, v2 object headers and bounded continuation chunks, compact hard links, primitive numeric dataspaces and datatypes, contiguous layouts, and selected chunked layouts. Chunk-index support includes v1 B-trees, single and implicit chunks, and unpaged unfiltered fixed arrays. It applies supported filter primitives, numeric fill values, and bounded selective chunk reads. B-tree v2 and extensible-array headers can be inspected, but their records are rejected explicitly.

This API is experimental. It does not yet cover v0/v1 superblocks and object headers, dense or soft/external links, paged or filtered fixed-array records, B-tree v2 or extensible-array record traversal, every filter or datatype, attributes, or NetCDF-4 dimension-scale semantics. The synthetic tests cover parser boundaries and selected reads; a broad real-file differential corpus is still needed. Keep using the `h5wasm` backend for general HDF5 files.
