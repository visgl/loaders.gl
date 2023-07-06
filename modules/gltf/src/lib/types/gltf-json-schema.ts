// Types forked from https://github.com/bwasty/gltf-loader-ts under MIT license
// Generated from official JSON schema using `npm run generate-interface` on 2018-02-24

export type GLTFId = number;

/**
 * Indices of those attributes that deviate from their initialization value.
 */
export type GLTFAccessorSparseIndices = {
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
  extensions?: Record<string, any>;
  extras?: any;
  // [k: string]: any;
};

/**
 * Array of size `accessor.sparse.count` times number of components storing the displaced accessor attributes pointed by `accessor.sparse.indices`.
 */
export type GLTFAccessorSparseValues = {
  /**
   * The index of the bufferView with sparse values. Referenced bufferView can't have ARRAY_BUFFER or ELEMENT_ARRAY_BUFFER target.
   */
  bufferView: GLTFId;
  /**
   * The offset relative to the start of the bufferView in bytes. Must be aligned.
   */
  byteOffset?: number;
  extensions?: Record<string, any>;
  extras?: any;
  // [k: string]: any;
};

/**
 * Sparse storage of attributes that deviate from their initialization value.
 */
export type GLTFAccessorSparse = {
  /**
   * Number of entries stored in the sparse array.
   */
  count: number;
  /**
   * Index array of size `count` that points to those accessor attributes that deviate from their initialization value. Indices must strictly increase.
   */
  indices: GLTFAccessorSparseIndices;
  /**
   * Array of size `count` times number of components, storing the displaced accessor attributes pointed by `indices`. Substituted values must have the same `componentType` and number of components as the base accessor.
   */
  values: GLTFAccessorSparseValues;
  extensions?: Record<string, any>;
  extras?: any;
  // [k: string]: any;
};

/**
 * A typed view into a bufferView.  A bufferView contains raw binary data.  An accessor provides a typed view into a bufferView or a subset of a bufferView similar to how WebGL's `vertexAttribPointer()` defines an attribute in a buffer.
 */
export type GLTFAccessor = {
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
  sparse?: GLTFAccessorSparse;
  name?: any;
  extensions?: Record<string, any>;
  extras?: any;
  // [k: string]: any;
};

/**
 * The index of the node and TRS property that an animation channel targets.
 */
export type GLTFAnimationChannelTarget = {
  /**
   * The index of the node to target.
   */
  node?: GLTFId;
  /**
   * The name of the node's TRS property to modify, or the "weights" of the Morph Targets it instantiates. For the "translation" property, the values that are provided by the sampler are the translation along the x, y, and z axes. For the "rotation" property, the values are a quaternion in the order (x, y, z, w), where w is the scalar. For the "scale" property, the values are the scaling factors along the x, y, and z axes.
   */
  path: 'translation' | 'rotation' | 'scale' | 'weights' | string;
  extensions?: Record<string, any>;
  extras?: any;
  // [k: string]: any;
};

/**
 * Targets an animation's sampler at a node's property.
 */
export type GLTFAnimationChannel = {
  /**
   * The index of a sampler in this animation used to compute the value for the target.
   */
  sampler: GLTFId;
  /**
   * The index of the node and TRS property to target.
   */
  target: GLTFAnimationChannelTarget;
  extensions?: Record<string, any>;
  extras?: any;
  // [k: string]: any;
};

/**
 * Combines input and output accessors with an interpolation algorithm to define a keyframe graph (but not its target).
 */
export type GLTFAnimationSampler = {
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
  extensions?: Record<string, any>;
  extras?: any;
  // [k: string]: any;
};

/**
 * A keyframe animation.
 */
export type GLTFAnimation = {
  /**
   * An array of channels, each of which targets an animation's sampler at a node's property. Different channels of the same animation can't have equal targets.
   */
  channels: GLTFAnimationChannel[];
  /**
   * An array of samplers that combines input and output accessors with an interpolation algorithm to define a keyframe graph (but not its target).
   */
  samplers: GLTFAnimationSampler[];
  name?: any;
  extensions?: Record<string, any>;
  extras?: any;
  // [k: string]: any;
};

/**
 * Metadata about the glTF asset.
 */
export type GLTFAsset = {
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
  extensions?: Record<string, any>;
  extras?: any;
  // [k: string]: any;
};

/**
 * A buffer points to binary geometry, animation, or skins.
 */
export type GLTFBuffer = {
  /**
   * The uri of the buffer.
   */
  uri?: string;
  /**
   * The length of the buffer in bytes.
   */
  byteLength: number;
  name?: any;
  extensions?: Record<string, any>;
  extras?: any;
  // [k: string]: any;
};

/**
 * A view into a buffer generally representing a subset of the buffer.
 */
export type GLTFBufferView = {
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
  extensions?: Record<string, any>;
  extras?: any;
  // [k: string]: any;
};

/**
 * An orthographic camera containing properties to create an orthographic projection matrix.
 */
