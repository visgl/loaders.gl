// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {GLTFScenegraph, GLTFWriter} from '@loaders.gl/gltf';
import {getBinaryImageMetadata} from '@loaders.gl/images';
import type {MeshAttribute, MeshGeometry} from '@loaders.gl/schema';
import {
  prepareMeshFeatureGeometry,
  encodeMeshFeatures,
  type MeshTileFeatures
} from './mesh-features.js';
import {TileConversionError} from '@loaders.gl/tile-converter/v5/core';

/** Explicit glTF wrapping and filtering for the selected base-color image. */
export interface MeshTileSampler {
  /** Horizontal wrapping: CLAMP_TO_EDGE, MIRRORED_REPEAT, or REPEAT; omitted values use REPEAT. */
  readonly wrapS?: 33071 | 33648 | 10497;
  /** Vertical wrapping: CLAMP_TO_EDGE, MIRRORED_REPEAT, or REPEAT; omitted values use REPEAT. */
  readonly wrapT?: 33071 | 33648 | 10497;
  /** Magnification: NEAREST or LINEAR; omission leaves filtering to the renderer. */
  readonly magFilter?: 9728 | 9729;
  /** Minification: NEAREST, LINEAR, or a glTF mipmap filter; omission leaves filtering to the renderer. */
  readonly minFilter?: 9728 | 9729 | 9984 | 9985 | 9986 | 9987;
}

/** Selected KHR_texture_transform controls for TEXCOORD_0. */
export interface MeshTileTextureTransform {
  /** Finite UV translation; omitted values use [0, 0]. */
  readonly offset?: readonly [number, number];
  /** Finite counterclockwise rotation in radians around the UV origin; omission uses 0. */
  readonly rotation?: number;
  /** Finite UV scale; zero and negative values are allowed, and omission uses [1, 1]. */
  readonly scale?: readonly [number, number];
}

/** One already encoded base-color image using TEXCOORD_0. */
export interface MeshTileTexture {
  /** Encoded PNG/JPEG bytes; a typed array subview selects only its own bytes. */
  readonly data: Uint8Array;
  /** Declared image format, checked against the encoded header. */
  readonly mimeType: 'image/png' | 'image/jpeg';
  /** Optional wrapping/filtering; omission retains glTF's implicit sampler. */
  readonly sampler?: MeshTileSampler;
  /** Optional UV transform, preserved as a required KHR_texture_transform extension. */
  readonly transform?: MeshTileTextureTransform;
}

/** One glTF metallic-roughness material, shared by every triangle in the mesh. */
export interface MeshTileMaterial {
  /** Linear RGBA base-color multiplier; components must be finite in [0, 1]. */
  readonly baseColorFactor?: readonly [number, number, number, number];
  /** Optional embedded image, multiplied by baseColorFactor and COLOR_0; requires TEXCOORD_0. */
  readonly baseColorTexture?: MeshTileTexture;
  /** Metallic weight in [0, 1]; omitted values use the glTF default of 1. */
  readonly metallicFactor?: number;
  /** Roughness weight in [0, 1]; omitted values use the glTF default of 1. */
  readonly roughnessFactor?: number;
  /** Alpha interpretation; omitted values use OPAQUE. */
  readonly alphaMode?: 'OPAQUE' | 'MASK' | 'BLEND';
  /** Finite nonnegative threshold, allowed only with MASK; omitted values use 0.5. */
  readonly alphaCutoff?: number;
  /** Whether both sides are rendered; omitted values use false. */
  readonly doubleSided?: boolean;
}

/** Optional appearance for the single-mesh GLB profile. */
export interface MeshTileOptions {
  /** One explicit Arrow feature table with a row index per triangle. */
  readonly features?: MeshTileFeatures;
  /** Explicitly selected material; other texture maps and material extensions are unsupported. */
  readonly material?: MeshTileMaterial;
}

/**
 * Encodes one triangle mesh as a self-contained glTF 2.0 GLB resource.
 *
 * POSITION and optional NORMAL must contain packed finite Float32 xyz triples. COLOR_0 accepts
 * packed Float32 linear RGB/RGBA in [0, 1] or normalized Uint8/Uint16 colors per vertex.
 * Normals must have unit length within 0.0001. TEXCOORD_0 accepts packed finite Float32
 * or normalized Uint8/Uint16 UV pairs per vertex. Optional indices use packed unsigned
 * 8-, 16-, or 32-bit values.
 * Unsupported attributes, layouts, and encoded transforms fail rather than being discarded.
 * Coordinates are preserved: callers own CRS conversion, local origins, placement, source material mapping,
 * feature mappings, and tileset packaging. Input arrays are never modified.
 *
 * @param mesh - Triangle-list geometry in the caller's selected local coordinate frame.
 * @param options - Optional single material with an already encoded base-color image.
 * @returns An embedded-buffer GLB containing one mesh, node, and default scene.
 */
