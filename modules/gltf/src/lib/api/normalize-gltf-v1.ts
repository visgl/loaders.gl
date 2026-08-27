// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable camelcase */
import * as KHR_binary_glTF from '../extensions/KHR_binary_gltf';
import type {GLTFWithBuffers} from '../types/gltf-types';

// Binary format changes (mainly implemented by GLBLoader)
// https://github.com/KhronosGroup/glTF/tree/master/extensions/1.0/Khronos/KHR_binary_glTF

// JSON format changes:
// https://github.com/khronosgroup/gltf/issues/605

// - [x] Top-level JSON objects are arrays now
// - [ ] Removed indirection from animation: sampler now refers directly to accessors, #712
// - [ ] material.parameter.value and technique.parameter.value must be an array, #690
// - [ ] Node can have only one mesh #821
// - [ ] Added reqs on JSON encoding
// - [ ] Added reqs on binary data alignment #802 (comment)

// Additions:
// - [ ] Added accessor.normalized, #691, #706
// - [ ] Added glExtensionsUsed property and 5125 (UNSIGNED_INT) accessor.componentType value, #619
// - [ ] Added extensionsRequired property, #720, #721
// - [ ] Added "STEP" as valid animation.sampler.interpolation value, #712

// Removals:
// - [x] Removed buffer.type, #786, #629
// - [ ] Removed revision number from profile.version, #709
// - [ ] Removed technique.functions.scissor and removed 3089 (SCISSOR_TEST) as a valid value for technique.states.enable, #681
// - [ ] Techniques, programs, and shaders were moved out to KHR_technique_webgl extension.

// Other edits:
// - [x] asset is now required, #642
// - [ ] buffer.byteLength and bufferView.byteLength are now required, #560.
// - [ ] accessor.min and accessor.max are now required, #593, and clarified that the JSON value and binary data must be the same, #628.
// - [ ] Clarified animation.sampler and animation.channel restrictions, #712
// - [ ] skin.inverseBindMatrices is now optional, #461.
// - [ ] Attribute parameters can't have a value defined in the technique or parameter, #563 (comment).
// - [ ] Only TEXCOORD and COLOR attribute semantics can be written in the form [semantic]_[set_index], #563 (comment).
// - [ ] TEXCOORD and COLOR attribute semantics must be written in the form [semantic]_[set_index], e.g., just TEXCOORD should be TEXCOORD_0, and just COLOR should be COLOR_0, #649
// - [ ] camera.perspective.aspectRatio and camera.perspective.yfov must now be > 0, not >= 0, #563 (comment).
// - [ ] Application-specific parameter semantics must start with an underscore, e.g., _TEMPERATURE and _SIMULATION_TIME, #563 (comment).
// - [ ] Properties in technique.parameters must be defined in technique.uniforms or technique.attributes,

// #563 (comment).
// - [ ] technique.parameter.count can only be defined when the semantic is JOINTMATRIX or an application-specific semantic is used. It can never be defined for attribute parameters; only uniforms, d2f6945
// - [ ] technique.parameter.semantic is required when the parameter is an attribute, 28e113d
// - [ ] Mesh-only models are allowed, e.g., without materials, #642
// - [ ] Skeleton hierarchies (nodes containing jointName) must be separated from non-skeleton hierarchies., #647
// - [ ] technique.states.functions.blendColor and technique.states.functions.depthRange parameters now must match WebGL function min/max, #707

const GLTF_ARRAYS = {
  accessors: 'accessor',
  animations: 'animation',
  buffers: 'buffer',
  bufferViews: 'bufferView',
  images: 'image',
  materials: 'material',
  meshes: 'mesh',
  nodes: 'node',
  samplers: 'sampler',
  scenes: 'scene',
  skins: 'skin',
  textures: 'texture'
};

const GLTF_KEYS = {
  accessor: 'accessors',
  animations: 'animation',
  buffer: 'buffers',
  bufferView: 'bufferViews',
  image: 'images',
  material: 'materials',
  mesh: 'meshes',
  node: 'nodes',
  sampler: 'samplers',
  scene: 'scenes',
  skin: 'skins',
  texture: 'textures'
};