export type GLTFCameraOrthographic = {
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
  extensions?: Record<string, any>;
  extras?: any;
  // [k: string]: any;
};

/**
 * A perspective camera containing properties to create a perspective projection matrix.
 */
export type GLTFCameraPerspective = {
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
  extensions?: Record<string, any>;
  extras?: any;
  // [k: string]: any;
};

/**
 * A camera's projection.  A node can reference a camera to apply a transform to place the camera in the scene.
 */
export type GLTFCamera = {
  /**
   * An orthographic camera containing properties to create an orthographic projection matrix.
   */
  orthographic?: GLTFCameraOrthographic;
  /**
   * A perspective camera containing properties to create a perspective projection matrix.
   */
  perspective?: GLTFCameraPerspective;
  /**
   * Specifies if the camera uses a perspective or orthographic projection.
   */
  type: 'perspective' | 'orthographic' | string;
  name?: any;
  extensions?: Record<string, any>;
  extras?: any;
  // [k: string]: any;
};

/**
 * Image data used to create a texture. Image can be referenced by URI or `bufferView` index. `mimeType` is required in the latter case.
 */
export type GLTFImage = {
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
  extensions?: Record<string, any>;
  extras?: any;
  // [k: string]: any;
};

/**
 * Reference to a texture.
 */
export type GLTFTextureInfo = {
  /**
   * The index of the texture.
   */
  index: GLTFId;
  /**
   * The set index of texture's TEXCOORD attribute used for texture coordinate mapping.
   */
  texCoord?: number;
  extensions?: Record<string, any>;
  extras?: any;
  // [k: string]: any;
};

/**
 * A set of parameter values that are used to define the metallic-roughness material model from Physically-Based Rendering (PBR) methodology.
 */
export type GLTFMaterialPbrMetallicRoughness = {
  /**
   * The material's base color factor.
   */
  baseColorFactor?: number[];
  /**
   * The base color texture.
   */
  baseColorTexture?: GLTFTextureInfo;
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
  metallicRoughnessTexture?: GLTFTextureInfo;
  extensions?: Record<string, any>;
  extras?: any;
  // [k: string]: any;
};
export type GLTFMaterialNormalTextureInfo = {
  index: any;
  texCoord?: any;
  /**
   * The scalar multiplier applied to each normal vector of the normal texture.
   */
  scale?: number;
  extensions?: Record<string, any>;
  extras?: any;
  // [k: string]: any;
};
export type GLTFMaterialOcclusionTextureInfo = {
  index: any;
  texCoord?: any;
  /**
   * A scalar multiplier controlling the amount of occlusion applied.
   */
  strength?: number;
  extensions?: Record<string, any>;
  extras?: any;
  // [k: string]: any;
};

/**
 * The material appearance of a primitive.
 */
export type GLTFMaterial = {
  name?: any;
  extensions?: Record<string, any>;
  extras?: any;
  /**
   * A set of parameter values that are used to define the metallic-roughness material model from Physically-Based Rendering (PBR) methodology. When not specified, all the default values of `pbrMetallicRoughness` apply.
   */
  pbrMetallicRoughness?: GLTFMaterialPbrMetallicRoughness;
  /**
   * The normal map texture.
   */
  normalTexture?: GLTFMaterialNormalTextureInfo;
  /**
   * The occlusion map texture.
   */
  occlusionTexture?: GLTFMaterialOcclusionTextureInfo;
  /**
   * The emissive map texture.
   */
  emissiveTexture?: GLTFTextureInfo;
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
};

/**
 * Geometry to be rendered with the given material.
 */
export type GLTFMeshPrimitive = {
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
  extensions?: Record<string, any>;
  extras?: any;
  // [k: string]: any;
};

/**
 * A set of primitives to be rendered.  A node can contain one mesh.  A node's transform places the mesh in the scene.
 */

export type GLTFMesh = {
  id?: string;
  /**
   * An array of primitives, each defining geometry to be rendered with a material.
   */
  primitives: GLTFMeshPrimitive[];
  /**
   * Array of weights to be applied to the Morph Targets.
   */
  weights?: number[];
  name?: any;
  extensions?: Record<string, any>;
  extras?: any;
  // [k: string]: any;
};

/**
 * A node in the node hierarchy.  When the node contains `skin`, all `mesh.primitives` must contain `JOINTS_0` and `WEIGHTS_0` attributes.  A node can have either a `matrix` or any combination of `translation`/`rotation`/`scale` (TRS) properties. TRS properties are converted to matrices and postmultiplied in the `T * R * S` order to compose the transformation matrix; first the scale is applied to the vertices, then the rotation, and then the translation. If none are provided, the transform is the identity. When a node is targeted for animation (referenced by an animation.channel.target), only TRS properties may be present; `matrix` will not be present.
 */
export type GLTFNode = {
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
  extensions?: Record<string, any>;
  extras?: any;
  // [k: string]: any;
};