export function encodeMeshTile(mesh: MeshGeometry, options: MeshTileOptions = {}): ArrayBuffer {
  const geometry = prepareMeshFeatureGeometry(validateMeshGeometry(mesh), options.features);
  const {scenegraph, materialIndex} = createMeshTileScenegraph(options, geometry);
  const meshIndex = scenegraph.addMesh({
    attributes: geometry.attributes,
    indices: geometry.indices?.value,
    material: materialIndex,
    mode: 4
  });
  encodeMeshFeatures(scenegraph, meshIndex, options.features);
  return finalizeMeshTileScenegraph(scenegraph, meshIndex);
}

/** Creates the shared material/image scene without allocating uncompressed geometry buffers. */
export function createMeshTileScenegraph(options: MeshTileOptions, geometry: MeshGeometry) {
  const scenegraph = new GLTFScenegraph({json: {asset: {version: '2.0', generator: 'loaders.gl'}}});
  const material =
    options.material === undefined
      ? undefined
      : validateMeshMaterial(options.material, scenegraph, 'TEXCOORD_0' in geometry.attributes);
  return {scenegraph, materialIndex: material ? scenegraph.addMaterial(material) : undefined};
}

/** Adds placement-neutral nodes and serializes the single-mesh scene as GLB. */
export function finalizeMeshTileScenegraph(
  scenegraph: GLTFScenegraph,
  meshIndex: number
): ArrayBuffer {
  const nodeIndex = scenegraph.addNode({meshIndex});
  const sceneIndex = scenegraph.addScene({nodeIndices: [nodeIndex]});
  scenegraph.setDefaultScene(sceneIndex);
  scenegraph.createBinaryChunk();
  return GLTFWriter.encodeSync!(scenegraph.gltf);
}

/** Validates the shared mesh profile; spatial preparation may retain Float64 positions internally. */
export function validateMeshGeometry(
  mesh: MeshGeometry,
  allowFloat64Positions = false
): MeshGeometry {
  if (mesh.topology !== 'triangle-list' || mesh.mode !== 4) {
    throw new TileConversionError(
      'MESH_TOPOLOGY_UNSUPPORTED',
      'Only triangle-list mode 4 is supported'
    );
  }
  for (const name of Object.keys(mesh.attributes)) {
    if (name !== 'POSITION' && name !== 'NORMAL' && name !== 'COLOR_0' && name !== 'TEXCOORD_0') {
      throw new TileConversionError(
        'MESH_ATTRIBUTE_UNSUPPORTED',
        `Mesh attribute ${name} is unsupported`
      );
    }
  }
  const positions = getFloatAttribute(mesh.attributes.POSITION, 'POSITION', allowFloat64Positions);
  const attributes: Record<string, MeshAttribute> = {
    POSITION: {value: positions, size: 3}
  };
  if (mesh.attributes.NORMAL) {
    const normals = getFloatAttribute(mesh.attributes.NORMAL, 'NORMAL');
    if (normals.length !== positions.length) {
      throw new TileConversionError(
        'MESH_NORMAL_COUNT_MISMATCH',
        'NORMAL count must match POSITION count'
      );
    }
    for (let index = 0; index < normals.length; index += 3) {
      if (
        Math.abs(Math.hypot(normals[index], normals[index + 1], normals[index + 2]) - 1) > 0.0001
      ) {
        throw new TileConversionError(
          'MESH_NORMAL_INVALID',
          'NORMAL vectors must have unit length'
        );
      }
    }
    attributes.NORMAL = {value: normals, size: 3};
  }
  if ('COLOR_0' in mesh.attributes) {
    const colors = mesh.attributes.COLOR_0;
    const normalized = isNormalizedUnsignedAttribute(colors);
    if (
      !colors ||
      !(colors.value instanceof Float32Array || normalized) ||
      (colors.size !== 3 && colors.size !== 4) ||
      colors.value.length / colors.size !== positions.length / 3 ||
      (colors.value instanceof Float32Array &&
        colors.value.some(value => !Number.isFinite(value) || value < 0 || value > 1))
    ) {
      throw new TileConversionError(
        'MESH_COLOR_INVALID',
        'COLOR_0 requires packed linear RGB/RGBA: Float32 in [0, 1] or normalized Uint8/Uint16, one per vertex'
      );
    }
    validateAttributeLayout(colors, 'COLOR_0', normalized);
    attributes.COLOR_0 = {
      value: colors.value,
      size: colors.size,
      ...(normalized ? {normalized: true} : {})
    };
  }
  if ('TEXCOORD_0' in mesh.attributes) {
    const textureCoordinates = mesh.attributes.TEXCOORD_0;
    const normalized = isNormalizedUnsignedAttribute(textureCoordinates);
    if (
      !textureCoordinates ||
      !(textureCoordinates.value instanceof Float32Array || normalized) ||
      textureCoordinates.size !== 2 ||
      textureCoordinates.value.length / 2 !== positions.length / 3 ||
      textureCoordinates.value.some(value => !Number.isFinite(value))
    ) {
      throw new TileConversionError(
        'MESH_TEXCOORD_INVALID',
        'TEXCOORD_0 requires packed finite Float32 or normalized Uint8/Uint16 UV pairs, one per vertex'
      );
    }
    validateAttributeLayout(textureCoordinates, 'TEXCOORD_0', normalized);
    attributes.TEXCOORD_0 = {
      value: textureCoordinates.value,
      size: 2,
      ...(normalized ? {normalized: true} : {})
    };
  }
  const indices = validateMeshIndices(mesh.indices, positions.length / 3);
  if (!indices && positions.length % 9 !== 0) {
    throw new TileConversionError(
      'MESH_TRIANGLE_COUNT_INVALID',
      'Nonindexed meshes require complete triangles'
    );
  }
  return {
    topology: 'triangle-list',
    mode: 4,
    attributes,
    indices: indices ? {value: indices, size: 1} : undefined
  };
}

