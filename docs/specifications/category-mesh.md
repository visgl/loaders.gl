# Mesh and PointCloud Loaders

The _mesh and pointcloud_ loader category is intended for simpler mesh and point clouds formats that describe a "single geometry primitive" (as opposed to e.g. a scenegraph consisting of a hierarchy of multiple geometries).

## Mesh/PointCloud Category Loaders

| Loader                                                                                          | Notes                     |
| ----------------------------------------------------------------------------------------------- | ------------------------- |
| [`DracoArrowLoader`](/docs/modules/draco/api-reference/draco-loader)                             | Mesh Arrow table          |
| [`LASArrowLoader`](/docs/modules/las/api-reference/las-loader)                                   | Mesh Arrow table          |
| [`OBJArrowLoader`](/docs/modules/obj/api-reference/obj-loader)                                   | Mesh Arrow table          |
| [`PCDArrowLoader`](/docs/modules/pcd/api-reference/pcd-loader)                                   | Mesh Arrow table          |
| [`PLYArrowLoader`](/docs/modules/ply/api-reference/ply-loader)                                   | Mesh Arrow table          |
| [`QuantizedMeshArrowLoader`](/docs/modules/terrain/api-reference/quantized-mesh-loader)          | Mesh Arrow table          |
| [`TerrainArrowLoader`](/docs/modules/terrain/api-reference/terrain-loader)                       | Mesh Arrow table          |
| [`DracoLoader`](/docs/modules/draco/api-reference/draco-loader)                                  | Legacy Mesh object        |
| [`LASLoader`](/docs/modules/las/api-reference/las-loader)                                        | Legacy PointCloud object  |
| [`OBJLoader`](/docs/modules/obj/api-reference/obj-loader)                                        | Legacy Mesh object        |
| [`PCDLoader`](/docs/modules/pcd/api-reference/pcd-loader)                                        | Legacy PointCloud object  |
| [`PLYLoader`](/docs/modules/ply/api-reference/ply-loader)                                        | Legacy Mesh object        |
| [`QuantizedMeshLoader`](/docs/modules/terrain/api-reference/quantized-mesh-loader)               | Legacy Mesh object        |
| [`TerrainLoader`](/docs/modules/terrain/api-reference/terrain-loader)                            | Legacy Mesh object        |

## Mesh/PointCloud Category Writers

Mesh category writers accept Mesh Arrow tables and legacy Mesh objects. Legacy Mesh input is converted to a Mesh Arrow table before encoding, so each writer keeps one normalized encode path.

| Writer                                                                                     | Notes                                  |
| ------------------------------------------------------------------------------------------ | -------------------------------------- |
| [`DracoWriter`](/docs/modules/draco/api-reference/draco-writer)                             | Writes Draco meshes and point clouds   |
| [`LASWriter`](/docs/modules/las/api-reference/las-writer)                                   | Writes uncompressed LAS point clouds   |
| [`OBJWriter`](/docs/modules/obj/api-reference/obj-writer)                                   | Writes OBJ mesh text                   |
| [`PCDWriter`](/docs/modules/pcd/api-reference/pcd-writer)                                   | Writes ASCII PCD point clouds          |
| [`PLYWriter`](/docs/modules/ply/api-reference/ply-writer)                                   | Writes ASCII PLY meshes                |
| [`QuantizedMeshWriter`](/docs/modules/terrain/api-reference/quantized-mesh-writer)          | Writes quantized mesh terrain          |

## Data Format

A single mesh is typically defined by a set of attributes, such as `positions`, `colors`, `normals` etc, as well as a draw mode.

The Mesh/PointCloud category uses Arrow as the primary tabular mesh representation. Arrow loader variants return a loaders.gl Arrow table wrapper (`shape: 'arrow-table'`) whose raw Arrow `data` value has shape `'arrow'` and can be typed with `MeshArrowTableData` or `IndexedMeshArrowTableData` from `@loaders.gl/schema`.

Legacy Mesh loader variants return a JavaScript object shape that is optimized for direct use in WebGL frameworks:

- All attributes (and indices if present) are stored as typed arrays of the proper type.
- All attributes (and indices if present) are wrapped into glTF-style "accessor objects", e.g. `{size: 1-4, value: typedArray}`.
- Attribute names are mapped to glTF attribute names (on a best-effort basis).
- An `indices` field is added (only if present in the loaded geometry).
- A primitive drawing `mode` value is added (the numeric value matches WebGL constants, e.g `GL.TRIANGLES`).