/**
 * Texture sampler properties for filtering and wrapping modes.
 */
export type GLTFSampler = {
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
  extensions?: Record<string, any>;
  extras?: any;
  // [k: string]: any;
};

/**
 * The root nodes of a scene.
 */
export type GLTFScene = {
  /**
   * The indices of each root node.
   */
  nodes?: GLTFId[];
  name?: any;
  extensions?: Record<string, any>;
  extras?: any;
  // [k: string]: any;
};

/**
 * Joints and matrices defining a skin.
 */
export type GLTFSkin = {
  id?: string;
  /**
   * The index of the accessor containing the floating-point 4x4 inverse-bind matrices.  The default is that each matrix is a 4x4 identity matrix, which implies that inverse-bind matrices were pre-applied.
   */
  inverseBindMatrices?: GLTFId;
  /**
   * The index of the node used as a skeleton root. When undefined, joints transforms resolve to scene root.
   */
  skeleton?: GLTFId;
  /** Indices of skeleton nodes, used as joints in this skin. */
  joints: GLTFId[];
  name?: any;
  extensions?: Record<string, any>;
  extras?: any;
  // [k: string]: any;
};

/**
 * A texture and its sampler.
 */
export type GLTFTexture = {
  /** The index of the sampler used by this texture. When undefined, a sampler with repeat wrapping and auto filtering should be used. */
  sampler?: GLTFId;
  /** The index of the image used by this texture. */
  source?: GLTFId;
  name?: any;
  extensions?: Record<string, any>;
  extras?: any;
  // [k: string]: any;
};

/**
 * The root object for a glTF asset.
 */
export type GLTF = {
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
  accessors?: GLTFAccessor[];
  /**
   * An array of keyframe animations.
   */
  animations?: GLTFAnimation[];
  /**
   * Metadata about the glTF asset.
   */
  asset: GLTFAsset;
  /**
   * An array of buffers.
   */
  buffers?: GLTFBuffer[];
  /**
   * An array of bufferViews.
   */
  bufferViews?: GLTFBufferView[];
  /**
   * An array of cameras.
   */
  cameras?: GLTFCamera[];
  /**
   * An array of images.
   */
  images?: GLTFImage[];
  /**
   * An array of materials.
   */
  materials?: GLTFMaterial[];
  /**
   * An array of meshes.
   */
  meshes?: GLTFMesh[];
  /**
   * An array of nodes.
   */
  nodes?: GLTFNode[];
  /**
   * An array of samplers.
   */
  samplers?: GLTFSampler[];
  /**
   * The index of the default scene.
   */
  scene?: GLTFId;
  /**
   * An array of scenes.
   */
  scenes?: GLTFScene[];
  /**
   * An array of skins.
   */
  skins?: GLTFSkin[];
  /**
   * An array of textures.
   */
  textures?: GLTFTexture[];
  extensions?: Record<string, unknown>;
  extras?: unknown;
  [k: string]: unknown;
};

export type GLTFObject =
  | GLTFAccessor
  | GLTFBuffer
  | GLTFBufferView
  | GLTFMeshPrimitive
  | GLTFMesh
  | GLTFNode
  | GLTFMaterial
  | GLTFSampler
  | GLTFScene
  | GLTFSkin
  | GLTFTexture
  | GLTFImage;

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
 * Spec - https://github.com/CesiumGS/glTF/blob/3d-tiles-next/extensions/2.0/Vendor/EXT_structural_metadata/schema/glTF.EXT_structural_metadata.schema.json
 */
type ExtStructuralMetadataSchema = {
  /** The name of the schema. */
  name?: string;
  /** The description of the schema. */
  description?: string;
  /** Application-specific version of the schema. */
  version?: string;
  /** A dictionary, where each key is a class ID and each value is an object defining the class. */
  classes?: {
    [key: string]: EXT_structural_metadata_class_object;
  };
  /** A dictionary, where each key is an enum ID and each value is an object defining the values for the enum. */
  enums?: {
    [key: string]: GLTF_EXT_feature_metadata_Enum;
  };
  extensions?: Record<string, any>;
  extras?: any;
  [key: string]: any;
};

/**
 * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata#class
 */
export type EXT_structural_metadata_class_object = {
  /** The name of the class, e.g. for display purposes. */
  name?: string;
  /** The description of the class. */
  description?: string;
  /** A dictionary, where each key is a property ID and each value is an object defining the property.
   * Property IDs must be alphanumeric identifiers matching the regular expression `^[a-zA-Z_][a-zA-Z0-9_]*$`.
   */
  properties: {
    // TODO: Should it be stuctural metadata specific ClassProperty ?
    [key: string]: GLTF_EXT_feature_metadata_ClassProperty;
  };
  extensions?: Record<string, any>;
  extras?: any;
  [key: string]: any;
};

