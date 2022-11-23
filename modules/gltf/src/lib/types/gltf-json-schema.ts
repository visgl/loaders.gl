// Types forked from https://github.com/bwasty/gltf-loader-ts under MIT license
// Generated from official JSON schema using `npm run generate-interface` on 2018-02-24

export type GLTFId = number;

/**
 * Indices of those attributes that deviate from their initialization value.
 */
export interface AccessorSparseIndices {
  /**
   * The index of the bufferView with sparse indices. Referenced bufferView can't have ARRAY_BUFFER or ELEMENT_ARRAY_BUFFER target.
   */
  bufferView: GLTFId;
  /**
   * The offset relative to the start of the bufferView in bytes. Must be aligned.
   */
  byteOffset?: number;
  /**
   * The indices data type.
   */
  componentType: 5121 | 5123 | 5125 | number;
  extensions?: any;
  extras?: any;
  // [k: string]: any;
}

/**
 * Array of size `accessor.sparse.count` times number of components storing the displaced accessor attributes pointed by `accessor.sparse.indices`.
 */
export interface AccessorSparseValues {
  /**
   * The index of the bufferView with sparse values. Referenced bufferView can't have ARRAY_BUFFER or ELEMENT_ARRAY_BUFFER target.
   */
  bufferView: GLTFId;
  /**
   * The offset relative to the start of the bufferView in bytes. Must be aligned.
   */
  byteOffset?: number;
  extensions?: any;
  extras?: any;
  // [k: string]: any;
}

/**
 * Sparse storage of attributes that deviate from their initialization value.
 */
export interface AccessorSparse {
  /**
   * Number of entries stored in the sparse array.
   */
  count: number;
  /**
   * Index array of size `count` that points to those accessor attributes that deviate from their initialization value. Indices must strictly increase.
   */
  indices: AccessorSparseIndices;
  /**
   * Array of size `count` times number of components, storing the displaced accessor attributes pointed by `indices`. Substituted values must have the same `componentType` and number of components as the base accessor.
   */
  values: AccessorSparseValues;
  extensions?: any;
  extras?: any;
  // [k: string]: any;
}

/**
 * A typed view into a bufferView.  A bufferView contains raw binary data.  An accessor provides a typed view into a bufferView or a subset of a bufferView similar to how WebGL's `vertexAttribPointer()` defines an attribute in a buffer.
 */
export interface Accessor {
  /**
   * The index of the bufferView.
   */
  bufferView?: GLTFId;
  /**
   * The offset relative to the start of the bufferView in bytes.
   */
  byteOffset?: number;
  /**
   * The datatype of components in the attribute.
   */
  componentType: 5120 | 5121 | 5122 | 5123 | 5125 | 5126 | number;
  /**
   * Specifies whether integer data values should be normalized.
   */
  normalized?: boolean;
  /**
   * The number of attributes referenced by this accessor.
   */
  count: number;
  /**
   * Specifies if the attribute is a scalar, vector, or matrix.
   */
  type: 'SCALAR' | 'VEC2' | 'VEC3' | 'VEC4' | 'MAT2' | 'MAT3' | 'MAT4' | string;
  /**
   * Maximum value of each component in this attribute.
   */
  max?: number[];
  /**
   * Minimum value of each component in this attribute.
   */
  min?: number[];
  /**
   * Sparse storage of attributes that deviate from their initialization value.
   */
  sparse?: AccessorSparse;
  name?: any;
  extensions?: any;
  extras?: any;
  // [k: string]: any;
}

/**
 * The index of the node and TRS property that an animation channel targets.
 */
export interface AnimationChannelTarget {
  /**
   * The index of the node to target.
   */
  node?: GLTFId;
  /**
   * The name of the node's TRS property to modify, or the "weights" of the Morph Targets it instantiates. For the "translation" property, the values that are provided by the sampler are the translation along the x, y, and z axes. For the "rotation" property, the values are a quaternion in the order (x, y, z, w), where w is the scalar. For the "scale" property, the values are the scaling factors along the x, y, and z axes.
   */
  path: 'translation' | 'rotation' | 'scale' | 'weights' | string;
  extensions?: any;
  extras?: any;
  // [k: string]: any;
}

/**
 * Targets an animation's sampler at a node's property.
 */