/** Diagnostics emitted while converting a glTF 1 asset to glTF 2. */
export type GLTFV1NormalizationReport = {
  /** Whether a glTF 1 asset was detected and converted. */
  converted: boolean;
  /** Whether the input JSON was mutated in place. */
  mutated: boolean;
  /** Features that could not be represented without loss. */
  unsupported: string[];
  /** Non-fatal conversion notes. */
  warnings: string[];
};

/** Options for glTF 1 to glTF 2 conversion. */
export type GLTFV1NormalizationOptions = {
  /** Enable conversion. `'strict'` rejects unsupported features; other values are best effort. */
  normalize?: boolean | 'best-effort' | 'strict';
  /** Mutate the supplied JSON. Defaults to true for backwards compatibility. */
  mutate?: boolean;
};

/**
 * Converts (normalizes) glTF v1 to v2
 */
class GLTFV1Normalizer {
  idToIndexMap = {
    animations: {},
    accessors: {},
    buffers: {},
    bufferViews: {},
    images: {},
    materials: {},
    meshes: {},
    nodes: {},
    samplers: {},
    scenes: {},
    skins: {},
    textures: {}
  };

  json;
  report: GLTFV1NormalizationReport = {
    converted: false,
    mutated: true,
    unsupported: [],
    warnings: []
  };
  strict = false;

  // constructor() {}

  /**
   * Convert (normalize) glTF < 2.0 to glTF 2.0
   * @param gltf - object with json and binChunks
   * @param options
   * @param options normalize Whether to actually normalize
   */
  normalize(gltf, options: GLTFV1NormalizationOptions = {}): GLTFV1NormalizationReport {
    if (options.mutate === false) {
      const converted = {...gltf, json: JSON.parse(JSON.stringify(gltf.json))};
      const report = new GLTFV1Normalizer().normalize(converted, {...options, mutate: true});
      report.mutated = false;
      return report;
    }
    this.strict = options.normalize === 'strict';
    this.report.mutated = true;
    this.json = gltf.json;
    const json = gltf.json;

    // Check version
    switch (json.asset && json.asset.version) {
      // We are converting to v2 format. Return if there is nothing to do
      case '2.0':
        return this.report;

      // This class is written to convert 1.0
      case undefined:
      case '1.0':
        break;

      default:
        // eslint-disable-next-line no-undef, no-console
        console.warn(`glTF: Unknown version ${json.asset.version}`);
        this._warning(`Unknown glTF version ${json.asset.version}`);
        return this.report;
    }

    if (!options.normalize) {
      // We are still missing a few conversion tricks, remove once addressed
      throw new Error('glTF v1 is not supported.');
    }

    this.report.converted = true;

    // eslint-disable-next-line no-undef, no-console
    console.warn('Converting glTF v1 to glTF v2 format. This is experimental and may fail.');

    this._addAsset(json);

    // In glTF2 top-level fields are Arrays not Object maps
    this._convertTopLevelObjectsToArrays(json);

    // Extract bufferView indices for images
    // (this extension needs to be invoked early in the normalization process)
    // TODO can this be handled by standard extension processing instead of called explicitly?
    KHR_binary_glTF.preprocess(gltf);

    // Convert object references from ids to indices
    this._convertObjectIdsToArrayIndices(json);

    this._updateObjects(json);

    this._updateMaterial(json);
    this._updateAnimations(json);
    this._updateNodes(json);
    this._preserveLegacyResources(json);
    this._finishReport();
    return this.report;
  }

  /** Record a feature that requires a lossy best-effort conversion. */
  _unsupported(feature: string): void {
    this.report.unsupported.push(feature);
    if (this.strict) {
      throw new Error(`glTF v1 normalization does not support ${feature}`);
    }
  }

  /** Add a diagnostic without rejecting conversion. */
  _warning(message: string): void {
    this.report.warnings.push(message);
  }

  // asset is now required, #642 https://github.com/KhronosGroup/glTF/issues/639
  _addAsset(json) {
    json.asset = json.asset || {};
    // We are normalizing to glTF v2, so change version to "2.0"
    json.asset.version = '2.0';
    json.asset.generator = json.asset.generator || 'Normalized to glTF 2.0 by loaders.gl';
  }