export type GLTF_EXT_structural_metadata = {
  /** An object defining classes and enums. */
  schema?: ExtStructuralMetadataSchema;
  /** A uri to an external schema file. */
  schemaUri?: string;
  /** An array of property table definitions, which may be referenced by index. */
  propertyTables: EXT_structural_metadata_property_table[];
  /** An array of property texture definitions, which may be referenced by index. */
  propertyTextures: EXT_structural_metadata_property_texture[];
  /** "An array of property attribute definitions, which may be referenced by index. */
  propertyAttributes: EXT_structural_metadata_property_attribute[];
  [key: string]: any;
};

export type EXT_structural_metadata_property_table = {
  /** The name of the property table, e.g. for display purposes. */
  name?: string;
  /** The class that property values conform to. The value must be a class ID declared in the `classes` dictionary. */
  class: string;
  /** The number of elements in each property array. */
  count: number;
  /**
   * A dictionary, where each key corresponds to a property ID in the class' `properties` dictionary
   * and each value is an object describing where property values are stored.
   * Required properties must be included in this dictionary.
   */
  properties?: {
    [key: string]: EXT_structural_metadata_property_table_property;
  };
  extensions?: Record<string, any>;
  extras?: any;
  [key: string]: any;
};

/**
 * https://github.com/CesiumGS/glTF/blob/3d-tiles-next/extensions/2.0/Vendor/EXT_structural_metadata/schema/propertyTable.property.schema.json
 */
export type EXT_structural_metadata_property_table_property = {
  /**
   * The index of the buffer view containing property values.
   * The data type of property values is determined by the property definition:
   * When `type` is `BOOLEAN` values are packed into a bitstream.
   * When `type` is `STRING` values are stored as byte sequences and decoded as UTF-8 strings.
   * When `type` is `SCALAR`, `VECN`, or `MATN` the values are stored as the provided
   * `componentType` and the buffer view `byteOffset` must be aligned to a multiple of the `componentType` size.
   * When `type` is `ENUM` values are stored as the enum's
   * `valueType` and the buffer view `byteOffset` must be aligned to a multiple of the `valueType` size.
   * Each enum value in the array must match one of the allowed values in the enum definition.
   * `arrayOffsets` is required for variable-length arrays and `stringOffsets` is required for strings (for variable-length arrays of strings, both are required).
   */
  values: number;
  /**
   * The index of the buffer view containing offsets for variable-length arrays.
   * The number of offsets is equal to the property table `count` plus one.
   * The offsets represent the start positions of each array, with the last offset representing the position after the last array.
   * The array length is computed using the difference between the subsequent offset and the current offset.
   * If `type` is `STRING` the offsets index into the string offsets array (stored in `stringOffsets`), otherwise they index into the property array (stored in `values`).
   * The data type of these offsets is determined by `arrayOffsetType`.
   * The buffer view `byteOffset` must be aligned to a multiple of the `arrayOffsetType` size.
   */
  arrayOffsets?: number;
  /**
   * The index of the buffer view containing offsets for strings.
   * The number of offsets is equal to the number of string elements plus one.
   * The offsets represent the byte offsets of each string in the property array (stored in `values`), with the last offset representing the byte offset after the last string.
   * The string byte length is computed using the difference between the subsequent offset and the current offset.
   * The data type of these offsets is determined by `stringOffsetType`.
   * The buffer view `byteOffset` must be aligned to a multiple of the `stringOffsetType` size.
   */
  stringOffsets?: number;
  /**
   * The type of values in `arrayOffsets`.
   */
  arrayOffsetType?: string;
  /**
   * The type of values in `stringOffsets`.
   */
  stringOffsetType?: string;
  /**
   * An offset to apply to property values.
   * Only applicable when the component type is `FLOAT32` or `FLOAT64`, or when the property is `normalized`.
   * Overrides the class property's `offset` if both are defined.
   */
  offset?: number;
  /**
   * A scale to apply to property values.
   * Only applicable when the component type is `FLOAT32` or `FLOAT64`, or when the property is `normalized`.
   * Overrides the class property's `scale` if both are defined.
   */
  scale?: number;
  /**
   * Maximum value present in the property values.
   * Only applicable to `SCALAR`, `VECN`, and `MATN` types.
   * This is the maximum of all property values, after the transforms based on the `normalized`, `offset`, and `scale` properties have been applied.
   */
  max?: number;
  /**
   * Minimum value present in the property values.
   * Only applicable to `SCALAR`, `VECN`, and `MATN` types.
   * This is the minimum of all property values, after the transforms based on the `normalized`, `offset`, and `scale` properties have been applied.
   */
  min?: number;
  extensions?: Record<string, any>;
  extras?: any;
  /**
   * For internal usage
   */
  data?: any;
};

/**
 * https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_structural_metadata
 * Each property that is defined in the propertyTexture object extends the glTF textureInfo object.
 */
export type GLTFTextureInfoExtStructural = GLTFTextureInfo & {
  channels: number[];
  /**
   * For internal usage
   */
  data?: any;
};