export interface AnimationChannel {
  /**
   * The index of a sampler in this animation used to compute the value for the target.
   */
  sampler: GLTFId;
  /**
   * The index of the node and TRS property to target.
   */
  target: AnimationChannelTarget;
  extensions?: any;
  extras?: any;
  // [k: string]: any;
}

/**
 * Combines input and output accessors with an interpolation algorithm to define a keyframe graph (but not its target).
 */
export interface AnimationSampler {
  /**
   * The index of an accessor containing keyframe input values, e.g., time.
   */
  input: GLTFId;
  /**
   * Interpolation algorithm.
   */
  interpolation?: 'LINEAR' | 'STEP' | 'CUBICSPLINE' | string;
  /**
   * The index of an accessor, containing keyframe output values.
   */
  output: GLTFId;
  extensions?: any;
  extras?: any;
  // [k: string]: any;
}

/**
 * A keyframe animation.
 */
export interface Animation {
  /**
   * An array of channels, each of which targets an animation's sampler at a node's property. Different channels of the same animation can't have equal targets.
   */
  channels: AnimationChannel[];
  /**
   * An array of samplers that combines input and output accessors with an interpolation algorithm to define a keyframe graph (but not its target).
   */
  samplers: AnimationSampler[];
  name?: any;
  extensions?: any;
  extras?: any;
  // [k: string]: any;
}

/**
 * Metadata about the glTF asset.
 */
export interface Asset {
  /**
   * A copyright message suitable for display to credit the content creator.
   */
  copyright?: string;
  /**
   * Tool that generated this glTF model.  Useful for debugging.
   */
  generator?: string;
  /**
   * The glTF version that this asset targets.
   */
  version: string;
  /**
   * The minimum glTF version that this asset targets.
   */
  minVersion?: string;
  extensions?: any;
  extras?: any;
  // [k: string]: any;
}

/**
 * A buffer points to binary geometry, animation, or skins.
 */
export interface Buffer {
  /**
   * The uri of the buffer.
   */
  uri?: string;
  /**
   * The length of the buffer in bytes.
   */
  byteLength: number;
  name?: any;
  extensions?: any;
  extras?: any;
  // [k: string]: any;
}

/**
 * A view into a buffer generally representing a subset of the buffer.
 */
export interface BufferView {
  /**
   * The index of the buffer.
   */
  buffer: GLTFId;
  /**
   * The offset into the buffer in bytes.
   */
  byteOffset?: number;
  /**
   * The length of the bufferView in bytes.
   */
  byteLength: number;
  /**
   * The stride, in bytes.
   */
  byteStride?: number;
  /**
   * The target that the GPU buffer should be bound to.
   */
  target?: 34962 | 34963 | number;
  name?: any;
  extensions?: any;
  extras?: any;
  // [k: string]: any;
}

/**
 * An orthographic camera containing properties to create an orthographic projection matrix.
 */
export interface CameraOrthographic {
  /**
   * The floating-point horizontal magnification of the view. Must not be zero.
   */
  xmag: number;
  /**
   * The floating-point vertical magnification of the view. Must not be zero.
   */
  ymag: number;
  /**
   * The floating-point distance to the far clipping plane. `zfar` must be greater than `znear`.
   */
  zfar: number;
  /**
   * The floating-point distance to the near clipping plane.
   */
  znear: number;
  extensions?: any;
  extras?: any;
  // [k: string]: any;
}

/**
 * A perspective camera containing properties to create a perspective projection matrix.
 */
export interface CameraPerspective {
  /**
   * The floating-point aspect ratio of the field of view.
   */
  aspectRatio?: number;
  /**
   * The floating-point vertical field of view in radians.
   */
  yfov: number;
  /**
   * The floating-point distance to the far clipping plane.
   */
  zfar?: number;
  /**
   * The floating-point distance to the near clipping plane.
   */
  znear: number;
  extensions?: any;
  extras?: any;
  // [k: string]: any;
}

/**
 * A camera's projection.  A node can reference a camera to apply a transform to place the camera in the scene.
 */
export interface Camera {
  /**
   * An orthographic camera containing properties to create an orthographic projection matrix.
   */
  orthographic?: CameraOrthographic;
  /**
   * A perspective camera containing properties to create a perspective projection matrix.
   */
  perspective?: CameraPerspective;
  /**
   * Specifies if the camera uses a perspective or orthographic projection.
   */
  type: 'perspective' | 'orthographic' | string;
  name?: any;
  extensions?: any;
  extras?: any;
  // [k: string]: any;
}

