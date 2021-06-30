export {GL} from './geometry/constants';

// GL support
export {GL_TYPE} from './geometry/constants';
export {default as GLType} from './geometry/gl/gl-type';

// Geometry
export {default as isGeometry} from './geometry/is-geometry';

// Iterators
export {makeAttributeIterator} from './geometry/iterators/attribute-iterator';
export {makePrimitiveIterator} from './geometry/iterators/primitive-iterator';

// Helper methods
export {computeVertexNormals} from './geometry/attributes/compute-vertex-normals';

export {encodeRGB565, decodeRGB565} from './geometry/colors/rgb565';

// Typed array utils
export {concatTypedArrays} from './geometry/typed-arrays/typed-array-utils';

// Compression
export {
  octEncodeInRange,
  octEncode,
  octEncodeToVector4,
  octDecodeInRange,
  octDecode,
  octDecodeFromVector4,
  octPackFloat,
  octEncodeFloat,
  octDecodeFloat,
  octPack,
  octUnpack,
  compressTextureCoordinates,
  decompressTextureCoordinates,
  zigZagDeltaDecode
} from './geometry/compression/attribute-compression';