/** https://github.com/CesiumGS/glTF/blob/3d-tiles-next/extensions/2.0/Vendor/EXT_structural_metadata/schema/propertyTexture.schema.json */
export type EXT_structural_metadata_property_texture = {
  /** The name of the property texture, e.g. for display purposes. */
  name?: string;
  /** The class that property values conform to. The value must be a class ID declared in the `classes` dictionary. */
  class: string;
  /**
   * A dictionary, where each key corresponds to a property ID in the class' `properties` dictionary
   * and each value is an object describing where property values are stored.
   * Required properties must be included in this dictionary.
   *
   * https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_structural_metadata
   * Each property that is defined in the propertyTexture object extends the glTF textureInfo object.
   * The texCoord specifies a texture coordinate set in the referring primitive.
   * The index is the index of the glTF texture object that stores the actual data. Additionally,
   * each property specifies an array of channels, which are the indices of the texture channels providing data for the respective property.
   * Channels of an RGBA texture are numbered 0–3 respectively.
   */
  properties?: {
    //    [key: string]: any;
    [key: string]: GLTFTextureInfoExtStructural;
  };
  extensions?: Record<string, any>;
  extras?: any;
  [key: string]: any;
};

/** https://github.com/CesiumGS/glTF/blob/3d-tiles-next/extensions/2.0/Vendor/EXT_structural_metadata/schema/propertyAttribute.schema.json */
export type EXT_structural_metadata_property_attribute = {
  /** The name of the property attribute, e.g. for display purposes. */
  name?: string;
  /** The class that property values conform to. The value must be a class ID declared in the `classes` dictionary. */
  class: string;
  /**
   * "A dictionary, where each key corresponds to a property ID in the class' `properties` dictionary
   * and each value is an object describing where property values are stored.
   * Required properties must be included in this dictionary.
   */
  properties?: {
    [key: string]: any;
  };
  extensions?: Record<string, any>;
  extras?: any;
  [key: string]: any;
};

/**
 * Spec - https://github.com/CesiumGS/glTF/blob/3d-tiles-next/extensions/2.0/Vendor/EXT_mesh_features/schema/featureId.schema.json
 */
export type GLTF_EXT_mesh_features_feature_id = {
  /** The number of unique features in the attribute or texture. */
  featureCount: number;
  /** A value that indicates that no feature is associated with this vertex or texel. */
  nullFeatureId?: number;
  /** A label assigned to this feature ID set. Labels must be alphanumeric identifiers matching the regular expression `^[a-zA-Z_][a-zA-Z0-9_]*$`. */
  label?: string;
  /** An attribute containing feature IDs. When `attribute` and `texture` are omitted the feature IDs are assigned to vertices by their index. */
  attribute?: any;
  /** A texture containing feature IDs. */
  texture?: any;
  /** The index of the property table containing per-feature property values. Only applicable when using the `EXT_structural_metadata` extension. */
  propertyTable?: number;
};

/**
 * EXT_mesh_features extension types
 * This is a primitive-level extension
 * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_mesh_features
 *
 * JSON Schema - https://github.com/CesiumGS/glTF/blob/c38f7f37e894004353c15cd0481bc5b7381ce841/extensions/2.0/Vendor/EXT_mesh_features/schema/mesh.primitive.EXT_mesh_features.schema.json
 * An object describing feature IDs for a mesh primitive.
 */
export type GLTF_EXT_mesh_features = {
  /** An array of feature ID sets. */
  featureIds: GLTF_EXT_mesh_features_featureId[];
  extensions?: Record<string, any>;
  extras?: any;
};

/**
 * JSON Schema https://github.com/CesiumGS/glTF/blob/c38f7f37e894004353c15cd0481bc5b7381ce841/extensions/2.0/Vendor/EXT_mesh_features/schema/featureId.schema.json
 * Feature IDs stored in an attribute or texture.
 */
export type GLTF_EXT_mesh_features_featureId = {
  /** The number of unique features in the attribute or texture. */
  featureCount: number;
  /** A value that indicates that no feature is associated with this vertex or texel. */
  nullFeatureId: number;
  /** A label assigned to this feature ID set. Labels must be alphanumeric identifiers matching the regular expression `^[a-zA-Z_][a-zA-Z0-9_]*$`. */
  label: string;
  /**
   * An attribute containing feature IDs. When `attribute` and `texture` are omitted the feature IDs are assigned to vertices by their index.
   * Schema https://github.com/CesiumGS/glTF/blob/3d-tiles-next/extensions/2.0/Vendor/EXT_mesh_features/schema/featureIdAttribute.schema.json
   * An integer value used to construct a string in the format `_FEATURE_ID_<set index>` which is a reference to a key in `mesh.primitives.attributes`
   * (e.g. a value of `0` corresponds to `_FEATURE_ID_0`).
   */
  attribute: number;
  /** A texture containing feature IDs. */
  texture: any;
  /** The index of the property table containing per-feature property values. Only applicable when using the `EXT_structural_metadata` extension. */
  propertyTable: number;
  extensions?: Record<string, any>;
  extras?: any;
};

