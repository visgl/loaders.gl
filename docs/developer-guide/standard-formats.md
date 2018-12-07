# Standardized Formats


loaders.gl defines "categories" of loaders that load very similar data (e.g. point clouds). When it is reasonably easy to do so, loaders.gl converts the returned data in a standardized format for that category. This allows an application to support multiple formats with a single code path, since all the loaders will return similar data structures.

The returned data will be an object with a standardized payload, and a reference

| Field | Type | Contents |
| ---   | --- | --- |
| `loaderData` | `Object` | Optional: Loader implementation specific versions of the loaded data, such as e.g. original header fields, attribute names etc. Can correspond one-to-one with the data in the format itself, or be defined by the loader. |
| `header`       | `Object` | Standardized header information - can contain number of vertices, etc. |
| `...`          | `*` | Standardized data based on which category the loader conforms to |

> `loaderData` should not be considered stable between releases, since loaders.gl can choose to replace the underlying loader for performance or feature reasons.


## Mesh-and-Point-Cloud Category Conventions

Loaders such as `OBJ`, `PLY`, `PCD`, `LAZ` etc all effectively load a "mesh" consisting of a set of "attributes", perhaps `positions`, `colors`, `normals` etc. These attributes are all typed arrays containing successive values for each "vertex".

To allow the application to handle the returned attributes in a standardized way, some naming convention must be chosen. loaders.gl follows [glTF 2.0 recommendations](https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#geometry) for standard names.


| Field | Type | Contents |
| ---   | ---  | --- |
| `loaderData` | `Object` | Optional, format specific version of loaded data |
| `header`     | `Object` | See below |
| `mode`       | `Number` | Aligned with [OpenGL/glTF primitive types](https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#primitive) |
| `indices`      | `Uint32Array` \| `Uint16Array` | If supplied, contains the indices/elements typed array.
| `attributes`   | `Object` | Each key contains a typed array representing the contents of one attribute. Keys are named per [glTF 2.0 recommendations](https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#geometry). `POSITION` is expected to always be present. |
| `originalAttributes` | each key contains an attribute, with name as loaded, see `attributes`. |

> TBD: material support


The `header` fields are only recommended at this point, applications can not assume they will be present:

| `header` Field   | Type | Contents |
| ---              | ---  | --- |
| `vertexCount`    | `Number` | |
| `primitiveCount` | `Number` | |
| `instanceCount`  | `Number` | |


Primitive Modes are selected from the standard OpenGL list:

| Value | Primitive Mode |
| ---   | --- |
| `0`   | `POINTS` |
| `1`   | `LINES` |
| `2`   | `LINE_LOOP` |
| `3`   | `LINE_STRIP` |
| `4`   | `TRIANGLES` |
| `5`   | `TRIANGLE_STRIP` |
| `6`   | `TRIANGLE_FAN` |


Attributes are basically glTF accessor objects, with the bufferView resolved into a typed array:

| Accessors Fields | glTF?  | Type     | Contents |
| ---              | ---    | ---      | ---      |
| `bufferView`     | Yes    | typed array | binary buffer containing attribute values |
| `byteOffset`     | Yes    | `Number` | Currently always `0` |
| `count`          | Yes    | | |
| `type`           | Yes    | `SCALAR` etc | Number of components per vertex |
| `componentType`  | Yes    | | |
| `size`           | No     | 1-4         | Decoded number of components |
| `value`          | No     | `TypedArray` | Same as `bufferView`. Deprecated, duplicate for backwards luma.gl compatibility |


### Attribute Names

A loader will return a map of `attributes` with loaded attributes mapped on a best-effort basis to the following glTF-standardized names,. However, for efficiency reasons, a loader will not convert the format of a loaded attribute to match the glTF specifications (i.e. if normals were encoded using BYTES then that is what will be returned). Any such alignment needs to be done as a second step.

> TBD: If an attribute cannot be mapped, it will be ommitted from the standard attributes but can still be found in the `originalData` map

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



## Scenegraph Conventions

For bigger scenegraph-capable loaders (i.e. loaders that don't just load single meshes), loaders.gl currently focuses on glTF 2.0 support. It is assumed that other scenegraph loaders could convert their loaded data to a similar structure, essentially converting to glTF 2.0 on-the-fly as they load.
