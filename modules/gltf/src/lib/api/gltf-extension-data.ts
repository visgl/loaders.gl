// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {GLTF, GLTFMaterial, GLTFAccessor} from '../types/gltf-json-schema';
import type {GLTFWithBuffers} from '../types/gltf-types';
import type {
  GLTFMaterialVariant,
  GLTFMaterialVariantMapping,
  GLTFXMPPacket,
  GLTF_KHR_xmp_json_ld_reference
} from '../types/gltf-additional-extension-schemas';

/** Material variant mapping resolved against the original document. */
export type GLTFMaterialVariantData = {
  /** Mesh containing the primitive. */
  meshIndex: number;
  /** Primitive within the mesh. */
  primitiveIndex: number;
  /** Original mapping with its serialized references. */
  mapping: GLTFMaterialVariantMapping;
  /** Material selected by this mapping. */
  material: GLTFMaterial;
  /** Named variants associated with this material. */
  variants: GLTFMaterialVariant[];
};

/** Lazy GPU instance attributes attached to a mesh node. */
export type GLTFMeshInstanceData = {
  /** Node containing the instanced mesh. */
  nodeIndex: number;
  /** Referenced mesh index. */
  meshIndex: number;
  /** Number of instances shared by all attributes. */
  count: number;
  /** Original accessor indices, including custom attributes. */
  attributes: Readonly<Record<string, number>>;
  /** Accessor declarations without materializing instance arrays. */
  accessors: Readonly<Record<string, GLTFAccessor>>;
};

/** Returns material variant mappings with material and named variant references resolved. */
export function getMaterialVariantMappings(
  gltf: GLTF | GLTFWithBuffers
): GLTFMaterialVariantData[] {
  const json = getDocument(gltf);
  const variants = json.extensions?.KHR_materials_variants?.variants || [];
  const descriptors: GLTFMaterialVariantData[] = [];
  for (const [meshIndex, mesh] of (json.meshes || []).entries()) {
    for (const [primitiveIndex, primitive] of mesh.primitives.entries()) {
      const mappings = primitive.extensions?.KHR_materials_variants?.mappings || [];
      for (const mapping of mappings) {
        descriptors.push({
          meshIndex,
          primitiveIndex,
          mapping,
          material: getReference(json.materials || [], mapping.material, 'material'),
          variants: mapping.variants.map(index => getReference(variants, index, 'variant'))
        });
      }
    }
  }
  return descriptors;
}

/** Returns lazy GPU instance descriptors, checking mesh references and equal attribute counts. */
export function getMeshInstances(gltf: GLTF | GLTFWithBuffers): GLTFMeshInstanceData[] {
  const json = getDocument(gltf);
  const descriptors: GLTFMeshInstanceData[] = [];
  for (const [nodeIndex, node] of (json.nodes || []).entries()) {
    const extension = node.extensions?.EXT_mesh_gpu_instancing;
    if (!extension) continue;
    const meshIndex = node.mesh;
    getReference(json.meshes || [], meshIndex, 'instanced mesh');
    const accessors: Record<string, GLTFAccessor> = {};
    let count: number | undefined;
    for (const [attribute, accessorIndex] of Object.entries(extension.attributes)) {
      const accessor = getReference(json.accessors || [], accessorIndex, 'instance accessor');
      if (count !== undefined && count !== accessor.count) {
        throw new Error('EXT_mesh_gpu_instancing: instance accessor counts must match.');
      }
      count = accessor.count;
      accessors[attribute] = accessor;
    }
    if (count === undefined)
      throw new Error('EXT_mesh_gpu_instancing: requires instance attributes.');
    descriptors.push({
      nodeIndex,
      meshIndex: meshIndex!,
      count,
      attributes: {...extension.attributes},
      accessors
    });
  }
  return descriptors;
}

/** Resolves an object's XMP packet without interpreting JSON-LD or fetching namespace URLs. */
export function getXMPMetadata(
  gltf: GLTF | GLTFWithBuffers,
  object: {extensions?: Record<string, unknown>}
): GLTFXMPPacket | undefined {
  const reference = object.extensions?.KHR_xmp_json_ld as
    | GLTF_KHR_xmp_json_ld_reference
    | undefined;
  if (!reference) return undefined;
  return getReference(
    getDocument(gltf).extensions?.KHR_xmp_json_ld?.packets || [],
    reference.packet,
    'XMP packet'
  );
}

/** Gets source JSON from either a raw document or a loader result. */
function getDocument(gltf: GLTF | GLTFWithBuffers): GLTF {
  return 'json' in gltf ? (gltf as GLTFWithBuffers).json : (gltf as GLTF);
}

/** Resolves an extension index and reports broken references without mutating the document. */
function getReference<Value>(values: Value[], index: number | undefined, kind: string): Value {
  if (index === undefined || !Number.isInteger(index) || index < 0 || !values[index]) {
    throw new Error(`glTF: invalid ${kind} index ${index}.`);
  }
  return values[index];
}