/**
 * JSON Schema https://github.com/CesiumGS/glTF/blob/c38f7f37e894004353c15cd0481bc5b7381ce841/extensions/2.0/Vendor/EXT_mesh_features/schema/featureIdTexture.schema.json
 * Feature ID Texture in EXT_mesh_features
 */
export type GLTF_EXT_mesh_features_featureIdTexture = {
  /**
   * Texture channels containing feature IDs, identified by index. Feature IDs may be packed into multiple channels if a single channel does not have sufficient
   * bit depth to represent all feature ID values. The values are packed in little-endian order.
   */
  channels: number[];
  /** Texture index in the glTF textures array */
  index: number;
  /** Textcoord index in the primitive attribute (eg. 0 for TEXTCOORD_0, 1 for TEXTCOORD_1 etc...) */
  texCoord: number;
  extensions: Record<string, any>;
  extras: any;
};

/**
 * EXT_feature_metadata extension types
 * This extension has glTF-level metadata and primitive-level feature indexing and segmentation metadata
 * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata
 *
 * glTF-level metadata
 * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata#gltf-extension-1
 * JSON Schema - https://github.com/CesiumGS/glTF/blob/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata/schema/glTF.EXT_feature_metadata.schema.json
 */
export type GLTF_EXT_feature_metadata_GLTF = {
  /** An object defining classes and enums. */
  schema?: GLTF_EXT_feature_metadata_Schema;
  /** A uri to an external schema file. */
  schemaUri?: string;
  /** An object containing statistics about features. */
  statistics?: GLTF_EXT_feature_metadata_Statistics;
  /** A dictionary, where each key is a feature table ID and each value is an object defining the feature table. */
  featureTables?: {
    [key: string]: GLTF_EXT_feature_metadata_FeatureTable;
  };
  /** A dictionary, where each key is a feature texture ID and each value is an object defining the feature texture. */
  featureTextures?: {
    [key: string]: GLTF_EXT_feature_metadata_FeatureTexture;
  };
  extensions?: Record<string, any>;
  extras?: any;
};

/**
 * An object defining classes and enums.
 * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata#schema
 * JSON Schema - https://github.com/CesiumGS/glTF/blob/c38f7f37e894004353c15cd0481bc5b7381ce841/extensions/2.0/Vendor/EXT_feature_metadata/schema/schema.schema.json
 */
export type GLTF_EXT_feature_metadata_Schema = {
  /** The name of the schema. */
  name?: string;
  /** The description of the schema. */
  description?: string;
  /** Application-specific version of the schema. */
  version?: string;
  /** A dictionary, where each key is a class ID and each value is an object defining the class. */
  classes?: {
    [key: string]: GLTF_EXT_feature_metadata_Class;
  };
  /** A dictionary, where each key is an enum ID and each value is an object defining the values for the enum. */
  enums?: {
    [key: string]: GLTF_EXT_feature_metadata_Enum;
  };
  extensions?: Record<string, any>;
  extras?: any;
};

/**
 * A class containing a set of properties.
 * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata#class
 * JSON Schema - https://github.com/CesiumGS/glTF/blob/c38f7f37e894004353c15cd0481bc5b7381ce841/extensions/2.0/Vendor/EXT_feature_metadata/schema/class.schema.json
 */
export type GLTF_EXT_feature_metadata_Class = {
  /** The name of the class, e.g. for display purposes. */
  name?: string;
  /** The description of the class. */
  description?: string;
  /** A dictionary, where each key is a property ID and each value is an object defining the property. */
  properties: {
    [key: string]: GLTF_EXT_feature_metadata_ClassProperty;
  };
  extensions?: Record<string, any>;
  extras?: any;
};

/**
 * A class property.
 * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata#class-property
 * JSON Schema - https://github.com/CesiumGS/glTF/blob/c38f7f37e894004353c15cd0481bc5b7381ce841/extensions/2.0/Vendor/EXT_feature_metadata/schema/class.property.schema.json
 */
export type GLTF_EXT_feature_metadata_ClassProperty = {
  /** The name of the property, e.g. for display purposes. */
  name?: string;
  /** The description of the property. */
  description?: string;
  /**
   * The property type. If ENUM is used, then enumType must also be specified.
   * If ARRAY is used, then componentType must also be specified.
   * ARRAY is a fixed-length array when componentCount is defined, and variable-length otherwise.
   */
  type:
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
    | 'ARRAY'
    | string;
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
    | 'ENUM'
    | string;
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
  extensions?: Record<string, any>;
  extras?: any;
};

/**
 * An object defining the values of an enum.
 * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata#enum
 * JSON Schema - https://github.com/CesiumGS/glTF/blob/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata/schema/enum.schema.json
 */
