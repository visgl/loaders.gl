Point-cloud format

PCD

# A simple point-cloud interchange.

PCD describes point records with a compact header and ASCII or binary payload. loaders.gl maps those records to the shared point-cloud and Mesh Arrow shapes used by applications and writers.

[PCD module](https://loaders.gl/next/docs/modules/pointclouds/pcd.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/pointclouds/pcd.md)[PCDLoader](https://loaders.gl/next/docs/modules/pointclouds/pcd/api-reference/pcd-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/pointclouds/pcd/api-reference/pcd-loader.md)[PCDWriter](https://loaders.gl/next/docs/modules/pointclouds/pcd/api-reference/pcd-writer.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/pointclouds/pcd/api-reference/pcd-writer.md)

PCD[Try It](https://loaders.gl/next/examples/pointclouds/pcd)[Overview](https://loaders.gl/next/docs/modules/pointclouds/pcd/formats/pcd.md)[Format](https://loaders.gl/next/docs/modules/pointclouds/pcd/format.md)[PCDLoader](https://loaders.gl/next/docs/modules/pointclouds/pcd/api-reference/pcd-loader.md)[PCDWriter](https://loaders.gl/next/docs/modules/pointclouds/pcd/api-reference/pcd-writer.md)

Point records

## Keep the attributes, choose the representation.

The PCD header declares the fields, sizes, types, and layout of each point. Once decoded, applications can use the same point or typed-column path as other point-cloud formats.

01

Header

Fields, dimensions, point count, viewpoint, and storage layout.

02

Encodings

ASCII, binary, and the format-specific binary-compressed variant.

03

Output

PointCloud objects or Mesh Arrow tables.

04

Write

Encode compatible point data as ASCII PCD text.

Detailed guide

## PCD format and API details

The reference below documents header fields, supported encodings, decoded attributes, and loader/writer behavior.

## Loaders and Writers[​](#loaders-and-writers "Direct link to Loaders and Writers")

[Loader**PCDLoader**Loads PCD point clouds as PointCloud objects or Mesh Arrow tables.Output: PointCloud, Mesh Arrow tableAPIs: load, parse, parseSync](https://loaders.gl/next/docs/modules/pointclouds/pcd/api-reference/pcd-loader)[Writer**PCDWriter**Writes Mesh or Mesh Arrow table point clouds as ASCII PCD text.Input: Mesh, Mesh Arrow tableAPIs: encode, encodeSync, encodeTextSync](https://loaders.gl/next/docs/modules/pointclouds/pcd/api-reference/pcd-writer)

| Characteristic       | Value                                                                                                                                                                                    |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| File Format          | [Point Cloud Data](https://loaders.gl/next/docs/modules/pointclouds/pcd/formats/pcd.md)                                                                                             |
| Data Format          | [PointCloud](https://loaders.gl/next/docs/specifications/category-mesh.md), [Mesh Arrow table](https://loaders.gl/next/docs/specifications/category-mesh.md#mesh-arrow-tables) |
| File Extension       | `.pcd`                                                                                                                                                                                   |
| MIME Type            | Not standardized                                                                                                                                                                         |
| File Type            | Text/Binary                                                                                                                                                                              |
| Loader Decoder Type  | Synchronous                                                                                                                                                                              |
| Loader Worker Thread | ✅ Yes                                                                                                                                                                                   |
| Loader Streaming     | ❌ No                                                                                                                                                                                    |
| Writer File Type     | Text                                                                                                                                                                                     |
| Writer APIs          | `encode`, `encodeSync`, `encodeTextSync`                                                                                                                                                 |

## Supported Encodings[​](#supported-encodings "Direct link to Supported Encodings")

PCD files have an ASCII header. Point records can be stored as ASCII, binary, or compressed binary data. `PCDWriter` currently writes ASCII PCD text.

## Point Cloud Data[​](#point-cloud-data "Direct link to Point Cloud Data")

PCD files are organized around named numeric fields. `PCDLoader` maps common fields such as `x`, `y`, `z`, normals, and color data to Mesh Arrow table columns by default, or legacy PointCloud attributes when `pcd.shape: 'mesh'` is selected.
