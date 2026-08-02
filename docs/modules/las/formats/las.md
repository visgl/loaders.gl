import {LasDocsTabs} from '@site/src/components/docs/las-docs-tabs';

# LAS / LAZ

<LasDocsTabs active="overview" />

- _[`@loaders.gl/las`](/docs/modules/las)_
- _[ASPRS LAS 1.5](https://asprslas.org/latest/index.html)_ - _[ASPRS LAS 1.4 R15](https://www.asprs.org/wp-content/uploads/2019/07/LAS_1_4_r15.pdf)_ - _[COPC 1.0](https://copc.io/)_ - _[LASzip project](https://github.com/LASzip/LASzip)_ - _[LAZ spec](https://www.cs.unc.edu/~isenburg/lastools/download/laszip.pdf)_

The _LASER file format_ (LAS) and its compressed version (LAZ) are public formats for the interchange of 3D point cloud data, developed for lidar mapping and related point cloud workflows.

## Variants

LAS is the uncompressed exchange format. LAZ is the losslessly compressed form defined by LASzip-compatible compression. COPC is a range-readable LAZ 1.4 layout that adds an octree hierarchy so applications can request spatial subsets without downloading the whole file.

| Variant | Description |
| --- | --- |
| LAS | Uncompressed LAS records in one file. |
| LAZ | LAS records compressed with LASzip-compatible lossless compression. |
| COPC | LAZ 1.4 organized as a clustered octree with range-readable chunk metadata. |

## Current Implementation Limits

`@loaders.gl/las` has mature WASM-backed and Rust-backed LAZ paths. The TypeScript-only backend is opt-in and is still incomplete. It is intended to remove the runtime WASM requirement over time, but it should not yet be treated as a complete LAS, LAZ, or COPC implementation.

### TypeScript LAS Parser

| Capability | TypeScript backend status |
| --- | --- |
| Uncompressed LAS 1.0-1.4 | Partial. Reads the public header and common point fields. |
| LAS 1.5 | Partial read/header compatibility only. LAS 1.5-specific semantics are not complete. |
| Point data record formats 0-10 | Partial. Common fields are read, but not every field is exposed. |
| XYZ, intensity, classification | Supported. |
| RGB | Supported for RGB point formats. |
| GPS time | Parsed only indirectly by format layout today; not exposed as a first-class attribute by the TypeScript path. |
| NIR | Not exposed as a first-class attribute. |
| Return flags, scanner channel, scan angle, point source ID, user data | Incomplete. |
| Waveform packet fields | PDRF 4/5/9/10 packet references are preserved by the raw TypeScript LAZ APIs but are not exposed as Arrow columns. Waveform payload handling is not implemented. |
| Extra bytes | Raw record length is respected, but Extra Bytes VLR metadata is not mapped to output attributes. |
| VLRs, EVLRs, CRS, WKT, GeoTIFF records | Not fully parsed or preserved. |
| `parseInBatches` | Incremental for uncompressed LAS point records after enough header/point bytes are available. |

### TypeScript LAS Writer

| Capability | TypeScript backend status |
| --- | --- |
| Uncompressed LAS writing | Partial. Supports LAS output for represented mesh/table fields. |
| LAS versions | Writes LAS 1.0-1.4; LAS 1.5 writing is not supported. |
| Point data record formats | PDRF 0-8 are selectable, but unsupported fields are zero-filled or omitted. |
| LAZ writing | Not implemented. |
| COPC writing | Not implemented. |
| VLRs, EVLRs, CRS, Extra Bytes VLRs | Not complete. |
| Streaming writing | `encodeInBatches` may buffer input so final counts, bounds, offsets, and headers can be written correctly. |

### TypeScript LAZ Decoder

| Capability | TypeScript backend status |
| --- | --- |
| Full LAZ file parsing | Partial. Fixed-size LASzip chunks for supported TypeScript LAZ point formats can be decoded incrementally by `parseInBatches`. Variable-size chunk files are supported after their chunk table is available at EOF. |
| LASzip VLR parsing | Partial. Compression mode, fixed or variable chunking, and chunk-size metadata required for TypeScript LAZ decoding are parsed incrementally. |
| Chunk table parsing | LASzip chunk-table version 0 is supported for fixed-size and variable-size chunks. Decoded point counts and byte ranges are validated before decompression. |
| Single compressed chunk decode | Supported when metadata is supplied by the caller. |
| LAZ point formats 0-5 | Supported for legacy fixed-size LASzip chunks, including GPS time, RGB, and PDRF 4/5 WavePacket13 decoding. Complete batches can be emitted before a compressed chunk has fully arrived. |
| LAZ 1.4 point formats 6-10 | Supported for fixed-size full-file LAZ chunks. PDRF 9/10 raw decoding preserves the complete 29-byte waveform packet reference, including lossless 64-bit offsets. COPC remains limited by specification to PDRF 6-8. |
| Extra bytes in LAZ 1.4 chunks | Supported at the raw byte level when metadata supplies the record length. |
| Selective decompression | Supported for PDRF 6-10 Arrow output. The decoder skips independent LAZ 1.4 layers that are not represented in the returned table, including PDRF 9/10 waveform references, while preserving complete raw-record decoding through the chunk APIs. |
| True streaming decode | Partial. Legacy fixed-size PDRF 0-5 chunks emit complete batches before the current chunk or file ends using bounded geometric replay. Layered PDRF 6-10 emits after complete chunks arrive. Variable-size chunk point counts are stored in the table at EOF, so a forward-only input is buffered until that table is available. |
| LAZ encoding | Not implemented. |

#### Selective LAZ 1.4 Decoding

The TypeScript parser writes positions, intensity, classification, and RGB values directly into Arrow column buffers. PDRF 6-10 store groups of fields in independent compressed layers. The parser therefore avoids arithmetic decoding for scan flags, scan angle, user data, point source ID, GPS time, NIR, waveform packet references, and Extra Bytes layers that are not currently exposed in the returned table, using specialized batch loops for their common output fields. RGB remains enabled for PDRF 7, 8, and 10. The selective decoder also avoids constructing arithmetic models for skipped layers.

Compressed field layers are decoded as bounded ranges of the original chunk instead of copied into per-layer readers. LASzip v3's historical item-context channel behavior is preserved separately from each point's actual scanner channel, while LASzip v4 uses the corrected context-switch behavior declared by each item in the LASzip VLR. These details reduce temporary allocation and property lookup overhead without changing the complete-record APIs.

This optimization applies only to table parsing. `decodeLAZChunk()` and the raw cursor API continue to decode every field and return complete LAS point records byte-for-byte. A cursor cannot switch between selective table output and raw-record output after decoding starts because skipped arithmetic streams cannot be resumed at the corresponding point.

Dedicated PDRF 4, 5, 6, 8, 9, and 10 fixtures compare every raw decoded byte against matching uncompressed LAS records. LASzip-generated PDRF 4/5 fixtures validate legacy WavePacket13 and PDRF 5 field ordering. PDRF 8 coverage includes NIR, Extra Bytes, and scanner-channel transitions. PDRF 9/10 coverage exercises all waveform-offset predictor modes, exact 64-bit offsets above `Number.MAX_SAFE_INTEGER`, packet sizes, float vector fields, and Extra Bytes. LASzip-generated LAS 1.5 PDRF 9/10 fixtures additionally verify item version 4 across all four scanner-channel contexts. NIR, waveform references, and Extra Bytes are preserved by raw decoding but are not yet exposed as Arrow columns.

### TypeScript COPC Path

| Capability | TypeScript backend status |
| --- | --- |
| COPC hierarchy and range selection | Uses the existing COPC path; not a standalone TypeScript COPC parser yet. |
| Node range fetching | Supported. Each selected node's compressed byte range is fetched as a complete chunk. |
| Point decoding | Supported for COPC nodes using LAZ 1.4 PDRF 6, 7, or 8. |
| Progressive point output while range data arrives | Not implemented. |
| COPC writer | Not implemented. |

## Version History

| Version | Point data record formats | Main additions | loaders.gl status |
| --- | --- | --- | --- |
| 1.5 | 6-10 in LAS 1.5 mode | Backward compatibility with LAS 1.1-1.4, stricter modern point record model, WKT CRS records. | Header/read compatibility in the TypeScript path; writing is not targeted. |
| 1.4 | 0-10 | 64-bit point counts and offsets, EVLR refinements, WKT CRS support, Extra Bytes VLR, modern PDRFs 6-10. | Read support through existing backends; TypeScript path reads uncompressed LAS 1.4 and decodes LAZ chunks for PDRF 0-10. |
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
| LAZ 1.5 PDRF 9-10 | Yes, by compressed chunk | PDRF 9 and 10 item version 4 are validated across all scanner channels, with raw waveform packet references preserved byte-for-byte. |
| LAS/LAZ 1.5 waveform payload bytes | Partial | Preserve point references first; waveform payload EVLR or external WDP streaming is separate follow-up work. |

## LAS 1.4

LAS 1.4 is the version used by COPC and by most modern LAZ delivery workflows. It moved LAS from legacy 32-bit limits toward 64-bit counts and offsets and introduced the modern point data record formats 6 through 10. These formats improve classification, return, scanner channel, overlap, GPS time, color, NIR, and waveform handling.

LAS 1.4 can still carry legacy point formats 0 through 5 for compatibility. For new LAS 1.4 data, PDRFs 6 through 10 are preferred. WKT CRS records are required for PDRFs 6 through 10; GeoTIFF CRS records are retained for legacy PDRFs 0 through 5.

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

## Next Steps

The TypeScript-only backend should be completed in stages, with parity tests against the existing WASM/Rust paths at each stage.

| Priority | Work item | Acceptance target |
| --- | --- | --- |
| 1 | Add small permissively licensed fixtures for LAS/LAZ/COPC versions and feature cases. | Fixture set covers LAS 1.0-1.5 headers, PDRF 0-10, RGB, GPS time, NIR, Extra Bytes, EVLRs, waveform references, LAZ chunking, and COPC hierarchy pages. |
| 2 | Complete LAS metadata parsing. | Public header, VLRs, EVLRs, WKT, GeoTIFF CRS records, Extra Bytes VLRs, and waveform metadata are parsed and exposed consistently. |
| 3 | Complete raw LAS point readers and writers. | PDRF 0-10 fields round-trip where loaders.gl has an attribute representation, and unsupported fields are explicitly preserved or documented. |
| 4 | Implement full LAZ file parsing. | LASzip VLRs, fixed and variable chunk tables, chunk sizes, and sequential point batches work without WASM. |
| 5 | Expose waveform metadata and payload access. | PDRF 4/5/9/10 packet references become typed output metadata, and internal EVLR or external WDP sample payloads can be loaded on demand. Raw-record decompression is implemented. |
| 6 | Implement LAZ encoding. | Raw point data compressed by the TypeScript encoder decodes byte-for-byte to the original records. |
| 7 | Complete stateful feedable LAZ streaming. | Replace bounded replay for legacy chunks with resumable arithmetic/item state, and stream layered chunks as soon as the field ranges needed for complete rows are available. |
| 8 | Complete pure TypeScript COPC reading. | Header, COPC info VLR, hierarchy pages, range selection, and LAZ node decoding no longer depend on the existing COPC package internals. |
| 9 | Implement COPC writing. | Writer emits valid COPC 1.0 with hierarchy pages, range-readable LAZ node chunks, and required VLRs. |
| 10 | Promote backend defaults only after parity and performance are acceptable. | TypeScript backend performance and fixture coverage are documented against laz-perf/laz-rs baselines. |