export type GLTF_EXT_feature_metadata_Enum = {
  /** The name of the enum, e.g. for display purposes. */
  name?: string;
  /** The description of the enum. */
  description?: string;
  /** The type of the integer enum value. */
  valueType?: 'INT8' | 'UINT8' | 'INT16' | 'UINT16' | 'INT32' | 'UINT32' | 'INT64' | 'UINT64'; // default: "UINT16"
  /** An array of enum values. Duplicate names or duplicate integer values are not allowed. */
  values: GLTF_EXT_feature_metadata_EnumValue[];
  extensions?: Record<string, any>;
  extras?: any;
  [key: string]: any;
};

/**
 * An enum value.
 * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata#enum-value
 * JSON Schema - https://github.com/CesiumGS/glTF/blob/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata/schema/enum.value.schema.json
 */
export type GLTF_EXT_feature_metadata_EnumValue = {
  /** The name of the enum value. */
  name: string;
  /** The description of the enum value. */
  description?: string;
  /** The integer enum value. */
  value: number; // default: "UINT16"
  extensions?: Record<string, any>;
  extras?: any;
  [key: string]: any;
};

/**
 * A feature table defined by a class and property values stored in arrays.
 * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata#feature-table
 * JSON Schenma - https://github.com/CesiumGS/glTF/blob/c38f7f37e894004353c15cd0481bc5b7381ce841/extensions/2.0/Vendor/EXT_feature_metadata/schema/featureTable.schema.json
 */
export type GLTF_EXT_feature_metadata_FeatureTable = {
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
    [key: string]: GLTF_EXT_feature_metadata_FeatureTableProperty;
  };
  extensions?: Record<string, any>;
  extras?: any;
};

/**
 * An array of binary property values.
 * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata#feature-table-property
 * JSON Schema - https://github.com/CesiumGS/glTF/blob/c38f7f37e894004353c15cd0481bc5b7381ce841/extensions/2.0/Vendor/EXT_feature_metadata/schema/featureTable.property.schema.json
 */
export type GLTF_EXT_feature_metadata_FeatureTableProperty = {
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
  /** This is not part of the spec. GLTFLoader loads feature tables data into this property */
  data: any;
  extensions?: Record<string, any>;
  extras?: any;
};

/**
 * Features whose property values are stored directly in texture channels. This is not to be confused with feature ID textures which store feature IDs for use with a feature table.
 * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata#feature-texture
 * JSON Schema - https://github.com/CesiumGS/glTF/blob/c38f7f37e894004353c15cd0481bc5b7381ce841/extensions/2.0/Vendor/EXT_feature_metadata/schema/featureTexture.schema.json
 */
export type GLTF_EXT_feature_metadata_FeatureTexture = {
  /** The class this feature texture conforms to. The value must be a class ID declared in the classes dictionary. */
  class: string;
  /**
   * A dictionary, where each key corresponds to a property ID in the class properties dictionary
   * and each value describes the texture channels containing property values.
   */
  properties: {
    [key: string]: GLTF_EXT_feature_metadata_TextureAccessor;
  };
  extensions?: Record<string, any>;
  extras?: any;
};

/**
 * A description of how to access property values from the color channels of a texture.
 * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata#texture-accessor
 * JSON Schema - https://github.com/CesiumGS/glTF/blob/c38f7f37e894004353c15cd0481bc5b7381ce841/extensions/2.0/Vendor/EXT_feature_metadata/schema/textureAccessor.schema.json
 */
export type GLTF_EXT_feature_metadata_TextureAccessor = {
  /** Texture channels containing property values. Channels are labeled by rgba and are swizzled with a string of 1-4 characters. */
  channels: string;
  /** The glTF texture and texture coordinates to use. */
  texture: GLTFTextureInfo;
  /** This is not part of the spec. GLTFLoader loads feature tables data into this property */
  data: any;
  extensions?: Record<string, any>;
  extras?: any;
};

/**
 * Statistics about features.
 * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata#statistics-1
 * JSON Schema - https://github.com/CesiumGS/glTF/blob/c38f7f37e894004353c15cd0481bc5b7381ce841/extensions/2.0/Vendor/EXT_feature_metadata/schema/statistics.schema.json
 */
export type GLTF_EXT_feature_metadata_Statistics = {
  /**
   * A dictionary, where each key is a class ID declared in the classes dictionary
   * and each value is an object containing statistics about features that conform to the class.
   */
  classes?: {
    [key: string]: GLTF_EXT_feature_metadata_StatisticsClass;
  };
  extensions?: Record<string, any>;
  extras?: any;
};

/**
 * Statistics about features that conform to the class.
 * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata#class-statistics
 * JSON Schema - https://github.com/CesiumGS/glTF/blob/c38f7f37e894004353c15cd0481bc5b7381ce841/extensions/2.0/Vendor/EXT_feature_metadata/schema/statistics.class.property.schema.json
 */