/**
 * Image data used to create a texture. Image can be referenced by URI or `bufferView` index. `mimeType` is required in the latter case.
 */
export interface Image {
  /**
   * The uri of the image.
   */
  uri?: string;
  /**
   * The image's MIME type.
   */
  mimeType?: 'image/jpeg' | 'image/png' | string;
  /**
   * The index of the bufferView that contains the image. Use this instead of the image's uri property.
   */
  bufferView?: GLTFId;
  name?: any;
  extensions?: any;
  extras?: any;
  // [k: string]: any;
}

/**
 * Reference to a texture.
 */
export interface TextureInfo {
  /**
   * The index of the texture.
   */
  index: GLTFId;
  /**
   * The set index of texture's TEXCOORD attribute used for texture coordinate mapping.
   */
  texCoord?: number;
  extensions?: any;
  extras?: any;
  // [k: string]: any;
}

/**
 * A set of parameter values that are used to define the metallic-roughness material model from Physically-Based Rendering (PBR) methodology.
 */
export interface MaterialPbrMetallicRoughness {
  /**
   * The material's base color factor.
   */
  baseColorFactor?: number[];
  /**
   * The base color texture.
   */
  baseColorTexture?: TextureInfo;
  /**
   * The metalness of the material.
   */
  metallicFactor?: number;
  /**
   * The roughness of the material.
   */
  roughnessFactor?: number;
  /**
   * The metallic-roughness texture.
   */
  metallicRoughnessTexture?: TextureInfo;
  extensions?: any;
  extras?: any;
  // [k: string]: any;
}
export interface MaterialNormalTextureInfo {
  index: any;
  texCoord?: any;
  /**
   * The scalar multiplier applied to each normal vector of the normal texture.
   */
  scale?: number;
  extensions?: any;
  extras?: any;
  // [k: string]: any;
}
export interface MaterialOcclusionTextureInfo {
  index: any;
  texCoord?: any;
  /**
   * A scalar multiplier controlling the amount of occlusion applied.
   */
  strength?: number;
  extensions?: any;
  extras?: any;
  // [k: string]: any;
}

/**
 * The material appearance of a primitive.
 */
export interface Material {
  name?: any;
  extensions?: any;
  extras?: any;
  /**
   * A set of parameter values that are used to define the metallic-roughness material model from Physically-Based Rendering (PBR) methodology. When not specified, all the default values of `pbrMetallicRoughness` apply.
   */
  pbrMetallicRoughness?: MaterialPbrMetallicRoughness;
  /**
   * The normal map texture.
   */
  normalTexture?: MaterialNormalTextureInfo;
  /**
   * The occlusion map texture.
   */
  occlusionTexture?: MaterialOcclusionTextureInfo;
  /**
   * The emissive map texture.
   */
  emissiveTexture?: TextureInfo;
  /**
   * The emissive color of the material.
   */
  emissiveFactor?: number[];
  /**
   * The alpha rendering mode of the material.
   */
  alphaMode?: 'OPAQUE' | 'MASK' | 'BLEND' | string;
  /**
   * The alpha cutoff value of the material.
   */
  alphaCutoff?: number;
  /**
   * Specifies whether the material is double sided.
   */
  doubleSided?: boolean;
  // [k: string]: any;
}

/**
 * Geometry to be rendered with the given material.
 */
export interface MeshPrimitive {
  /**
   * A dictionary object, where each key corresponds to mesh attribute semantic and each value is the index of the accessor containing attribute's data.
   */
  attributes: {
    [k: string]: GLTFId;
  };
  /**
   * The index of the accessor that contains the indices.
   */
  indices?: GLTFId;
  /**
   * The index of the material to apply to this primitive when rendering.
   */
  material?: GLTFId;
  /**
   * The type of primitives to render.
   */
  mode?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | number;
  /**
   * An array of Morph Targets, each  Morph Target is a dictionary mapping attributes (only `POSITION`, `NORMAL`, and `TANGENT` supported) to their deviations in the Morph Target.
   */
  targets?: {
    [k: string]: GLTFId;
  }[];
  extensions?: any;
  extras?: any;
  // [k: string]: any;
}

