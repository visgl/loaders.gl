import {PlyDocsTabs} from '@site/src/components/docs/ply-docs-tabs';

# PLY Format

<PlyDocsTabs active="format" />

## Loaders and Writers

<div className="docs-api-card-grid">
  <a className="docs-api-card" href="/docs/modules/ply/api-reference/ply-loader">
    <span className="docs-api-card__kind">Loader</span>
    <strong>PLYLoader</strong>
    <span>Loads PLY meshes as Mesh objects or Mesh Arrow tables.</span>
    <span className="docs-api-card__meta">Output: Mesh, Mesh Arrow table</span>
    <span className="docs-api-card__meta">APIs: load, parse, parseSync</span>
  </a>
  <a className="docs-api-card" href="/docs/modules/ply/api-reference/ply-writer">
    <span className="docs-api-card__kind">Writer</span>
    <strong>PLYWriter</strong>
    <span>Writes Mesh or Mesh Arrow table data as ASCII PLY text.</span>
    <span className="docs-api-card__meta">Input: Mesh, Mesh Arrow table</span>
    <span className="docs-api-card__meta">APIs: encode, encodeSync, encodeTextSync</span>
  </a>
</div>

| Characteristic       | Value                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------ |
| File Format          | [PLY](/docs/modules/ply/formats/ply)                                                       |
| Data Format          | [Mesh](/docs/specifications/category-mesh), [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables) |
| File Extension       | `.ply`                                                                                     |
| MIME Type            | Not standardized                                                                           |
| File Type            | Binary/Text                                                                                |
| Loader Decoder Type  | Synchronous                                                                                |
| Loader Worker Thread | Yes                                                                                        |
| Loader Streaming     | No                                                                                         |
| Writer File Type     | Text                                                                                       |
| Writer APIs          | `encode`, `encodeSync`, `encodeTextSync`                                                   |

## Supported Encodings

PLY supports ASCII, binary little-endian, and binary big-endian encodings. `PLYWriter` currently writes ASCII PLY text.

## Mesh Data

PLY files describe mesh elements such as vertices and faces. `PLYLoader` maps common vertex properties to Mesh attributes by default, or Mesh Arrow table columns when `ply.shape: 'arrow-table'` is selected. Common attributes include `POSITION`, `NORMAL`, `TEXCOORD_0`, and `COLOR_0`.
