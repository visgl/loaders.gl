## PointCloud and Mesh Category

Loaders such as `PCD`, `LAZ`, `PLY`, `OBJ` etc. all effectively load a "geometry" consisting of a set of "attributes", perhaps `positions`, `colors`, `normals` etc. These attributes are all typed arrays containing successive values for each "vertex".

The mesh loaders do the following to standardize the loaded mesh

* Provide a primitive drawing mode as a valid WebGL constant.
* Separate indices (elements) into a separate array
* Map all attributes and indices into a common accessor object format.
* Provide a map of [glTF 2.0 standard attribute names](https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#geometry) in case the application desires to convert the loaded data into a fully glTF-compatible mesh.


### PointCloud/Mesh Data Structure

| Field | Type       | Contents |
| ---   | ---        | --- |
| `loaderData`       | `Object` (Optional) | Loader and format specific data |
| `header`           | `Object` | See below |
| `mode`             | `Number` | Aligned with [OpenGL/glTF primitive types](https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#primitive) |
| `attributes`       | `Object` | Each key contains an "accessor" object representing the contents of one attribute. |
| `indices`          | `Uint32Array` `Uint16Array` | If supplied, contains the indices/elements typed array. |
| `glTFAttributeMap` | `Object` | Each key contains the name of a loaded attribute. |

Note that glTF attributes (keys in the `glTFAttributeMap`) are named per [glTF 2.0 recommendations](https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#geometry) with standardized, captilalized names.


### Header Object

The `header` fields are only recommended at this point, applications can not assume they will be present:

| `header` Field   | Type     | Contents |
| ---              | ---      | ---      |
| `vertexCount`    | `Number` |          |
| `primitiveCount` | `Number` |          |
| `instanceCount`  | `Number` |          |


### Primitive Mode

Primitive Modes are selected from the standard OpenGL list:

| Value | Primitive Mode   | Comment |
| ---   | ---              | --- |
| `0`   | `POINTS`         | Used for point cloud category data |
| `1`   | `LINES`          | Lines are rarely used due to limitations in GPU-based rendering |
| `2`   | `LINE_LOOP`      | - |
| `3`   | `LINE_STRIP`     | - |
| `4`   | `TRIANGLES`      | Used for most meshes. Indices attributes are often used to reuse vertex data in remaining attributes |
| `5`   | `TRIANGLE_STRIP` | - |
| `6`   | `TRIANGLE_FAN`   | - |


### Accessors

`attributes` and `indices` are represented by glTF "accessor objects" with the binary data for that attribute resolved into a typed array of the proper type.

| Accessors Fields | glTF?  | Type         | Contents |
| ---              | ---    | ---          | ---      |
| `bufferView`     | Yes    | N/A          | Not available. Instead, the loaded binary data will be located in the `value` field. |
| `byteOffset`     | Yes    | `Number`     | Starting offset into the bufferView. Currently always `0` |
| `count`          | Yes    | `Number`     | The number of elements/vertices in the attribute data |
| `type`           | Yes    | `SCALAR`...  | Number of components per vertex, encoded using glTF2 strings |
| `componentType`  | Yes    | `Number`     | Type of component as GL constant (FLOAT, BYTE etc) |
| `size`           | No     | `1`-`4`      | Decoded "type". i.e. number of components |
| `value`          | No     | `TypedArray` | Contains the typed array (corresponds to `bufferView`). The type of the array will match the GL constant in `componentType`. |
| `glTFName`       | No     | `String` (Optional) | The glTF name corresponding to this attribute. If the attribute could not be matched to an existing glTF name, this field will be omitted or `undefined`. |
| `originalName`   | No     | `String` (Optional) | If the indices were a named attribute in the original mesh, the original name will be made available here. |


### Material support

> Material support is only provided by some mesh formats and is still TBD.


### GLTF Attribute Names

A mesh loader will attempt to map loaded attributes with glTF standard attribute names on a best-effort basis. When it can map an attribute, it will add the `glTFName` field to the attribute, and add that attribute name to the `glTFAttributeMap` field.

This allows an application to quickly generate a new glTF compatible map attribute accessor objects.

| Name | Accessor Type(s) | Component Type(s) | Description |
| ---- | ---------------- | ----------------- | ----------- |
| `POSITION`   | `"VEC3"` | `5126`&nbsp;(FLOAT) | XYZ vertex positions |
| `NORMAL`     | `"VEC3"` | `5126`&nbsp;(FLOAT) | Normalized XYZ vertex normals |
| `TANGENT`    | `"VEC4"` | `5126`&nbsp;(FLOAT) | XYZW vertex tangents where the *w* component is a sign value (-1 or +1) indicating handedness of the tangent basis |
| `TEXCOORD_0` | `"VEC2"` | `5126`&nbsp;(FLOAT)<br>`5121`&nbsp;(UNSIGNED_BYTE)&nbsp;normalized<br>`5123`&nbsp;(UNSIGNED_SHORT)&nbsp;normalized | UV texture coordinates for the first set |
| `TEXCOORD_1` | `"VEC2"` | `5126`&nbsp;(FLOAT)<br>`5121`&nbsp;(UNSIGNED_BYTE)&nbsp;normalized<br>`5123`&nbsp;(UNSIGNED_SHORT)&nbsp;normalized | UV texture coordinates for the second set |
| `COLOR_0`    | `"VEC3"`<br>`"VEC4"` | `5126`&nbsp;(FLOAT)<br>`5121`&nbsp;(UNSIGNED_BYTE)&nbsp;normalized<br>`5123`&nbsp;(UNSIGNED_SHORT)&nbsp;normalized | RGB or RGBA vertex color |
| `JOINTS_0`   | `"VEC4"` | `5121`&nbsp;(UNSIGNED_BYTE)<br>`5123`&nbsp;(UNSIGNED_SHORT) | See [Skinned Mesh Attributes](#skinned-mesh-attributes) |
| `WEIGHTS_0`  | `"VEC4"` | `5126`&nbsp;(FLOAT)<br>`5121`&nbsp;(UNSIGNED_BYTE)&nbsp;normalized<br>`5123`&nbsp;(UNSIGNED_SHORT)&nbsp;normalized| See [Skinned Mesh Attributes](#skinned-mesh-attributes) |

> Note that for efficiency reasons, a loader will not convert the format of an attribute's binary data to match the glTF specifications (i.e. if normals were encoded using BYTES then that is what will be returned even though glTF calls out for FLOAT32). Any such alignment needs to be done by the application as a second step.



## Scenegraph Conventions

For bigger scenegraph-capable loaders (i.e. loaders that don't just load single meshes), loaders.gl currently focuses on glTF 2.0 support. It is assumed that other scenegraph loaders could convert their loaded data to a similar structure, essentially converting to glTF 2.0 on-the-fly as they load.