  _convertTopLevelObjectsToArrays(json) {
    // TODO check that all arrays are covered
    for (const arrayName in GLTF_ARRAYS) {
      this._convertTopLevelObjectToArray(json, arrayName);
    }
  }

  /** Convert one top level object to array */
  _convertTopLevelObjectToArray(json, mapName) {
    const objectMap = json[mapName];
    if (!objectMap || Array.isArray(objectMap)) {
      return;
    }

    // Rewrite the top-level field as an array
    json[mapName] = [];
    // Copy the map key into object.id
    for (const id in objectMap) {
      const object = objectMap[id];
      object.id = object.id || id; // Mutates the loaded object
      const index = json[mapName].length;
      json[mapName].push(object);
      this.idToIndexMap[mapName][id] = index;
    }
  }

  /** Go through all objects in all top-level arrays and replace ids with indices */
  _convertObjectIdsToArrayIndices(json) {
    for (const arrayName in GLTF_ARRAYS) {
      this._convertIdsToIndices(json, arrayName);
    }
    if ('scene' in json) {
      json.scene = this._convertIdToIndex(json.scene, 'scene');
    }

    // Convert any index references that are not using array names

    // texture.source (image)
    for (const texture of json.textures) {
      this._convertTextureIds(texture);
    }
    for (const mesh of json.meshes) {
      this._convertMeshIds(mesh);
    }
    for (const node of json.nodes) {
      this._convertNodeIds(node);
    }
    for (const node of json.scenes) {
      this._convertSceneIds(node);
    }
  }

  _convertTextureIds(texture) {
    if (texture.source) {
      texture.source = this._convertIdToIndex(texture.source, 'image');
    }
  }

  _convertMeshIds(mesh) {
    for (const primitive of mesh.primitives) {
      const {attributes, indices, material} = primitive;
      for (const attributeName in attributes) {
        attributes[attributeName] = this._convertIdToIndex(attributes[attributeName], 'accessor');
      }
      if (indices) {
        primitive.indices = this._convertIdToIndex(indices, 'accessor');
      }
      if (material) {
        primitive.material = this._convertIdToIndex(material, 'material');
      }
    }
  }

  _convertNodeIds(node) {
    if (node.children) {
      node.children = node.children.map(child => this._convertIdToIndex(child, 'node'));
    }
    if (node.meshes) {
      node.meshes = node.meshes.map(mesh => this._convertIdToIndex(mesh, 'mesh'));
    }
  }

  _convertSceneIds(scene) {
    if (scene.nodes) {
      scene.nodes = scene.nodes.map(node => this._convertIdToIndex(node, 'node'));
    }
  }

  /** Go through all objects in a top-level array and replace ids with indices */
  _convertIdsToIndices(json, topLevelArrayName) {
    if (!json[topLevelArrayName]) {
      console.warn(`gltf v1: json doesn't contain attribute ${topLevelArrayName}`); // eslint-disable-line no-console, no-undef
      json[topLevelArrayName] = [];
    }
    for (const object of json[topLevelArrayName]) {
      for (const key in object) {
        const id = object[key];
        const index = this._convertIdToIndex(id, key);
        object[key] = index;
      }
    }
  }

  _convertIdToIndex(id, key) {
    const arrayName = GLTF_KEYS[key];
    if (arrayName in this.idToIndexMap) {
      const index = this.idToIndexMap[arrayName][id];
      if (!Number.isFinite(index)) {
        throw new Error(`gltf v1: failed to resolve ${key} with id ${id}`);
      }
      return index;
    }
    return id;
  }

  /**
   *
   * @param {*} json
   */
  _updateObjects(json) {
    for (const buffer of this.json.buffers) {
      // - [x] Removed buffer.type, #786, #629
      delete buffer.type;
    }
  }

  /**
   * Update material (set pbrMetallicRoughness)
   * @param {*} json
   */
  _updateMaterial(json) {
    for (const material of json.materials) {
      material.extras = {
        ...material.extras,
        gltf1: {technique: material.technique, values: material.values}
      };

      const textureId =
        material.values?.tex ||
        material.values?.texture2d_0 ||
        material.values?.diffuseTex ||
        material.values?.diffuse;
      const textureIndex = json.textures.findIndex(texture => texture.id === textureId);
      if (textureIndex !== -1) {
        material.pbrMetallicRoughness ||= {
          baseColorFactor: [1, 1, 1, 1],
          metallicFactor: 1,
          roughnessFactor: 1
        };
        material.pbrMetallicRoughness.baseColorTexture = {index: textureIndex};
      } else if (material.technique || material.values) {
        this._unsupported(`material technique ${material.technique || '<unnamed>'}`);
      }
    }
  }