/**
 * A set of primitives to be rendered.  A node can contain one mesh.  A node's transform places the mesh in the scene.
 */

export interface Mesh {
  id?: string;
  /**
   * An array of primitives, each defining geometry to be rendered with a material.
   */
  primitives: MeshPrimitive[];
  /**
   * Array of weights to be applied to the Morph Targets.
   */
  weights?: number[];
  name?: any;
  extensions?: any;
  extras?: any;
  // [k: string]: any;
}

/**
 * A node in the node hierarchy.  When the node contains `skin`, all `mesh.primitives` must contain `JOINTS_0` and `WEIGHTS_0` attributes.  A node can have either a `matrix` or any combination of `translation`/`rotation`/`scale` (TRS) properties. TRS properties are converted to matrices and postmultiplied in the `T * R * S` order to compose the transformation matrix; first the scale is applied to the vertices, then the rotation, and then the translation. If none are provided, the transform is the identity. When a node is targeted for animation (referenced by an animation.channel.target), only TRS properties may be present; `matrix` will not be present.
 */
export interface Node {
  /**
   * The index of the camera referenced by this node.
   */
  camera?: GLTFId;
  /**
   * The indices of this node's children.
   */
  children?: GLTFId[];
  /**
   * The index of the skin referenced by this node.
   */
  skin?: GLTFId;
  /**
   * A floating-point 4x4 transformation matrix stored in column-major order.
   */
  matrix?: number[];
  /**
   * The index of the mesh in this node.
   */
  mesh?: GLTFId;
  /**
   * The node's unit quaternion rotation in the order (x, y, z, w), where w is the scalar.
   */
  rotation?: number[];
  /**
   * The node's non-uniform scale, given as the scaling factors along the x, y, and z axes.
   */
  scale?: number[];
  /**
   * The node's translation along the x, y, and z axes.
   */
  translation?: number[];
  /**
   * The weights of the instantiated Morph Target. Number of elements must match number of Morph Targets of used mesh.
   */
  weights?: number[];
  name?: any;
  extensions?: any;
  extras?: any;
  // [k: string]: any;
}

/**
 * Texture sampler properties for filtering and wrapping modes.
 */
export interface Sampler {
  /**
   * Magnification filter.
   */
  magFilter?: 9728 | 9729 | number;
  /**
   * Minification filter.
   */
  minFilter?: 9728 | 9729 | 9984 | 9985 | 9986 | 9987 | number;
  /**
   * s wrapping mode.
   */
  wrapS?: 33071 | 33648 | 10497 | number;
  /**
   * t wrapping mode.
   */
  wrapT?: 33071 | 33648 | 10497 | number;
  name?: any;
  extensions?: any;
  extras?: any;
  // [k: string]: any;
}

/**
 * The root nodes of a scene.
 */
export interface Scene {
  /**
   * The indices of each root node.
   */
  nodes?: GLTFId[];
  name?: any;
  extensions?: any;
  extras?: any;
  // [k: string]: any;
}

/**
 * Joints and matrices defining a skin.
 */
export interface Skin {
  /**
   * The index of the accessor containing the floating-point 4x4 inverse-bind matrices.  The default is that each matrix is a 4x4 identity matrix, which implies that inverse-bind matrices were pre-applied.
   */
  inverseBindMatrices?: GLTFId;
  /**
   * The index of the node used as a skeleton root. When undefined, joints transforms resolve to scene root.
   */
  skeleton?: GLTFId;
  /**
   * Indices of skeleton nodes, used as joints in this skin.
   */
  joints: GLTFId[];
  name?: any;
  extensions?: any;
  extras?: any;
  // [k: string]: any;
}

/**
 * A texture and its sampler.
 */
export interface Texture {
  /**
   * The index of the sampler used by this texture. When undefined, a sampler with repeat wrapping and auto filtering should be used.
   */
  sampler?: GLTFId;
  /**
   * The index of the image used by this texture.
   */
  source?: GLTFId;
  name?: any;
  extensions?: any;
  extras?: any;
  // [k: string]: any;
}

/**
 * The root object for a glTF asset.
 */
