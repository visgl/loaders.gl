import {CopcDocsTabs} from '@site/src/components/docs/copc-docs-tabs';

# COPC

<CopcDocsTabs active="format" />

- _[Specification at COPC.io](https://copc.io/)_
- _[Video Overview](https://www.youtube.com/watch?v=rWkKKZYN86A)_

COPC, short for Cloud Optimized Point Cloud, is a range-readable LAZ 1.4 file whose point data is organized as a clustered octree. A COPC reader can select spatial nodes and fetch only their compressed byte ranges instead of downloading the complete point cloud.

Data organization is modeled after the [EPT data format](https://entwine.io/en/latest/entwine-point-tile.html), but COPC stores the octree as variably chunked LAZ data in one file. The same file can therefore be consumed sequentially by a variable-chunk LAZ reader or spatially by a COPC hierarchy reader.

## Feature Matrix

The primary `@loaders.gl/copc` implementation is TypeScript-only. It does not require the `copc` package, laz-perf, Rust, or WebAssembly at runtime.

| Capability | Status | Current behavior |
| --- | :---: | --- |
| LAS 1.4 public header | **Full** | Validates the LAS signature, version, compressed PDRF, point counts, record length, scales, offsets, bounds, and VLR/EVLR offsets. |
| COPC info VLR | **Full** | Parses the root cube, spacing, hierarchy range, and GPS time range. The info record must be the first VLR. |
| VLR and EVLR discovery | **Full** | Walks record headers through exact range reads and retains user ID, record ID, description, payload offset, and payload length. |
| Coordinate reference system | **Full** | Reads OGC WKT from VLR or EVLR record 2112 and projects tile bounds and positions when the WKT is supported by proj4. A caller-supplied CRS can be used as a fallback. |
| Extra Bytes metadata | **Full** | Parses 192-byte descriptors and retains the raw VLR payload. Scalar and 2/3-component values, signedness, floating-point types, and descriptor scale/offset are preserved. |
| Root and child hierarchy pages | **Full** | Parses native 32-byte hierarchy entries, follows page references lazily, caches loaded pages, and validates offsets, lengths, and point counts. |
| Spatial node selection | **Full** | Resolves `depth-x-y-z` keys, computes octree bounds, exposes children, and fetches only selected node byte ranges. |
| Node range input | **Full** | Supports HTTP range-readable URLs, browser `Blob` objects, and local files in Node.js with `@loaders.gl/polyfills`. Short or invalid ranges fail deterministically. |
| PDRF 6 | **Full** | TypeScript Point14 decoding with positions and selectively requested scalar fields. |
| PDRF 7 | **Full** | PDRF 6 plus progressive RGB decoding. |
| PDRF 8 | **Full** | PDRF 7 plus progressive NIR decoding. |
| LAZ codec | **Full for COPC** | Layered LASzip compressor 3, arithmetic coder 0, Point14/RGB14/RGBNIR14/Byte14 item versions 2-4. |
| Arrow table output | **Full** | Atomic and batched APIs return Arrow tables directly without an intermediate object-per-point representation. |
| Selective field decoding | **Full** | Unrequested LAZ field layers are skipped, avoiding arithmetic decoder state, output arrays, and point traversal for those fields. |
| Progressive node decoding | **Full at layer boundaries** | Node byte ranges are fed incrementally. Rows are emitted when all compressed layers required by the requested columns are available. |
| Cancellation | **Full** | Abort signals are checked during hierarchy traversal, range loading, and progressive point decoding. |
| COPC writing | **Experimental** | Writes LAS 1.4 PDRF 6-8, variable LAZ chunks, a version 0 chunk table, COPC info VLR, and hierarchy EVLR. |
| Waveform PDRF 9/10 | **Not part of COPC 1.0** | COPC 1.0 permits only PDRF 6, 7, and 8. |

### Arrow Columns

`POSITION` is always decoded. Other columns are opt-in for progressive batches except that RGB is included by default when the point format contains color.

| Arrow column | PDRF 6 | PDRF 7 | PDRF 8 | Source fields |
| --- | :---: | :---: | :---: | --- |
| `POSITION` | Yes | Yes | Yes | Scaled and offset X, Y, Z, transformed to tile-relative coordinates. |
| `COLOR_0` | - | Yes | Yes | 16-bit red, green, and blue. |
| `NIR` | - | - | Yes | 16-bit near-infrared channel. |
| `intensity` | Yes | Yes | Yes | 16-bit pulse intensity. |
| `classification` | Yes | Yes | Yes | LAS 1.4 classification code. |
| `GPS_TIME` | Yes | Yes | Yes | 64-bit GPS time. |
| `scanAngle` | Yes | Yes | Yes | LAS 1.4 signed scan angle. |
| `pointSourceId` | Yes | Yes | Yes | 16-bit point source identifier. |
| `userData` | Yes | Yes | Yes | 8-bit user data value. |
| `returnNumber` | Yes | Yes | Yes | Return ordinal for the emitted pulse. |
| `numberOfReturns` | Yes | Yes | Yes | Total returns for the emitted pulse. |
| `scannerChannel` | Yes | Yes | Yes | LAS 1.4 scanner channel. |
| `scanDirectionFlag` | Yes | Yes | Yes | Scan direction bit. |
| `edgeOfFlightLine` | Yes | Yes | Yes | End-of-flight-line bit. |
| `EXTRA_BYTES_*` | Yes | Yes | Yes | Named typed attributes from the Extra Bytes descriptor VLR, requested with `EXTRA_BYTES`. |

Classification flags (`synthetic`, `keyPoint`, `withheld`, and `overlap`) remain available through the low-level point schema but are not yet separate progressive Arrow attributes.

### Streaming Boundaries

COPC is naturally range-streamable at hierarchy-page and node boundaries. The source first reads the LAS header and VLR headers, fetches the COPC info payload, and then fetches only the hierarchy pages and point nodes selected by traversal.

Within a node, layered LAZ stores fields in independent compressed ranges. Position-only rows can be emitted once the Point14 layers arrive. PDRF 7 color rows wait for both Point14 and RGB layers, while PDRF 8 NIR rows additionally wait for RGB/NIR. The complete file and unrelated nodes are never required, but an individual requested row cannot be emitted before all layers selected for that row are available.

## Range Layout

| File region | How the reader uses it |
| --- | --- |
| LAS 1.4 public header | Locates VLRs, point data, EVLRs, record format, scales, offsets, and dataset bounds. |
| COPC info VLR | Locates the root hierarchy page and defines the root octree cube and spacing. |
| Hierarchy page | Maps octree keys either to compressed node ranges or to additional hierarchy pages. |
| Point-data range | Contains one independently decodable LAZ chunk for a point-bearing node. |
| Hierarchy EVLRs | May hold root or child hierarchy pages outside the regular VLR area. |

Each point-bearing hierarchy entry contains `pointDataOffset`, `pointDataLength`, and `pointCount`. `COPCSourceLoader` requests the half-open range `pointDataOffset..pointDataOffset + pointDataLength` and passes the arriving bytes to the TypeScript LAZ decoder.

## Implementation

Key aspects distinguish an organized COPC LAZ file from an LAZ 1.4 that is unorganized:

- It MUST contain ONLY LAS PDRFs 6, 7, or 8 formatted data
- It MUST contain a COPC info VLR
- It MUST contain a COPC hierarchy VLR or EVLR

`COPCWriter` emits LAS 1.4 PDRF 6-8 data with the COPC info VLR, variable-size LASzip chunks, a version 0 variable chunk table, and a single hierarchy EVLR. Points are sampled deterministically into parent levels and remaining points are partitioned spatially into child octants.
