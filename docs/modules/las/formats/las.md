import {LasDocsTabs} from '@site/src/components/docs/las-docs-tabs';

# LAS / LAZ

<LasDocsTabs active="overview" />

- _[`@loaders.gl/las`](/docs/modules/las)_
- _[ASPRS LAS 1.5](https://asprslas.org/latest/index.html)_ - _[ASPRS LAS 1.4 R15](https://www.asprs.org/wp-content/uploads/2019/07/LAS_1_4_r15.pdf)_ - _[COPC 1.0](https://copc.io/)_ - _[LASzip project](https://github.com/LASzip/LASzip)_ - _[LAZ spec](https://www.cs.unc.edu/~isenburg/lastools/download/laszip.pdf)_

The _LASER file format_ (LAS) and its compressed version (LAZ) are public formats for the interchange of 3D point cloud data, developed for lidar mapping and related point cloud workflows.

## LAS, LAZ, and COPC

LAS is the uncompressed exchange format. LAZ is the losslessly compressed form defined by LASzip-compatible compression. COPC is a range-readable LAZ 1.4 layout that adds an octree hierarchy so applications can request spatial subsets without downloading the whole file.

| Format | Description |
| --- | --- |
| LAS | Uncompressed LAS records in one file. |
| LAZ | LAS records compressed with LASzip-compatible lossless compression. |
| COPC | LAZ 1.4 organized as a clustered octree with range-readable chunk metadata. |

## Current Implementation Limits

`LASLoader` uses a pure TypeScript implementation. It is still incomplete and should not yet be treated as a complete LAS, LAZ, or COPC implementation.

LAS file versions and LASzip codec versions are independent. A claim such as "LAZ 1.4 support" is therefore not precise enough: compatibility also depends on the PDRF, LASzip compressor and coder, item codec versions, chunk-table mode, and whether the caller needs complete raw records or only the fields exposed as Arrow columns.

### TypeScript LAS Parser

| Capability | TypeScript status |
| --- | --- |
| Uncompressed LAS 1.0-1.4 | Partial. Reads common public-header fields and PDRF 0-10 record layouts. Dedicated conformance fixtures do not yet cover every header version/PDRF combination. |
| LAS 1.5 | Partial. Extended point counts, typed header metadata, and PDRF 9/10 files are fixture-tested; full LAS 1.5 conformance rules are not complete. |
| Arrow columns | `POSITION`, `intensity`, `classification`, `synthetic`, `keyPoint`, `withheld`, `overlap`, `COLOR_0`, `GPS_TIME`, `NIR`, `scanAngle`, `userData`, `pointSourceId`, `returnNumber`, `numberOfReturns`, `scannerChannel`, `scanDirectionFlag`, `edgeOfFlightLine`, `WAVEFORM`, and `EXTRA_BYTES` where present. `WAVEFORM` is a fixed-width 29-byte LAS waveform packet reference column; `EXTRA_BYTES` is the fixed-width raw user-byte payload from each point record. With `las.extraBytes: 'typed'`, `EXTRA_BYTES` produces one prefixed typed Arrow attribute per descriptor. `las.columns` selects optional output columns; `POSITION` is always returned. |
| GPS time | Exposed as `GPS_TIME` for PDRF 1, 3-5, and 6-10. |
| NIR | Exposed as `NIR` for PDRF 8 and 10. |
| Classification, return, and scanner flags | `synthetic`, `keyPoint`, `withheld`, `overlap`, return fields, flight-line flags, and scanner channel are exposed as typed Arrow columns. Legacy PDRF 0-5 records report `overlap` as zero. |
| Waveform packet fields | PDRF 4/5/9/10 packet references are exposed as the optional fixed-width `WAVEFORM` Arrow column. Waveform sample payload handling is not implemented. |
| Extra bytes | Extra Bytes VLR descriptors are exposed as typed metadata; the raw per-point payload is available through `EXTRA_BYTES`, or descriptor-defined numeric attributes through `las.extraBytes: 'typed'`. Scalar data types 1-6 and 9-10 plus deprecated 2-component and 3-component vector codes based on those scalar types are supported with per-component descriptor scale/offset. 64-bit integer types 7-8 and vector codes based on them remain raw-only. Raw Extra Bytes are opt-in when `las.columns` is omitted; list `EXTRA_BYTES` explicitly. Typed Extra Bytes are included by default when `las.extraBytes: 'typed'` and `las.columns` is omitted. |
| VLRs, EVLRs, CRS, WKT, GeoTIFF records | VLRs and complete EVLRs are preserved in metadata. WKT CRS records (coordinate-system and math-transform), GeoTIFF CRS payloads and resolved GeoKey entries, Extra Bytes, waveform descriptors, and LASzip records are recognized. Full CRS reprojection is outside the loader. |
| `parseInBatches` | Incremental for uncompressed LAS and fixed-size LAZ chunks. Legacy LAZ preserves arithmetic and item state across input chunks without replay; layered PDRF 6-10 emits selected Arrow rows once their required layers arrive. Waveform references do not wait for trailing Extra Bytes, while raw or typed Extra Bytes become ready after their Byte14 layers arrive. |

### TypeScript LAS Writer

| Capability | TypeScript status |
| --- | --- |
| Uncompressed LAS writing | Partial. Supports LAS output for represented mesh/table fields. |
| LAS versions | Versions 1.0-1.4 are selectable and LAS 1.5 is rejected. Round-trip coverage currently targets default LAS 1.2 and LAS 1.4/PDRF 7; full version conformance is not claimed. |
| Point data record formats | PDRF 0-10 are selectable. Position, intensity, classification, RGB, NIR, GPS time, return/scan fields, waveform packet references, and configured Extra Bytes are mapped from input attributes. Missing fields are zero-filled. |
| LAZ writing | Supported for PDRF 0-10 with fixed-size or variable-size LASzip chunk tables. Legacy PDRFs use LASzip compressor 2/item version 2; modern PDRFs use layered compressor 3/item version 3. |
| COPC writing | Supported by `@loaders.gl/copc` through its separate `COPCWriter` entry point. |
| VLRs, EVLRs, CRS, Extra Bytes VLRs | LASzip and configured Extra Bytes VLRs are written; broader metadata records remain incomplete. |
| Streaming writing | `encodeInBatches` may buffer input so final counts, bounds, offsets, and headers can be written correctly. |

### TypeScript LAZ Decoder

#### LASzip Codec Options

| LASzip feature | Supported TypeScript combinations |
| --- | --- |
| Legacy PDRF 0-3 items | Compressor 2, arithmetic coder 0, Point10/GPS/RGB/Byte item version 2. Legacy item version 1 is rejected because it uses a different codec. |
| Legacy waveform PDRF 4-5 | Compressor 2, arithmetic coder 0, Point10/GPS/RGB/Byte item version 2, and WavePacket13 item version 1. |
| Modern PDRF 6-8 items | Layered compressor 3, arithmetic coder 0, and Point14/RGB14/RGBNIR14/Byte14 item versions 2, 3, or 4. |
| Modern waveform PDRF 9-10 | Layered compressor 3, arithmetic coder 0, Point14/RGB14/RGBNIR14/Byte14 item versions 2-4, and WavePacket14 item version 3 or 4. |
| Extra Bytes | Byte10 version 2 and Byte14 versions 2-4 are losslessly preserved in raw records. Extra Bytes VLR definitions can be exposed as typed scalar or vector Arrow columns for supported numeric types. |
| Chunk table | Version 0, fixed-size and variable-size chunks. Other chunk-table versions are rejected. |
| Unsupported modes | Pointwise compressor 1, coders other than 0, and legacy item version 1. |

### TypeScript LAZ Encoder

`encodeLAZChunk()` and `createLAZChunkEncoder()` encode raw LAS point records into one LASzip layered chunk. They do not write the surrounding LAS header, LASzip VLR, chunk table, or `.laz` file container.

`LASWriter` uses the chunk encoder to write complete `.laz` files for PDRF 0-10, including the LASzip VLR, fixed-size or variable-size chunks, chunk-table pointer, and version 0 chunk table.

| LASzip feature | Supported TypeScript combinations |
| --- | --- |
| Legacy PDRF 0-5 items | Compressor 2, arithmetic coder 0, and Point10/GPS/RGB/Byte item version 2, with WavePacket13 item version 1 for PDRF 4-5. |
| Modern PDRF 6-10 items | Layered compressor 3, arithmetic coder 0, and Point14/RGB14/RGBNIR14/Byte14 item version 3, with WavePacket14 item version 3 for PDRF 9-10. |
| Extra Bytes | Byte14 item version 3 is losslessly encoded as independent layers. |
| Input modes | Complete raw point buffers and feedable raw byte ranges. Feedable input is buffered until `close()` and `encode()` are called. |
| Interoperability | PDRF 0-10 output is decoded through the TypeScript implementation. Independent LASzip fixtures cover legacy, modern, and waveform item sets; bundled WASM comparisons cover the item sets those variants support. |
| Unsupported modes | Pointwise compressor 1, coders other than 0, and alternate emitted item versions. |

#### Point Record Formats

"Raw" below means that `decodeLAZChunk()` and raw file-batch APIs reproduce every byte in each LAS point record. Arrow output is intentionally narrower.

| PDRF | Valid LAS versions | Raw LAZ decode | Arrow output | Dedicated fixture coverage |
| --- | --- | --- | --- | --- |
| 0 | 1.0-1.4 | Supported for the legacy codec combination above. | XYZ, intensity, classification. | Synthetic chunk unit test. |
| 1 | 1.1-1.4 | Supported for the legacy codec combination above. | XYZ, intensity, classification, `GPS_TIME`. | Synthetic chunk unit test. |
| 2 | 1.2-1.4 | Supported for the legacy codec combination above. | XYZ, intensity, classification, RGB. | Synthetic chunk unit test. |
| 3 | 1.2-1.4 | Supported for the legacy codec combination above. | XYZ, intensity, classification, RGB, `GPS_TIME`. | Full-file parity with laz-rs on two LAS 1.2 files. |
| 4 | 1.3-1.4 | Supported, including WavePacket13 and Extra Bytes. | XYZ, intensity, classification, `GPS_TIME`, `WAVEFORM`. | Byte-for-byte paired LAS/LAZ fixture. |
| 5 | 1.3-1.4 | Supported, including RGB, WavePacket13, and Extra Bytes. | XYZ, intensity, classification, RGB, `GPS_TIME`, `WAVEFORM`. | Byte-for-byte paired LAS/LAZ fixture. |
| 6 | 1.4-1.5 | Supported for Point14 item versions 2-4. | XYZ, intensity, classification, `GPS_TIME`. | LAS 1.4 byte parity plus COPC decoder parity. |
| 7 | 1.4-1.5 | Supported for Point14/RGB14 item versions 2-4. | XYZ, intensity, classification, RGB, `GPS_TIME`. | LAS 1.4 v3 decoder parity and v4 byte parity across all scanner channels. |
| 8 | 1.4-1.5 | Supported for Point14/RGBNIR14 item versions 2-4. | XYZ, intensity, classification, RGB, `GPS_TIME`, `NIR`. | LAS 1.4 byte parity including NIR and Extra Bytes. |
| 9 | 1.4-1.5 | Supported, including WavePacket14 versions 3-4 and exact 64-bit offsets. | XYZ, intensity, classification, `GPS_TIME`, `WAVEFORM`. | LAS 1.4/v3 and LAS 1.5/v4 byte parity. |
| 10 | 1.4-1.5 | Supported, including RGB, NIR, WavePacket14 versions 3-4, and exact 64-bit offsets. | XYZ, intensity, classification, RGB, `GPS_TIME`, `NIR`, `WAVEFORM`. | LAS 1.4/v3 and LAS 1.5/v4 byte parity. |

#### Streaming Granularity

| Input case | First output can be emitted | Retained input / limitation |
| --- | --- | --- |
| Uncompressed LAS | After the header and enough complete point records arrive. | Only incomplete framing and the current output batch are retained. |
| Fixed-chunk legacy LAZ PDRF 0-5 | Before the current compressed chunk is complete, after enough bytes decode complete rows. | Preserves arithmetic and item predictors across feeds, retains a bounded lookahead, and never replays emitted rows. |
| Fixed-chunk layered LAZ PDRF 6-8 | After all compressed layers required by the requested Arrow columns arrive. | Unrequested trailing layers do not delay the first batch. Raw and typed Extra Bytes are projected directly after their trailing Byte14 layers arrive. |
| Fixed-chunk layered LAZ PDRF 9-10 | After the required Point14, RGB/NIR, WavePacket14, or Byte14 layers arrive. | Waveform rows can precede trailing Extra Bytes. Selecting Extra Bytes requires their final layers but no complete raw-record decode or copy. |
| Variable-chunk LAZ | After the EOF chunk table is available. | A forward-only source is buffered because per-chunk point counts are stored at EOF. |
| COPC node | After the compressed layers required by the selected columns arrive. | Node ranges are fetched in bounded ordered requests; unrequested trailing layers do not delay the first PDRF 6-8 batch. |

#### Selective LAZ 1.4 Decoding

For complete-buffer `parse` and streaming `parseInBatches`, the TypeScript parser writes requested positions, intensity, classification, classification flags, RGB, GPS time, NIR, point metadata, waveform references, and Extra Bytes into Arrow column buffers. `las.columns` accepts `POSITION`, `intensity`, `classification`, `synthetic`, `keyPoint`, `withheld`, `overlap`, `COLOR_0`, `GPS_TIME`, `NIR`, the remaining point metadata names, `WAVEFORM`, and `EXTRA_BYTES`; positions remain mandatory for point-cloud output. Omitting the option returns all represented fields, while an empty array returns positions only. Set `las.extraBytes` to `'typed'` together with `EXTRA_BYTES` to decode descriptor-defined numeric values into attributes named `EXTRA_BYTES_<descriptor-name>`. Names are sanitized and duplicate names receive numeric suffixes. In raw mode, `EXTRA_BYTES` must be listed explicitly; typed mode includes Extra Bytes when `las.columns` is omitted.

PDRF 6-10 store groups of fields in independent compressed layers. Omitted intensity, classification, RGB, GPS time, and NIR layers are skipped without allocating their output arrays or constructing their arithmetic decoders and models. The parser also avoids arithmetic decoding for scan flags, scan angle, user data, point source ID, waveform packet references, and Extra Bytes layers that are not represented in the returned table. The COPC rendering path uses the same direct target to request positions and RGB only.

Legacy PDRF 0-5 fields share an interleaved entropy stream. Column selection still avoids output arrays, color-depth detection, and field extraction for omitted columns, but it cannot skip the corresponding entropy decoding.

Compressed field layers are decoded as bounded ranges of the original chunk instead of copied into per-layer readers. LASzip v3's historical item-context channel behavior is preserved separately from each point's actual scanner channel, while LASzip v4 uses the corrected context-switch behavior declared by each item in the LASzip VLR. These details reduce temporary allocation and property lookup overhead without changing the complete-record APIs.

`decodeLAZChunk()` and the raw cursor API continue to decode every field and return complete LAS point records byte-for-byte. A cursor cannot switch between raw and selective output, or change its selected fields, after decoding starts because skipped arithmetic streams cannot be resumed at the corresponding point.

Dedicated PDRF 4-10 fixtures compare every raw decoded byte and every represented Arrow attribute against matching uncompressed LAS records. LASzip-generated PDRF 4/5 fixtures validate legacy WavePacket13 and PDRF 5 field ordering. A current-LASzip PDRF 7 fixture verifies Point14, RGB14, and Byte14 item version 4 across all four scanner-channel contexts while retaining a LAS 1.4 header. The bundled COPC decoder misdecodes that fixture's RGB values after scanner-channel changes, and bundled laz-rs rejects item version 4, so current LASzip plus uncompressed LAS provide its correctness oracle. PDRF 8 coverage includes NIR, GPS time, Extra Bytes, and scanner-channel transitions. PDRF 9/10 coverage exercises all waveform-offset predictor modes, exact 64-bit offsets above `Number.MAX_SAFE_INTEGER`, packet sizes, float vector fields, GPS time, NIR, and Extra Bytes. LASzip-generated LAS 1.5 PDRF 9/10 fixtures additionally verify item version 4 across all four scanner-channel contexts. The `WAVEFORM` column is populated from the lossless packet reference bytes; waveform sample payloads and Extra Bytes remain separate follow-up representations.

The slow conformance lane feeds PDRF 4-10 fixtures through multiple seeded arbitrary byte boundaries and compares every decoded point byte with independently generated uncompressed LAS records. It also rejects malformed headers, point-data offsets, chunk-table pointers, and truncated chunk tables. Fixed-chunk parsing validates the trailing chunk table after progressive point delivery, so a malformed file cannot complete successfully even when its point layers were independently decodable. The reader also supports LASzip's legal `-1` pointer layout for non-seekable writers, validates the table at the decoded fixed-chunk boundary, and verifies that the final eight-byte footer points back to that table without retaining intervening EVLR data.

PDRF 7 performance checks combine deterministic memory invariants with conservative CPU-time floors. The Arrow streaming path must avoid raw-batch and decoded-chunk allocations, keep framing copies bounded by the input size, sustain at least 500,000 points per CPU second on the slow-test runner, and retain a measurable advantage when only `POSITION` and `COLOR_0` are requested. The benchmark suite remains the source for precise wall-clock throughput comparisons because short CI timing checks are intentionally broad regression alarms.

### TypeScript COPC Path

| Capability | TypeScript status |
| --- | --- |
| COPC header and metadata | Native TypeScript parsing for the LAS 1.4 header, VLR/EVLR descriptors, COPC info, WKT, and raw Extra Bytes metadata. |
| COPC hierarchy and range selection | Native TypeScript hierarchy-page parsing, lazy child-page traversal, octree bounds, and node range selection. |
| Node range fetching | Selected node ranges are fetched incrementally without downloading unrelated nodes or the complete file. |
| Point decoding | Supported for COPC nodes using LAZ 1.4 PDRF 6, 7, or 8. |
| Render attribute output | Positions, RGB, NIR, intensity, classification, GPS time, scan angle, and point source ID decode directly into Arrow buffers. Unrequested layers are skipped. |
| Progressive point output while range data arrives | Implemented at layered LAZ readiness boundaries. Position-only rows can arrive before RGB and NIR layers. |
| COPC writer | `COPCWriter` output includes range-readable LAZ node chunks, a variable chunk table, COPC info, and a paged hierarchy EVLR. |

## Version History

| Version | Point data record formats | Main additions | loaders.gl status |
| --- | --- | --- | --- |
| 1.5 | 6-10 in LAS 1.5 mode | Backward compatibility with LAS 1.1-1.4, stricter modern point record model, WKT CRS records. | Header/read compatibility in the TypeScript path; writing is not targeted. |
| 1.4 | 0-10 | 64-bit point counts and offsets, EVLR refinements, WKT CRS support, Extra Bytes VLR, modern PDRFs 6-10. | Reads uncompressed LAS 1.4 and decodes LAZ chunks for PDRF 0-10. |
| 1.3 | 0-5 | EVLRs and waveform packet support. | TypeScript LAZ decoding supports all PDRFs, including raw PDRF 4/5 waveform references. |
| 1.2 | 0-3 | RGB point formats and broader geospatial metadata conventions. | Read and write support for common uncompressed LAS attributes. |
| 1.1 | 0-1 | GPS time point format and early classification/metadata updates. | Read support for common attributes. |
| 1.0 | 0 | Original LAS public header, VLRs, and core point record format. | Read support for common attributes. |

## LAS 1.5

LAS 1.5 is the current ASPRS LAS specification generation. It keeps backward compatibility with LAS 1.1 through LAS 1.4 while defining a modern LAS 1.5 mode around point data record formats 6 through 10. In LAS 1.5 mode, legacy PDRFs 0 through 5 are no longer valid point formats. CRS records use WKT.

LAS 1.5 does not change the basic LAS idea: the public header identifies the file layout, point records are fixed length, and VLR/EVLR records carry metadata. The important implementation consequence is that readers need to understand both legacy-compatible files and LAS 1.5 files with modern point records.

| Case | Streaming feasible? | Work needed |
| --- | --- | --- |
| LAS 1.5 uncompressed PDRF 6-8 | Yes | Header time fields, WKT validation, and LAS 1.5 conformance checks. |
| LAS 1.5 uncompressed PDRF 9-10 | Yes | Raw point readers for waveform packet reference fields. |
| LAZ 1.5 PDRF 6-8 | Yes, by compressed chunk | LASzip item version 4 context switching is supported; broader LAS 1.5 fixture coverage remains desirable. |
| LAZ 1.5 PDRF 9-10 | Yes, at layered field boundaries | PDRF 9 and 10 item version 4 are validated across all scanner channels. Selected waveform references can be emitted before trailing Extra Bytes and are preserved byte-for-byte. |
| LAS/LAZ 1.5 waveform payload bytes | Partial | Preserve point references first; waveform payload EVLR or external WDP streaming is separate follow-up work. |

## LAS 1.4

LAS 1.4 is the version used by COPC and by most modern LAZ delivery workflows. It moved LAS from legacy 32-bit limits toward 64-bit counts and offsets and introduced the modern point data record formats 6 through 10. These formats improve classification, return, scanner channel, overlap, GPS time, color, NIR, and waveform handling.

LAS 1.4 can still carry legacy point formats 0 through 5 for compatibility. For new LAS 1.4 data, PDRFs 6 through 10 are preferred. WKT CRS records are required for PDRFs 6 through 10; GeoTIFF CRS records are retained for legacy PDRFs 0 through 5.

## Geospatial Reference Systems

The TypeScript parser preserves the LAS geospatial reference system metadata without changing coordinates. For WKT CRS VLRs, `loaderData.metadata.wkt` contains the OGC Coordinate System WKT (record ID 2112) and `loaderData.metadata.wktMathTransform` contains the OGC Math Transform WKT (record ID 2111). For legacy GeoTIFF CRS VLRs, `loaderData.metadata.geotiff` contains the raw GeoKey directory, double parameters, and ASCII parameters from record IDs 34735, 34736, and 34737. `geotiff.keyDirectory.entries` also resolves inline values and references into the double and ASCII parameter records while retaining each key's original tag location, count, and offset.

This is metadata support, not a reprojection engine: `POSITION` values remain in the LAS file's declared coordinate reference system, with the LAS header scale and offset applied. Applications that need a different CRS should interpret the WKT or GeoTIFF metadata with a CRS library and perform reprojection explicitly. Raw VLR and EVLR records remain available for vendor-specific CRS extensions.

## LAS 1.3

LAS 1.3 introduced Extended Variable Length Records (EVLRs). EVLRs live after the point data records and support larger payloads than VLRs. This made them suitable for large metadata blocks and waveform-related payloads.

PDRFs 4 and 5 add waveform packet references on top of the earlier GPS time and color formats. Waveform packet data can be stored internally or externally, depending on the file and application workflow.

## LAS 1.2

LAS 1.2 added RGB color point formats. PDRF 2 contains XYZ, intensity, classification, and RGB. PDRF 3 adds GPS time to the RGB record. LAS 1.2 is still common in older colorized lidar and photogrammetry point clouds.

## LAS 1.1

LAS 1.1 added the GPS time point format. PDRF 1 extends the original core record with GPS time, which made it possible to preserve timing information for many acquisition workflows.

## LAS 1.0

LAS 1.0 defined the core LAS layout: a public header block, optional VLRs, and fixed-length point data records. PDRF 0 contains the core fields: integer XYZ coordinates, intensity, return flags, classification, scan angle rank, user data, and point source ID.

## File Structure

A LAS file consists of sections:

| Section                                 | Description                                                                                                                                                                          |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Public header block                     | Describes format, number of points, extent of the point cloud and other generic data.                                                                                                |
| Variable length records (VLR)           | Any number of optional records (up to 64K bytes) to provide various data such as the spatial reference system used, metadata, waveform packet information and user application data. |
| Point data records                      | Data for each of the individual points in the point cloud, including coordinates, classification (e.g. terrain or building), flight and scan data, etc.                              |
| Extended variable length records (EVLR) | From v1.3. Similar to VLRs but located after the point data records and allow a much larger data payload per record due to the use of 8-byte size descriptors.                       |

Notes:

- All point data records in one LAS file use the same point data record format. The formats differ in the available fields, such as GPS time, RGB color, NIR color, scanner channel, classification flags, and waveform packet references.
- The 3D point coordinates are represented within the point data records by 32-bit integers, to which a scaling and offset defined in the public header must be applied in order to obtain the actual coordinates.
- As the number of bytes used per point data record is explicitly given in the public header block, it is possible to add user-defined "extra bytes" after the specification-defined fields. LAS 1.4 standardized an Extra Bytes VLR for describing these fields.

## Point Data Record Formats

| PDRF | Added by | Main fields |
| --- | --- | --- |
| 0 | LAS 1.0 | XYZ, intensity, return flags, classification, scan angle rank, user data, point source ID. |
| 1 | LAS 1.1 | PDRF 0 + GPS time. |
| 2 | LAS 1.2 | PDRF 0 + RGB. |
| 3 | LAS 1.2 | PDRF 0 + GPS time + RGB. |
| 4 | LAS 1.3 | PDRF 1 + waveform packet reference. |
| 5 | LAS 1.3 | PDRF 3 + waveform packet reference. |
| 6 | LAS 1.4 | Modern core record with 256 classes, overlap flag, scanner channel, larger return fields, GPS time. |
| 7 | LAS 1.4 | PDRF 6 + RGB. |
| 8 | LAS 1.4 | PDRF 7 + NIR. |
| 9 | LAS 1.4 | PDRF 6 + waveform packet reference. |
| 10 | LAS 1.4 | PDRF 7 + waveform packet reference. |

## COPC Range Layout

COPC is a LAZ 1.4 file with additional layout rules that make it efficient for HTTP range requests and other random-access readers. A COPC file must use PDRF 6, 7, or 8, must contain a COPC `info` VLR, and must contain a COPC `hierarchy` VLR.

The COPC `info` VLR is the first VLR in the file and starts immediately after the 375-byte LAS 1.4 header. It records the octree center, half-size, root spacing, GPS time range, and the byte offset and byte size of the root hierarchy page.

Hierarchy pages contain fixed-size entries for octree nodes. Each entry is keyed by level and integer x/y/z location. An entry can identify an empty node, point data for a node, or another hierarchy page. For point data entries, the hierarchy stores:

| Field | Purpose |
| --- | --- |
| `pointDataOffset` | File byte offset where the node's compressed LAZ point chunk starts. |
| `pointDataLength` | Number of bytes in that compressed chunk. |
| `pointCount` | Number of points represented by the node. |

A range-aware COPC reader first reads the LAS header and COPC VLRs, then reads the root hierarchy page. To load a tile or spatial subset, it traverses the hierarchy, issues a range request for `pointDataOffset..pointDataOffset + pointDataLength`, and passes that complete compressed LAZ chunk to a LAZ 1.4 chunk decoder. This is why COPC can avoid downloading unrelated point data while still being a valid LAZ file for sequential readers.

## Remaining Roadmap

Within the documented version, PDRF, and codec matrix, the TypeScript implementation now covers complete-file LAS/LAZ parsing, PDRF 0-10 point records, fixed and variable LAZ chunk tables, stateful legacy and selective layered streaming, progressive PDRF 6-10 delivery, direct raw and typed Extra Bytes projection, classification flags, LAZ writing, native COPC hierarchy and range parsing, bounded parallel COPC node decoding through the single TypeScript LAS worker, independently validated paged COPC writing, seeded split conformance, malformed-input handling, and memory and throughput regression gates. The remaining work is ordered by value to the primary LAS 1.4 and COPC rendering path.

| Order | Work item | Impact | Cost | Acceptance target |
| --- | --- | --- | --- | --- |
| 1 | Add waveform sample payload access | Low for COPC, specialized elsewhere | High | Range-read internal waveform EVLRs and external WDP data, apply waveform descriptors, and expose samples without losing exact packet-reference offsets. |
| 2 | Complete LAS 1.5 conformance and writing | Medium | Medium | Enforce LAS 1.5 header, WKT, and PDRF rules; add broader fixtures; and emit LAS 1.5 only after independent-reader interoperability is demonstrated. |