export interface GLTF {
  /**
   * Names of glTF extensions used somewhere in this asset.
   */
  extensionsUsed?: string[];
  /**
   * Names of glTF extensions required to properly load this asset.
   */
  extensionsRequired?: string[];
  /**
   * An array of accessors.
   */
  accessors?: Accessor[];
  /**
   * An array of keyframe animations.
   */
  animations?: Animation[];
  /**
   * Metadata about the glTF asset.
   */
  asset: Asset;
  /**
   * An array of buffers.
   */
  buffers?: Buffer[];
  /**
   * An array of bufferViews.
   */
  bufferViews?: BufferView[];
  /**
   * An array of cameras.
   */
  cameras?: Camera[];
  /**
   * An array of images.
   */
  images?: Image[];
  /**
   * An array of materials.
   */
  materials?: Material[];
  /**
   * An array of meshes.
   */
  meshes?: Mesh[];
  /**
   * An array of nodes.
   */
  nodes?: Node[];
  /**
   * An array of samplers.
   */
  samplers?: Sampler[];
  /**
   * The index of the default scene.
   */
  scene?: GLTFId;
  /**
   * An array of scenes.
   */
  scenes?: Scene[];
  /**
   * An array of skins.
   */
  skins?: Skin[];
  /**
   * An array of textures.
   */
  textures?: Texture[];
  extensions?: unknown;
  extras?: unknown;
  [k: string]: unknown;
}

// GLTF Extensions
/* eslint-disable camelcase */

/**
 * @see https://github.com/KhronosGroup/glTF/tree/master/extensions/1.0/Khronos/KHR_binary_glTF
 * TODO - this can be used on both images and shaders
 */
export type GLTF_KHR_binary_glTF = {
  bufferView: number;
  // required for images but not shaders
  mimeType?: string;
  height?: number;
  width?: number;
  extras?: any;
};

/**
 * @see https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_draco_mesh_compression
 */
export type GLTF_KHR_draco_mesh_compression = {
  bufferView: GLTFId;
  attributes: {[name: string]: number};
  extras?: any;
};

/**
 * @see https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_texture_basisu
 */
export type GLTF_KHR_texture_basisu = {
  source: GLTFId;
  extras?: any;
};

/**
 * @see https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/EXT_meshopt_compression
 * buffer: number; //	The index of the buffer with compressed data.	✅ Required
 * byteOffset	integer	The offset into the buffer in bytes.	Default: 0
 * byteLength	integer	The length of the compressed data in bytes.	✅ Required
 * byteStride	integer	The stride, in bytes.	✅ Required
 * count	integer	The number of elements.	✅ Required
 * mode	string	The compression mode.	✅ Required
 * filter	string	The compression filter.	Default: "NONE"
 */
export type GLTF_EXT_meshopt_compression = {
  buffer: number;
  byteOffset?: number;
  byteLength: number;
  byteStride: number;
  count: number;
  mode: 'ATTRIBUTES' | 'TRIANGLES' | 'INDICES';
  filter?: 'NONE' | 'OCTAHEDRAL' | 'QUATERNION' | 'EXPONENTIAL';
  extras?: any;
};

/**
 * @see https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/EXT_texture_webp
 */
export type GLTF_EXT_texture_webp = {
  source: GLTFId;
  extras?: any;
};

/**
 * @see https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/MSFT_texture_dds
 */
export type GLTF_MSFT_texture_dds = {
  source: GLTFId;
  extras?: any;
};

/**
 * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata#gltf-extension-1
 */
export type GLTF_EXT_feature_metadata = {
  /** An object defining classes and enums. */
  schema?: ExtFeatureMetadataSchema;
  /** A uri to an external schema file. */
  schemaUri?: string;
  /** An object containing statistics about features. */
  statistics?: Statistics;
  /** A dictionary, where each key is a feature table ID and each value is an object defining the feature table. */
  featureTables?: {
    [key: string]: EXT_feature_metadata_feature_table;
  };
  /** A dictionary, where each key is a feature texture ID and each value is an object defining the feature texture. */
  featureTextures?: {
    [key: string]: FeatureTexture;
  };
  extensions?: any;
  extras?: any;
  [key: string]: any;
};

/**
 * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata#schema
 */