/** Reads one finite packed xyz attribute without changing its storage. */
function getFloatAttribute(
  attribute: MeshAttribute | undefined,
  name: string,
  allowFloat64 = false
): Float32Array | Float64Array {
  if (
    !attribute ||
    !(
      attribute.value instanceof Float32Array ||
      (allowFloat64 && attribute.value instanceof Float64Array)
    ) ||
    attribute.size !== 3 ||
    attribute.value.length === 0 ||
    attribute.value.length % 3 !== 0
  ) {
    throw new TileConversionError(
      'MESH_ATTRIBUTE_INVALID',
      `${name} must contain packed ${allowFloat64 ? 'Float32 or Float64' : 'Float32'} xyz triples`
    );
  }
  validateAttributeLayout(attribute, name);
  if (attribute.value.some(value => !Number.isFinite(value))) {
    throw new TileConversionError('MESH_ATTRIBUTE_NONFINITE', `${name} must contain finite values`);
  }
  return attribute.value;
}

/** Validates packed indices for triangle lists or strips, including glTF primitive-restart rules. */
export function validateMeshIndices(
  attribute: MeshAttribute | undefined,
  vertexCount: number,
  primitiveMode: 4 | 5 = 4
): Uint8Array | Uint16Array | Uint32Array | undefined {
  if (!attribute) return undefined;
  validateAttributeLayout(attribute, 'indices');
  const values = attribute.value;
  if (
    attribute.size !== 1 ||
    !(
      values instanceof Uint8Array ||
      values instanceof Uint16Array ||
      values instanceof Uint32Array
    )
  ) {
    throw new TileConversionError(
      'MESH_INDICES_INVALID',
      'Indices must contain packed unsigned integer scalars'
    );
  }
  if (primitiveMode === 5 ? values.length < 3 : values.length === 0 || values.length % 3 !== 0) {
    throw new TileConversionError(
      'MESH_TRIANGLE_COUNT_INVALID',
      'Indices must contain complete triangles or at least three strip vertices'
    );
  }
  const restartIndex = 2 ** (values.BYTES_PER_ELEMENT * 8) - 1;
  if (values.some(value => value >= vertexCount || value === restartIndex)) {
    throw new TileConversionError(
      'MESH_INDEX_OUT_OF_RANGE',
      'Indices must reference existing vertices and exclude primitive-restart values'
    );
  }
  return values;
}