| Field        | Type                | Contents                                                                                                      |
| ------------ | ------------------- | ------------------------------------------------------------------------------------------------------------- |
| `loaderData` | `Object` (Optional) | Loader and format specific data                                                                               |
| `header`     | `Object`            | See [Header](#header)                                                                                         |
| `mode`       | `Number`            | See [Mode](#mode)                                                                                             |
| `attributes` | `Object`            | Keys are [glTF attribute names](#gltf-attribute-name-mapping) and values are [accessor](#accessor) objects.   |
| `indices`    | `Object` (Optional) | If present, describes the primitive indices (elements) of the geometry as an [accessor](#accessor) object.    |

## Mesh Arrow Tables

`@loaders.gl/schema` exports predefined schema contracts for common mesh columns:

| Export                       | Description                                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------------------- |
| `MeshArrowColumns`           | Column type map for common mesh Arrow tables.                                               |
| `IndexedMeshArrowColumns`    | Column type map for indexed mesh Arrow tables.                                              |
| `MeshArrowTableData`         | Raw `arrow.Table<MeshArrowColumns>` alias.                                                   |
| `IndexedMeshArrowTableData`  | Raw `arrow.Table<IndexedMeshArrowColumns>` alias.                                            |
| `meshArrowSchema`            | Predefined mesh Arrow schema, starting with `POSITION: FixedSizeList<Float32>[3]`.           |
| `indexedMeshArrowSchema`     | Predefined indexed mesh Arrow schema with `POSITION` plus nullable `indices: List<Int32>`.   |

`IndexedMesh` uses a lowercase `indices` column because it mirrors glTF's primitive-level `indices` property. It is not an uppercase vertex attribute semantic like `POSITION`, `NORMAL`, or `TEXCOORD_0`.

For indexed meshes, the full index list is stored in the nullable `indices` column at Arrow row `0`; remaining vertex rows store `null`. Vertex attributes are stored as Arrow `FixedSizeList` columns, so `POSITION` is a row-per-vertex `FixedSizeList<Float32>[3]` column.

Consumers can validate common columns with `meshArrowSchema` or `indexedMeshArrowSchema`. Loaders may append loader-specific trailing attribute columns after the predefined fields, such as `NORMAL`, `COLOR_0`, `TEXCOORD_0`, or custom Draco attributes.

### Mesh Arrow Columns

| Column       | Arrow Type                   | Nullable | Description                                                                                                                        |
| ------------ | ---------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `POSITION`   | `FixedSizeList<Float32>[3]`  | No       | Required predefined vertex position column. Each row is one XYZ vertex position.                                                    |
| `indices`    | `List<Int32>`                | Yes      | Required only for `IndexedMesh` Arrow tables. Row `0` stores the full primitive index list; remaining vertex rows store `null`.     |
| `NORMAL`     | `FixedSizeList<T>[3]`        | No       | Optional vertex normal column when present in the source mesh. `T` follows the source attribute typed array when possible.          |
| `COLOR_0`    | `FixedSizeList<T>[3 or 4]`   | No       | Optional vertex color column when present in the source mesh. `T` follows the source attribute typed array when possible.           |
| `TEXCOORD_0` | `FixedSizeList<T>[2]`        | No       | Optional first texture coordinate column when present in the source mesh. `T` follows the source attribute typed array when possible. |
| Custom       | `FixedSizeList<T>[size]`     | No       | Optional loader-specific or source-specific vertex attribute column appended after predefined fields.                               |

### Mesh Arrow Metadata

Arrow schema and field metadata are stored as `Map<string, string>` values. Structured values are JSON-serialized strings.

Schema-level metadata:

| Key           | Value Format                                | Description                                                                                 |
| ------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `topology`    | String                                      | Mesh topology, such as `point-list`, `triangle-list`, or `triangle-strip`.                   |
| `mode`        | Numeric string                              | Primitive mode using WebGL/glTF constants, such as `0` for points or `4` for triangles.      |
| `boundingBox` | JSON string `[[minX, minY, minZ], [maxX, maxY, maxZ]]` | Mesh bounding box when available.                                                           |

Field-level metadata:

| Key             | Value Format   | Description                                                                                       |
| --------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `byteOffset`    | Numeric string | Attribute byte offset when preserved from the source mesh accessor.                                |
| `byteStride`    | Numeric string | Attribute byte stride when preserved from the source mesh accessor.                                |
| `normalized`    | Boolean string | Whether integer attribute values should be interpreted as normalized values.                       |
| Loader-specific | String or JSON string | Loader-specific metadata may be preserved, for example Draco metadata entries encoded as JSON strings. |

### Header

The `header` fields are only recommended at this point, applications can not assume they will be present:

| `header` Field | Type     | Contents                                   |
| -------------- | -------- | ------------------------------------------ |
| `vertexCount`  | `Number` |                                            |
| `boundingBox`  | `Array`  | `[[minX, minY, minZ], [maxX, maxY, maxZ]]` |

### Mode

Primitive modes are aligned with [OpenGL/glTF primitive types](https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#primitive)

| Value | Primitive Mode   | Comment                                                                                              |
| ----- | ---------------- | ---------------------------------------------------------------------------------------------------- |
| `0`   | `POINTS`         | Used for point cloud category data                                                                   |
| `1`   | `LINES`          | Lines are rarely used due to limitations in GPU-based rendering                                      |
| `2`   | `LINE_LOOP`      | -                                                                                                    |
| `3`   | `LINE_STRIP`     | -                                                                                                    |
| `4`   | `TRIANGLES`      | Used for most meshes. Indices attributes are often used to reuse vertex data in remaining attributes |
| `5`   | `TRIANGLE_STRIP` | -                                                                                                    |
| `6`   | `TRIANGLE_FAN`   | -                                                                                                    |

### Accessor

`attributes` and `indices` are represented by glTF "accessor objects" with the binary data for that attribute resolved into a typed array of the proper type.

| Accessors Fields | glTF? | Type                | Contents                                                                                                                                           |
| ---------------- | ----- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`          | No    | `TypedArray`        | Contains the typed array (corresponds to `bufferView`). The type of the array will match the GL constant in `componentType`.                       |
| `size`           | No    | `Number`            | Number of components, `1`-`4`.                                                                                                                     |
| `byteOffset`     | Yes   | `Number`            | Starting offset into the bufferView.                                                                                                               |
| `count`          | Yes   | `Number`            | The number of elements/vertices in the attribute data.                                                                                             |
| `originalName`   | No    | `String` (Optional) | If this was a named attribute in the original file, the original name (before substitution with glTF attribute names) will be made available here. |

### glTF Attribute Name Mapping

To help applications manage attribute name differences between various formats, mesh loaders map known attribute names to [glTF 2.0 standard attribute names](https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#geometry) a best-effort basis.

When a loader can map an attribute name, it will replace ir with the glTF equivalent. This allows applications to use common code to handle meshes and point clouds from different formats.

| Name         | Accessor Type(s)   | Component Type(s)                                                                     | Description                                                                                                        |
| ------------ | ------------------ | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `POSITION`   | `"VEC3"`           | `5126` (FLOAT)                                                                        | XYZ vertex positions                                                                                               |
| `NORMAL`     | `"VEC3"`           | `5126` (FLOAT)                                                                        | Normalized XYZ vertex normals                                                                                      |
| `TANGENT`    | `"VEC4"`           | `5126` (FLOAT)                                                                        | XYZW vertex tangents where the _w_ component is a sign value (-1 or +1) indicating handedness of the tangent basis |
| `TEXCOORD_0` | `"VEC2"`           | `5126` (FLOAT), `5121` (UNSIGNED_BYTE) normalized, `5123` (UNSIGNED_SHORT) normalized | UV texture coordinates for the first set                                                                           |
| `TEXCOORD_1` | `"VEC2"`           | `5126` (FLOAT), `5121` (UNSIGNED_BYTE) normalized, `5123` (UNSIGNED_SHORT) normalized | UV texture coordinates for the second set                                                                          |
| `COLOR_0`    | `"VEC3"`, `"VEC4"` | `5126` (FLOAT), `5121` (UNSIGNED_BYTE) normalized, `5123` (UNSIGNED_SHORT) normalized | RGB or RGBA vertex color                                                                                           |
| `JOINTS_0`   | `"VEC4"`           | `5121` (UNSIGNED_BYTE), `5123` (UNSIGNED_SHORT)                                       |                                                                                                                    |
| `WEIGHTS_0`  | `"VEC4"`           | `5126` (FLOAT), `5121` (UNSIGNED_BYTE) normalized, `5123` (UNSIGNED_SHORT) normalized |                                                                                                                    |

> Note that for efficiency reasons, mesh loaders are not required to convert the format of an attribute's binary data to match the glTF specifications (i.e. if normals were encoded using BYTES then that is what will be returned even though glTF calls out for FLOAT32). Any such alignment needs to be done by the application as a second step.

## Limitations

### Scenegraph support

For more complex, scenegraph-type formats (i.e. formats that contain multiple geometric primitives), loaders.gl provides glTF 2.0 support via the `GLTFLoader`.

### Material support

Material support is provided by some mesh formats (e.g. OBJ/MTL) and is currently not implemented by loaders.gl, however the glTF loader has full support for PBR (Physically-Based Rendering) materials.
