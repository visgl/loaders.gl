# Draco3D

![logo](../images/draco-small.png)

- *[`@loaders.gl/draco`](/docs/modules/draco)* - loaders.gl implementation
- *[Draco3D](https://google.github.io/draco/)* - Open-source library for compressing and decompressing 3D geometric meshes and point clouds.

## Use cases

While possible to use independently, Draco compression is primarily used to compress geometries in glTF files and also in tiled 3D formats such as 3D Tiles and I3S.

## Supported Features

- Supports meshes and point clouds.

| Mesh Type     | Supported |
| ------------- | --------- |
| `MESH`        | ✅         |
| `POINT_CLOUD` | ✅         |

## Draco Attribute Support 

| Attribute Type    | `DracoLoader` | `DracoWriter` | JS Type        |
| ----------------- | ------------- | ------------- | -------------- |
| `DT_INT8` (1)     | ✅             | ✅             | `Int8Array`    |
| `DT_UINT8` (2)    | ✅             | ✅             | `Uint8Array`   |
| `DT_INT16` (3)    | ✅             | ✅             | `Int16Array`   |
| `DT_UINT16` (4)   | ✅             | ✅             | `Uint16Array`  |
| `DT_INT32` (5)    | ✅             | ✅             | `Int32Array`   |
| `DT_UINT32` (6)   | ✅             | ✅             | `Uint32Array`  |
| `DT_INT64` (7)    | ❌             | ❌             | `Int64Array`   |
| `DT_UINT64` (8)   | ❌             | ❌             | `Uint64Array`  |
| `DT_FLOAT32` (9)  | ✅             | ✅             | `Float32Array` |
| `DT_FLOAT64` (10) | ❌             | ❌             | `Float64Array` |
| `DT_BOOL` (11)    | ❌             | ❌             | N/A            |

Notes: 
- `Float64` and other 64 bit formats are not valid for glTF geometry attributes, These are normally only used for "extra" attributes. 64 bit attributes can appear when converting LAS files with metadata to glTF or 3D Tiles, see [CesiumJS blog]( https://cesium.com/blog/2024/03/20/preserving-more-metadata-for-point-clouds-using-3dtiles/)
- loaders.gl ignores unsupported attributes.

## Draco Metadata Support

- Metadata dictionaries are available both on the mesh and also on each attribute.
- Supports all Draco metadata field types, including: 

| Metadata Field | Supported |
| -------------- | --------- |
| `Int32Array`   | ✅         |