type ExtFeatureMetadataSchema = {
  /** The name of the schema. */
  name?: string;
  /** The description of the schema. */
  description?: string;
  /** Application-specific version of the schema. */
  version?: string;
  /** A dictionary, where each key is a class ID and each value is an object defining the class. */
  classes?: {
    [key: string]: EXT_feature_metadata_class_object;
  };
  /** A dictionary, where each key is an enum ID and each value is an object defining the values for the enum. */
  enums?: {
    [key: string]: ExtFeatureMetadataEnum;
  };
  extensions?: any;
  extras?: any;
  [key: string]: any;
};

/**
 * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata#class
 */
export type EXT_feature_metadata_class_object = {
  /** The name of the class, e.g. for display purposes. */
  name?: string;
  /** The description of the class. */
  description?: string;
  /** A dictionary, where each key is a property ID and each value is an object defining the property. */
  properties: {
    [key: string]: ClassProperty;
  };
  extensions?: any;
  extras?: any;
  [key: string]: any;
};

/**
 * https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata#class-property
 */
export type ClassProperty = {
  /** The name of the property, e.g. for display purposes. */
  name?: string;
  /** The description of the property. */
  description?: string;
  /**
   * The property type. If ENUM is used, then enumType must also be specified.
   * If ARRAY is used, then componentType must also be specified.
   * ARRAY is a fixed-length array when componentCount is defined, and variable-length otherwise.
   */
  type: ClassPropertyType;
  /**
   * An enum ID as declared in the enums dictionary.
   * This value must be specified when type or componentType is ENUM.
   */
  enumType?: string;
  /**
   * When type is ARRAY this indicates the type of each component of the array.
   * If ENUM is used, then enumType must also be specified.
   */
  componentType?:
    | 'INT8'
    | 'UINT8'
    | 'INT16'
    | 'UINT16'
    | 'INT32'
    | 'UINT32'
    | 'INT64'
    | 'UINT64'
    | 'FLOAT32'
    | 'FLOAT64'
    | 'BOOLEAN'
    | 'STRING'
    | 'ENUM';
  /** The number of components per element for ARRAY elements. */
  componentCount?: number;
  /**
   * Specifies whether integer values are normalized.
   * This applies both when type is an integer type, or when type is ARRAY with a componentType that is an integer type.
   * For unsigned integer types, values are normalized between [0.0, 1.0].
   * For signed integer types, values are normalized between [-1.0, 1.0].
   * For all other types, this property is ignored.
   */
  normalized: boolean;
  /**
   * Maximum allowed values for property values.
   * Only applicable for numeric types and fixed-length arrays of numeric types.
   * For numeric types this is a single number.
   * For fixed-length arrays this is an array with componentCount number of elements.
   * The normalized property has no effect on these values: they always correspond to the integer values.
   */
  max?: number | number[];
  /**
   * Minimum allowed values for property values.
   * Only applicable for numeric types and fixed-length arrays of numeric types.
   * For numeric types this is a single number.
   * For fixed-length arrays this is an array with componentCount number of elements.
   * The normalized property has no effect on these values: they always correspond to the integer values.
   */
  min?: number | number[];

  /**
   * A default value to use when the property value is not defined.
   * If used, optional must be set to true.
   * The type of the default value must match the property definition: For BOOLEAN use true or false.
   * For STRING use a JSON string. For a numeric type use a JSON number.
   * For ENUM use the enum name, not the integer value.
   * For ARRAY use a JSON array containing values matching the componentType.
   */
  default?: boolean | number | string | number[];
  /** If true, this property is optional. */
  optional?: boolean; // default false;
  /**
   * An identifier that describes how this property should be interpreted.
   * The semantic cannot be used by other properties in the class.
   */
  semantic?: string;
  extensions?: any;
  extras?: any;
  [key: string]: any;
};

/**
 * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata#classpropertytype
 */
type ClassPropertyType =
  | 'INT8'
  | 'UINT8'
  | 'INT16'
  | 'UINT16'
  | 'INT32'
  | 'UINT32'
  | 'INT64'
  | 'UINT64'
  | 'FLOAT32'
  | 'FLOAT64'
  | 'BOOLEAN'
  | 'STRING'
  | 'ENUM'
  | 'ARRAY';

/**
 * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata#enum
 */