export type GLTF_EXT_feature_metadata_StatisticsClass = {
  /** The number of features that conform to the class. */
  count?: number;
  /**
   * A dictionary, where each key is a class ID declared in the classes dictionary
   * and each value is an object containing statistics about property values.
   */
  properties?: {
    [key: string]: GLTF_EXT_feature_metadata_StatisticsClassProperty;
  };
  extensions?: Record<string, any>;
  extras?: any;
};

/**
 * min, max, mean, median, standardDeviation, variance, sum are
 * only applicable for numeric types and fixed-length arrays of numeric types.
 * For numeric types this is a single number.
 * For fixed-length arrays this is an array with componentCount number of elements.
 * The normalized property has no effect on these values.
 * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata#property-statistics
 * JSON Schema - https://github.com/CesiumGS/glTF/blob/c38f7f37e894004353c15cd0481bc5b7381ce841/extensions/2.0/Vendor/EXT_feature_metadata/schema/statistics.class.property.schema.json
 */
export type GLTF_EXT_feature_metadata_StatisticsClassProperty = {
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
  extensions?: Record<string, any>;
  extras?: any;
};

/**
 * EXT_feature_metadata extension types
 * This extension has glTF-level metadata and primitive-level (feature indexing and segmentation) metadata
 * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata
 *
 * primitive-level metadata
 * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata#primitive-extension
 * JSON Schema - https://github.com/CesiumGS/glTF/blob/c38f7f37e894004353c15cd0481bc5b7381ce841/extensions/2.0/Vendor/EXT_feature_metadata/schema/mesh.primitive.EXT_feature_metadata.schema.json
 */
export type GLTF_EXT_feature_metadata_Primitive = {
  /** Feature ids definition in attributes */
  featureIdAttributes?: GLTF_EXT_feature_metadata_FeatureIdAttribute[];
  /** Feature ids definition in textures */
  featureIdTextures?: GLTF_EXT_feature_metadata_FeatureIdTexture[];
  /** An array of IDs of feature textures from the root EXT_feature_metadata object. */
  featureTextures?: string[];
  extensions?: Record<string, any>;
  extras?: any;
};

/**
 * Attribute which described featureIds definition.
 * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata#feature-id-attribute
 * JSON Schema - https://github.com/CesiumGS/glTF/blob/c38f7f37e894004353c15cd0481bc5b7381ce841/extensions/2.0/Vendor/EXT_feature_metadata/schema/featureIdAttribute.schema.json
 */
export type GLTF_EXT_feature_metadata_FeatureIdAttribute = {
  /** Name of feature table */
  featureTable: string;
  /** Described how feature ids are defined */
  featureIds: GLTF_EXT_feature_metadata_FeatureIdAttributeFeatureIds;
  extensions?: Record<string, any>;
  extras?: any;
};

/**
 * Defining featureIds by attributes or implicitly.
 * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata#primitive-extensionfeatureidattributes
 * JSON Schema - https://github.com/CesiumGS/glTF/blob/c38f7f37e894004353c15cd0481bc5b7381ce841/extensions/2.0/Vendor/EXT_feature_metadata/schema/featureIdAttribute.featureIds.schema.json
 */
export type GLTF_EXT_feature_metadata_FeatureIdAttributeFeatureIds = {
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
};

/**
 * An object describing a texture used for storing per-texel feature IDs.
 * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata#feature-id-texture
 * JSON Schema - https://github.com/CesiumGS/glTF/blob/c38f7f37e894004353c15cd0481bc5b7381ce841/extensions/2.0/Vendor/EXT_feature_metadata/schema/featureIdTexture.schema.json
 */
export type GLTF_EXT_feature_metadata_FeatureIdTexture = {
  /** The ID of the feature table in the model's root `EXT_feature_metadata.featureTables` dictionary. */
  featureTable: string;
  /** A description of the texture and channel to use for feature IDs. The `channels` property must have a single channel. Furthermore,
   * feature IDs must be whole numbers in the range `[0, count - 1]` (inclusive), where `count` is the total number of features
   * in the feature table. Texel values must be read as integers. Texture filtering should be disabled when fetching feature IDs.
   */
  featureIds: GLTF_EXT_feature_metadata_FeatureIdTextureAccessor;
};

/**
 * A description of how to access property values from the color channels of a texture.
 * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata#featureidtexturefeatureids
 * JSON Schema - https://github.com/CesiumGS/glTF/blob/c38f7f37e894004353c15cd0481bc5b7381ce841/extensions/2.0/Vendor/EXT_feature_metadata/schema/textureAccessor.schema.json
 */
export type GLTF_EXT_feature_metadata_FeatureIdTextureAccessor = {
  /** gLTF textureInfo object - https://github.com/CesiumGS/glTF/blob/3d-tiles-next/specification/2.0/schema/textureInfo.schema.json */
  texture: GLTFTextureInfo;
  /** Must be a single channel ("r", "g", "b", or "a") */
  channels: 'r' | 'g' | 'b' | 'a';
};