/** Identifies explicitly normalized unsigned storage supported by the appearance profile. */
function isNormalizedUnsignedAttribute(attribute: MeshAttribute | undefined): boolean {
  return (
    attribute?.normalized === true &&
    (attribute.value instanceof Uint8Array || attribute.value instanceof Uint16Array)
  );
}

/** Rejects descriptor layouts and transforms the initial mesh profile cannot represent. */
function validateAttributeLayout(
  attribute: MeshAttribute,
  name: string,
  allowNormalized = false
): void {
  if (
    (attribute.byteOffset ?? 0) !== 0 ||
    (attribute.byteStride ?? 0) !== 0 ||
    (attribute.normalized && !allowNormalized) ||
    attribute.transform ||
    attribute.componentType
  ) {
    throw new TileConversionError(
      'MESH_ATTRIBUTE_LAYOUT_UNSUPPORTED',
      `${name} must use packed contiguous storage with supported normalization`
    );
  }
}

/** Validates and maps the deliberately limited material profile without changing caller objects. */
function validateMeshMaterial(
  material: MeshTileMaterial,
  scenegraph: GLTFScenegraph,
  hasTextureCoordinates: boolean
): object {
  if (!material || typeof material !== 'object' || Array.isArray(material)) {
    throw new TileConversionError('MESH_MATERIAL_INVALID', 'Material must be an object');
  }
  const allowedProperties = [
    'baseColorFactor',
    'baseColorTexture',
    'metallicFactor',
    'roughnessFactor',
    'alphaMode',
    'alphaCutoff',
    'doubleSided'
  ];
  for (const name of Object.keys(material)) {
    if (!allowedProperties.includes(name)) {
      throw new TileConversionError(
        'MESH_MATERIAL_UNSUPPORTED',
        `Material property ${name} is unsupported`
      );
    }
  }
  const {baseColorFactor, metallicFactor, roughnessFactor, alphaMode, alphaCutoff, doubleSided} =
    material;
  if (
    (baseColorFactor !== undefined &&
      (!Array.isArray(baseColorFactor) ||
        baseColorFactor.length !== 4 ||
        Array.from(baseColorFactor).some(
          value => !Number.isFinite(value) || value < 0 || value > 1
        ))) ||
    [metallicFactor, roughnessFactor].some(
      value => value !== undefined && (!Number.isFinite(value) || value < 0 || value > 1)
    ) ||
    (alphaMode !== undefined && !['OPAQUE', 'MASK', 'BLEND'].includes(alphaMode)) ||
    (alphaCutoff !== undefined &&
      (alphaMode !== 'MASK' || !Number.isFinite(alphaCutoff) || alphaCutoff < 0)) ||
    (doubleSided !== undefined && typeof doubleSided !== 'boolean')
  ) {
    throw new TileConversionError(
      'MESH_MATERIAL_INVALID',
      'Material values must satisfy the selected glTF profile'
    );
  }
  return {
    pbrMetallicRoughness: {
      baseColorFactor: baseColorFactor ? [...baseColorFactor] : undefined,
      metallicFactor,
      roughnessFactor,
      baseColorTexture:
        'baseColorTexture' in material
          ? encodeBaseColorTexture(material.baseColorTexture, scenegraph, hasTextureCoordinates)
          : undefined
    },
    alphaMode,
    alphaCutoff,
    doubleSided
  };
}