type ExtFeatureMetadataEnum = {
  /** The name of the enum, e.g. for display purposes. */
  name?: string;
  /** The description of the enum. */
  description?: string;
  /** The type of the integer enum value. */
  valueType?: 'INT8' | 'UINT8' | 'INT16' | 'UINT16' | 'INT32' | 'UINT32' | 'INT64' | 'UINT64'; // default: "UINT16"
  /** An array of enum values. Duplicate names or duplicate integer values are not allowed. */
  values: EnumValue[];
  extensions?: any;
  extras?: any;
  [key: string]: any;
};

/**
 * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata#enum-value
 */
type EnumValue = {
  /** The name of the enum value. */
  name: string;
  /** The description of the enum value. */
  description?: string;
  /** The integer enum value. */
  value: number; // default: "UINT16"
  extensions?: any;
  extras?: any;
  [key: string]: any;
};

/**
 * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata#feature-table
 */
export type EXT_feature_metadata_feature_table = {
  featureTable: any;
  /** The class that property values conform to. The value must be a class ID declared in the classes dictionary. */
  class?: string;
  /** The number of features, as well as the number of elements in each property array. */
  count: number;
  /**
   * A dictionary, where each key corresponds to a property ID in the class properties dictionary
   * and each value is an object describing where property values are stored.
   * Optional properties may be excluded from this dictionary.
   */
  properties?: {
    [key: string]: FeatureTableProperty;
  };
  extensions?: any;
  extras?: any;
  [key: string]: any;
};

/**
 * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata#feature-table-property
 */
export type FeatureTableProperty = {
  /**
   * The index of the buffer view containing property values.
   * The data type of property values is determined by the property definition:
   * When type is BOOLEAN values are packed into a bitfield.
   * When type is STRING values are stored as byte sequences and decoded as UTF-8 strings.
   * When type is a numeric type values are stored as the provided type.
   * When type is ENUM values are stored as the enum's valueType.
   * Each enum value in the buffer must match one of the allowed values in the enum definition.
   * When type is ARRAY elements are packed tightly together and the data type is based on the componentType following the same rules as above.
   * arrayOffsetBufferView is required for variable-size arrays
   * and stringOffsetBufferView is required for strings (for variable-length arrays of strings, both are required)
   * The buffer view byteOffset must be aligned to a multiple of 8 bytes.
   * If the buffer view's buffer is the GLB-stored BIN chunk the byte offset is measured relative to the beginning of the GLB.
   * Otherwise it is measured relative to the beginning of the buffer.
   */
  bufferView: number;
  /** The type of values in arrayOffsetBufferView and stringOffsetBufferView. */
  offsetType?: string; // default: "UINT32"
  /**
   * The index of the buffer view containing offsets for variable-length arrays.
   * The number of offsets is equal to the feature table count plus one.
   * The offsets represent the start positions of each array, with the last offset representing the position after the last array.
   * The array length is computed using the difference between the current offset and the subsequent offset.
   * If componentType is STRING the offsets index into the string offsets array (stored in stringOffsetBufferView),
   * otherwise they index into the property array (stored in bufferView).
   * The data type of these offsets is determined by offsetType.
   * The buffer view byteOffset must be aligned to a multiple of 8 bytes in the same manner as the main bufferView
   */
  arrayOffsetBufferView?: number;
  /**
   * The index of the buffer view containing offsets for strings.
   * The number of offsets is equal to the number of string components plus one.
   * The offsets represent the byte offsets of each string in the main bufferView,
   * with the last offset representing the byte offset after the last string.
   * The string byte length is computed using the difference between the current offset and the subsequent offset.
   * The data type of these offsets is determined by offsetType.
   * The buffer view byteOffset must be aligned to a multiple of 8 bytes in the same manner as the main bufferView.
   */
  stringOffsetBufferView?: number;
  extensions?: any;
  extras?: any;
  [key: string]: any;
};

/**
 * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata#feature-texture
 */
type FeatureTexture = {
  /** The class this feature texture conforms to. The value must be a class ID declared in the classes dictionary. */
  class: string;
  /**
   * A dictionary, where each key corresponds to a property ID in the class properties dictionary
   * and each value describes the texture channels containing property values.
   */
  properties: {
    [key: string]: TextureAccessor;
  };
  extensions?: any;
  extras?: any;
  [key: string]: any;
};

/**
 * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata#texture-accessor
 */
