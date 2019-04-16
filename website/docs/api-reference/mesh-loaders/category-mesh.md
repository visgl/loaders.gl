## PointCloud and Mesh Category

Loaders such as `PCD`, `LAZ`, `PLY`, `OBJ` etc. all load a "single geometry primitive" consisting of a set of "attributes", perhaps `positions`, `colors`, `normals` etc. These attributes are all typed arrays containing successive values for each "vertex".

The mesh loaders do the following to standardize the loaded mesh

- Provide a primitive drawing `mode` (the numeric values matches the corresponding WebGL constants).
- Unpacks attributes (and indices if present) into typed arrays.
- Wrap all attributes (and indices if present) into common "accessor objects": `{size: 1-4, value: typedArray}`.
- Maps known attribute names to glTF attribute names.
- Add `indices` field to the result (only if indices are present in the loaded geometry).

### PointCloud/Mesh Data Structure

| Field        | Type                | Contents                                                                                                                 |
| ------------ | ------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `loaderData` | `Object` (Optional) | Loader and format specific data                                                                                          |
| `header`     | `Object`            | See below                                                                                                                |
| `mode`       | `Number`            | Aligned with [OpenGL/glTF primitive types](https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#primitive) |
| `attributes` | `Object`            | Each key contains an "accessor" object representing the contents of one attribute.                                       |
| `indices`    | `Object` (Optional) | If present, contains the indices (elements) typed array (`Uint32Array` or `Uint16Array`).                                |

Note that glTF attributes (keys in the `glTFAttributeMap`) are named per [glTF 2.0 recommendations](https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#geometry) with standardized, captilalized names.

### Header Object

The `header` fields are only recommended at this point, applications can not assume they will be present:

| `header` Field | Type     | Contents |
| -------------- | -------- | -------- |
| `vertexCount`  | `Number` |          |

### Primitive Mode

Primitive modes are the usual standard WebGL/OpenGL constants:

| Value | Primitive Mode   | Comment                                                                                              |
| ----- | ---------------- | ---------------------------------------------------------------------------------------------------- |
| `0`   | `POINTS`         | Used for point cloud category data                                                                   |
| `1`   | `LINES`          | Lines are rarely used due to limitations in GPU-based rendering                                      |
| `2`   | `LINE_LOOP`      | -                                                                                                    |
| `3`   | `LINE_STRIP`     | -                                                                                                    |
| `4`   | `TRIANGLES`      | Used for most meshes. Indices attributes are often used to reuse vertex data in remaining attributes |
| `5`   | `TRIANGLE_STRIP` | -                                                                                                    |
| `6`   | `TRIANGLE_FAN`   | -                                                                                                    |

### Accessors

`attributes` and `indices` are represented by glTF "accessor objects" with the binary data for that attribute resolved into a typed array of the proper type.

| Accessors Fields | glTF? | Type                | Contents                                                                                                                                           |
| ---------------- | ----- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`          | No    | `TypedArray`        | Contains the typed array (corresponds to `bufferView`). The type of the array will match the GL constant in `componentType`.                       |
| `size`           | No    | `1`-`4`             | Decoded "type". i.e. number of components                                                                                                          |
| `byteOffset`     | Yes   | `Number`            | Starting offset into the bufferView. Currently always `0`                                                                                          |
| `count`          | Yes   | `Number`            | The number of elements/vertices in the attribute data                                                                                              |
| `originalName`   | No    | `String` (Optional) | If this was a named attribute in the original file, the original name (before substitution with glTF attribute names) will be made available here. |

### GLTF Attribute Name Mapping

Also, to help applications manage attribute name differences between various formats, mesh loaders map known attribute names to [glTF 2.0 standard attribute names](https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#geometry) a best-effort basis.

When a loader can map an attribute name, it will replace ir with the glTF equivalent. This allows applications to use common code to handle meshes and point clouds from different formats.

| Name         | Accessor Type(s)     | Component Type(s)                                                                                                  | Description                                                                                                        |
| ------------ | -------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `POSITION`   | `"VEC3"`             | `5126`&nbsp;(FLOAT)                                                                                                | XYZ vertex positions                                                                                               |
| `NORMAL`     | `"VEC3"`             | `5126`&nbsp;(FLOAT)                                                                                                | Normalized XYZ vertex normals                                                                                      |
| `TANGENT`    | `"VEC4"`             | `5126`&nbsp;(FLOAT)                                                                                                | XYZW vertex tangents where the _w_ component is a sign value (-1 or +1) indicating handedness of the tangent basis |
| `TEXCOORD_0` | `"VEC2"`             | `5126`&nbsp;(FLOAT)<br>`5121`&nbsp;(UNSIGNED_BYTE)&nbsp;normalized<br>`5123`&nbsp;(UNSIGNED_SHORT)&nbsp;normalized | UV texture coordinates for the first set                                                                           |
| `TEXCOORD_1` | `"VEC2"`             | `5126`&nbsp;(FLOAT)<br>`5121`&nbsp;(UNSIGNED_BYTE)&nbsp;normalized<br>`5123`&nbsp;(UNSIGNED_SHORT)&nbsp;normalized | UV texture coordinates for the second set                                                                          |
| `COLOR_0`    | `"VEC3"`<br>`"VEC4"` | `5126`&nbsp;(FLOAT)<br>`5121`&nbsp;(UNSIGNED_BYTE)&nbsp;normalized<br>`5123`&nbsp;(UNSIGNED_SHORT)&nbsp;normalized | RGB or RGBA vertex color                                                                                           |
| `JOINTS_0`   | `"VEC4"`             | `5121`&nbsp;(UNSIGNED_BYTE)<br>`5123`&nbsp;(UNSIGNED_SHORT)                                                        | See [Skinned Mesh Attributes](#skinned-mesh-attributes)                                                            |
| `WEIGHTS_0`  | `"VEC4"`             | `5126`&nbsp;(FLOAT)<br>`5121`&nbsp;(UNSIGNED_BYTE)&nbsp;normalized<br>`5123`&nbsp;(UNSIGNED_SHORT)&nbsp;normalized | See [Skinned Mesh Attributes](#skinned-mesh-attributes)                                                            |

> Note that for efficiency reasons, mesh loaders are not required to convert the format of an attribute's binary data to match the glTF specifications (i.e. if normals were encoded using BYTES then that is what will be returned even though glTF calls out for FLOAT32). Any such alignment needs to be done by the application as a second step.

## Scenegraph Format Support

For more complex, scenegraph-type formats (i.e. formats that don't just contain single geometric primitives), loaders.gl currently focuses on glTF 2.0 support.

It is assumed that other scenegraph-type format loaders (e.g. a hyptothetical COLLADA loader) could convert their loaded data to a similar structure, essentially converting to glTF 2.0 on-the-fly as they load.

For now it is best to convert such assets off-line to glTF before attempting to loade them with loaders.gl.

### Material support

Material support is provided by some mesh formats (e.g. OBJ/MTL) and is currently not implemented by loaders.gl, however the glTF loader has full support for PBR (Physically-Based Rendering) materials.
