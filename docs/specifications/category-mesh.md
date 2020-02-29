# Mesh and PointCloud Loaders

The _mesh and pointcloud_ loader category is intended for simpler mesh and point clouds formats that describe a "single geometry primitive" (as opposed to e.g. a scenegraph consisting of a hierarchy of multiple geometries).

## Mesh/PointCloud Category Loaders

| Loader                                                               | Notes |
| -------------------------------------------------------------------- | ----- |
| [`DracoLoader`](modules/draco/docs/api-reference/draco-loader)       |       |
| [`LASLoader`](modules/las/docs/api-reference/las-loader)             |       |
| [`OBJLoader`](modules/obj/docs/api-reference/obj-loader)             |       |
| [`PCDLoader`](modules/pcd/docs/api-reference/pcd-loader)             |       |
| [`PLYLoader`](modules/ply/docs/api-reference/ply-loader)             |       |
| [`TerrainLoader`](modules/terrain/docs/api-reference/terrain-loader) |       |

## Data Format

A single mesh is typically defined by a set of attributes, such as `positions`, `colors`, `normals` etc, as well as a draw mode.

The Pointcloud/Mesh loaders output mesh data in a common form that is optimized for use in WebGL frameworks:

- All attributes (and indices if present) are stored as typed arrays of the proper type.
- All attributes (and indices if present) are wrapped into glTF-style "accessor objects", e.g. `{size: 1-4, value: typedArray}`.
- Attribute names are mapped to glTF attribute names (on a best-effort basis).
- An `indices` field is added (only if present in the loaded geometry).
- A primitive drawing `mode` value is added (the numeric value matches WebGL constants, e.g `GL.TRIANGLES`).

| Field        | Type                | Contents                                                                                                    |
| ------------ | ------------------- | ----------------------------------------------------------------------------------------------------------- |
| `loaderData` | `Object` (Optional) | Loader and format specific data                                                                             |
| `header`     | `Object`            | See [Header](#header)                                                                                       |
| `mode`       | `Number`            | See [Mode](#mode)                                                                                           |
| `attributes` | `Object`            | Keys are [glTF attribute names](#gltf-attribute-name-mapping) and values are [accessor](#accessor) objects. |
| `indices`    | `Object` (Optional) | If present, describes the indices (elements) of the geometry as an [accessor](#accessor) object.            |

### Header

The `header` fields are only recommended at this point, applications can not assume they will be present:

| `header` Field | Type     | Contents |
| -------------- | -------- | -------- |
| `vertexCount`  | `Number` |          |

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