  /** Convert glTF 1 animation sampler maps and channel targets to glTF 2 arrays and indices. */
  _updateAnimations(json): void {
    for (const animation of json.animations || []) {
      if (!animation.samplers || Array.isArray(animation.samplers)) {
        continue;
      }
      const samplerIndices: Record<string, number> = {};
      const samplers: any[] = [];
      const parameters = animation.parameters || {};
      for (const samplerId of Object.keys(animation.samplers)) {
        const sampler = animation.samplers[samplerId];
        const input = parameters[sampler.input] || sampler.input;
        const output = parameters[sampler.output] || sampler.output;
        sampler.input = this._convertIdToIndex(input, 'accessor');
        sampler.output = this._convertIdToIndex(output, 'accessor');
        sampler.interpolation ||= 'LINEAR';
        samplerIndices[samplerId] = samplers.length;
        samplers.push(sampler);
      }
      animation.samplers = samplers;
      for (const channel of animation.channels || []) {
        if (typeof channel.sampler === 'string') {
          channel.sampler = samplerIndices[channel.sampler];
        }
        if (channel.target?.id !== undefined) {
          channel.target.node = this._convertIdToIndex(channel.target.id, 'node');
          delete channel.target.id;
        }
      }
    }
  }

  /** Split glTF 1 nodes that reference multiple meshes into glTF 2-compatible nodes. */
  _updateNodes(json): void {
    const nodes = json.nodes || [];
    for (let nodeIndex = 0; nodeIndex < nodes.length; nodeIndex++) {
      const node = nodes[nodeIndex];
      if (!Array.isArray(node.meshes)) {
        continue;
      }
      const meshIndices = node.meshes;
      delete node.meshes;
      node.mesh = meshIndices.shift();
      for (const meshIndex of meshIndices) {
        const extraNode = {...node, mesh: meshIndex, children: undefined};
        delete extraNode.id;
        nodes.push(extraNode);
        node.children ||= [];
        node.children.push(nodes.length - 1);
      }
    }
  }

  /** Preserve v1 techniques, programs, and shaders without pretending they are PBR materials. */
  _preserveLegacyResources(json): void {
    const resources = {};
    for (const resourceName of ['techniques', 'programs', 'shaders']) {
      if (json[resourceName]) {
        resources[resourceName] = json[resourceName];
        delete json[resourceName];
        this._unsupported(`legacy ${resourceName}`);
      }
    }
    if (Object.keys(resources).length) {
      json.extras = {...json.extras, gltf1Resources: resources};
    }
  }

  /** Finalize report diagnostics. */
  _finishReport(): void {
    if (this.report.unsupported.length) {
      this._warning(
        `Converted glTF v1 with unsupported features: ${this.report.unsupported.join(', ')}`
      );
    }
  }
}

/** Normalize a glTF 1 asset in place, preserving the historical loader behavior. */
export function normalizeGLTFV1(
  gltf: GLTFWithBuffers,
  options: GLTFV1NormalizationOptions = {}
): GLTFV1NormalizationReport {
  return new GLTFV1Normalizer().normalize(gltf, options);
}

/** Convert glTF 1 JSON without mutating the caller-owned asset or its binary buffers. */
export function convertGLTFV1ToGLTF2(
  gltf: GLTFWithBuffers,
  options: Omit<GLTFV1NormalizationOptions, 'mutate'> = {}
): GLTFWithBuffers & {normalizationReport: GLTFV1NormalizationReport} {
  const converted = {...gltf, json: JSON.parse(JSON.stringify(gltf.json))};
  const normalizationReport = normalizeGLTFV1(converted, {
    normalize: options.normalize || 'best-effort',
    mutate: true
  });
  normalizationReport.mutated = false;
  return {...converted, normalizationReport};
}