/** Embeds an explicitly selected image without decoding pixels or changing sampler/UV semantics. */
function encodeBaseColorTexture(
  texture: MeshTileTexture | undefined,
  scenegraph: GLTFScenegraph,
  hasTextureCoordinates: boolean
): {index: number; extensions?: {KHR_texture_transform: MeshTileTextureTransform}} {
  if (
    !texture ||
    Object.keys(texture).some(
      name => name !== 'data' && name !== 'mimeType' && name !== 'sampler' && name !== 'transform'
    ) ||
    !(texture.data instanceof Uint8Array) ||
    !['image/png', 'image/jpeg'].includes(texture.mimeType)
  ) {
    throw new TileConversionError(
      'MESH_TEXTURE_INVALID',
      'Base-color texture must supply Uint8Array data, image/png or image/jpeg mimeType, and optional sampling/transform controls'
    );
  }
  if (!hasTextureCoordinates) {
    throw new TileConversionError(
      'MESH_TEXCOORD_REQUIRED',
      'Base-color texture requires TEXCOORD_0'
    );
  }
  const image = new DataView(texture.data.buffer, texture.data.byteOffset, texture.data.byteLength);
  let metadata;
  try {
    metadata = getBinaryImageMetadata(image);
  } catch {
    // Malformed encoded headers must produce the same typed diagnostic as unrecognized headers.
  }
  if (
    !metadata ||
    metadata.mimeType !== texture.mimeType ||
    metadata.width <= 0 ||
    metadata.height <= 0
  ) {
    throw new TileConversionError(
      'MESH_TEXTURE_INVALID',
      'Image header must match mimeType and declare positive dimensions'
    );
  }
  const samplerIndex =
    'sampler' in texture ? scenegraph.addSampler(validateMeshSampler(texture.sampler)) : undefined;
  const transform =
    'transform' in texture ? validateMeshTextureTransform(texture.transform) : undefined;
  if (transform) scenegraph.registerRequiredExtension('KHR_texture_transform');
  return {
    ...(transform ? {extensions: {KHR_texture_transform: transform}} : {}),
    index: scenegraph.addTexture({
      imageIndex: scenegraph.addImage(image, texture.mimeType),
      samplerIndex
    })
  };
}

/** Validates the four sampling controls without silently discarding unsupported properties. */
function validateMeshSampler(sampler: MeshTileSampler | undefined): MeshTileSampler {
  if (!sampler || typeof sampler !== 'object' || Array.isArray(sampler)) {
    throw new TileConversionError('MESH_SAMPLER_INVALID', 'Sampler must be an object');
  }
  const allowedValues = {
    wrapS: [33071, 33648, 10497],
    wrapT: [33071, 33648, 10497],
    magFilter: [9728, 9729],
    minFilter: [9728, 9729, 9984, 9985, 9986, 9987]
  };
  for (const name in sampler) {
    if (!Object.hasOwn(allowedValues, name)) {
      throw new TileConversionError(
        'MESH_SAMPLER_UNSUPPORTED',
        `Sampler property ${name} is unsupported`
      );
    }
  }
  const selectedSampler = {
    wrapS: sampler.wrapS,
    wrapT: sampler.wrapT,
    minFilter: sampler.minFilter,
    magFilter: sampler.magFilter
  };
  for (const name of Object.keys(allowedValues)) {
    const property = name as keyof MeshTileSampler;
    if (
      selectedSampler[property] !== undefined &&
      !allowedValues[property].includes(selectedSampler[property]!)
    ) {
      throw new TileConversionError(
        'MESH_SAMPLER_INVALID',
        `Sampler ${name} must use a glTF wrapping/filtering value`
      );
    }
  }
  return selectedSampler;
}

/** Copies finite UV controls and rejects unmapped extension semantics. */
function validateMeshTextureTransform(
  transform: MeshTileTextureTransform | undefined
): MeshTileTextureTransform {
  if (!transform || typeof transform !== 'object' || Array.isArray(transform)) {
    throw new TileConversionError(
      'MESH_TEXTURE_TRANSFORM_INVALID',
      'Texture transform must be an object'
    );
  }
  for (const name in transform) {
    if (name !== 'offset' && name !== 'rotation' && name !== 'scale') {
      throw new TileConversionError(
        'MESH_TEXTURE_TRANSFORM_UNSUPPORTED',
        `Texture transform property ${name} is unsupported`
      );
    }
  }
  const {offset, rotation, scale} = transform;
  const offsetValues =
    Array.isArray(offset) && offset.length === 2 ? [offset[0], offset[1]] : offset;
  const scaleValues = Array.isArray(scale) && scale.length === 2 ? [scale[0], scale[1]] : scale;
  if (
    [offsetValues, scaleValues].some(
      value =>
        value !== undefined &&
        (!Array.isArray(value) ||
          value.length !== 2 ||
          value.some(component => !Number.isFinite(component)))
    ) ||
    (rotation !== undefined && !Number.isFinite(rotation))
  ) {
    throw new TileConversionError(
      'MESH_TEXTURE_TRANSFORM_INVALID',
      'Texture transform requires finite UV pairs and a finite rotation'
    );
  }
  return {
    offset: offsetValues === undefined ? undefined : [offsetValues[0], offsetValues[1]],
    rotation,
    scale: scaleValues === undefined ? undefined : [scaleValues[0], scaleValues[1]]
  };
}