type TextureAccessor = {
  /** Texture channels containing property values. Channels are labeled by rgba and are swizzled with a string of 1-4 characters. */
  channels: string;
  /** The glTF texture and texture coordinates to use. */
  texture: TextureInfo;
  extensions?: any;
  extras?: any;
  [key: string]: any;
};

/**
 * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata#statistics-1
 */
type Statistics = {
  /**
   * A dictionary, where each key is a class ID declared in the classes dictionary
   * and each value is an object containing statistics about features that conform to the class.
   */
  classes?: {
    [key: string]: ClassStatistics;
  };
  extensions?: any;
  extras?: any;
  [key: string]: any;
};

/**
 * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata#class-statistics
 */
type ClassStatistics = {
  /** The number of features that conform to the class. */
  count?: number;
  /**
   * A dictionary, where each key is a class ID declared in the classes dictionary
   * and each value is an object containing statistics about property values.
   */
  properties?: {
    [key: string]: StatisticsClassProperty;
  };
  extensions?: any;
  extras?: any;
  [key: string]: any;
};

/**
 * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata#property-statistics
 * min, max, mean, median, standardDeviation, variance, sum are
 * only applicable for numeric types and fixed-length arrays of numeric types.
 * For numeric types this is a single number.
 * For fixed-length arrays this is an array with componentCount number of elements.
 * The normalized property has no effect on these values.
 */
type StatisticsClassProperty = {
  /** The minimum property value. */
  min?: number | number[];
  /** The maximum property value. */
  max?: number | number[];
  /** The arithmetic mean of the property values. */
  mean?: number | number[];
  /** The median of the property values. */
  median?: number | number[];
  /** The standard deviation of the property values. */
  standardDeviation?: number | number[];
  /** The variance of the property values. */
  variance?: number | number[];
  /** The sum of the property values. */
  sum?: number | number[];
  /**
   * A dictionary, where each key corresponds to an enum name and each value is the number of occurrences of that enum.
   * Only applicable when type or componentType is ENUM.
   * For fixed-length arrays, this is an array with componentCount number of elements.
   */
  occurrences: {
    [key: string]: number | number[];
  };
  extensions?: any;
  extras?: any;
  [key: string]: any;
};

/**
 * 3DTilesNext EXT_feature_metadata primitive extension
 * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata#primitive-extension
 */
export type GLTF_EXT_feature_metadata_primitive = {
  /** Feature ids definition in attributes */
  featureIdAttributes?: GLTF_EXT_feature_metadata_attribute[];
  /** Feature ids definition in textures */
  featureIdTextures?: GLTF_EXT_feature_metadata_attribute[];
  /** An array of IDs of feature textures from the root EXT_feature_metadata object. */
  featureTextures?: string[];
  extensions?: any;
  extras?: any;
  [key: string]: any;
};

/**
 * Attribute which described featureIds definition.
 */
export type GLTF_EXT_feature_metadata_attribute = {
  /** Name of feature table */
  featureTable: string;
  /** Described how feature ids are defined */
  featureIds: ExtFeatureMetadataFeatureIds;
  extensions?: any;
  extras?: any;
  [key: string]: any;
};

/**
 * Defining featureIds by attributes or implicitly.
 */
type ExtFeatureMetadataFeatureIds = {
  /** Name of attribute where featureIds are defined */
  attribute?: string;
  /** Sets a constant feature ID for each vertex. The default is 0. */
  constant?: number;
  /** Sets the rate at which feature IDs increment.
   * If divisor is zero then constant is used.
   * If divisor is greater than zero the feature ID increments once per divisor sets of vertices, starting at constant.
   * The default is 0
   */
  divisor?: number;
  /** gLTF textureInfo object - https://github.com/CesiumGS/glTF/blob/3d-tiles-next/specification/2.0/schema/textureInfo.schema.json */
  texture?: ExtFeatureMetadataTexture;
  /** Must be a single channel ("r", "g", "b", or "a") */
  channels?: 'r' | 'g' | 'b' | 'a';
};

/**
 * Reference to a texture.
 */
type ExtFeatureMetadataTexture = {
  /** The set index of texture's TEXCOORD attribute used for texture coordinate mapping.*/
  texCoord: number;
  /** The index of the texture. */
  index: number;
};
