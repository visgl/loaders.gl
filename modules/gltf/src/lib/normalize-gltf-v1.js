/* eslint-disable camelcase */
import * as KHR_binary_glTF from './extensions/KHR_binary_gltf';

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

/**
 * Converts (normalizes) glTF v1 to v2
 */
class GLTFV1Normalizer {
  constructor(gltf) {
    this.idToIndexMap = {
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
  }

  /**
   * Convert (normalize) glTF < 2.0 to glTF 2.0
   * @param {*} gltf - object with json and binChunks
   * @param {object} options
   * @param {boolean} [options.normalize] Whether to actually normalize
   */
  normalize(gltf, options) {
    this.json = gltf.json;
    const json = gltf.json;

    // Check version
    switch (json.asset && json.asset.version) {
      // We are converting to v2 format. Return if there is nothing to do
      case '2.0':
        return;

      // This class is written to convert 1.0
      case undefined:
      case '1.0':
        break;

      default:
        // eslint-disable-next-line no-undef, no-console
        console.warn(`glTF: Unknown version ${json.asset.version}`);
        return;
    }

    if (!options.normalize) {
      // We are still missing a few conversion tricks, remove once addressed
      throw new Error('glTF v1 is not supported.');
    }

    // eslint-disable-next-line no-undef, no-console
    console.warn('Converting glTF v1 to glTF v2 format. This is experimental and may fail.');

    this._addAsset(json);

    // In glTF2 top-level fields are Arrays not Object maps
    this._convertTopLevelObjectsToArrays(json);

    // Extract bufferView indices for images
    // (this extension needs to be invoked early in the normalization process)
    KHR_binary_glTF.decode(gltf, options);

    // Convert object references from ids to indices
    this._convertObjectIdsToArrayIndices(json);

    this._updateObjects(json);
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
  }

  _convertSceneIds(scene) {
    if (scene.nodes) {
      scene.nodes = scene.nodes.map(node => this._convertIdToIndex(node, 'node'));
    }
  }

  /** Go through all objects in a top-level array and replace ids with indices */
  _convertIdsToIndices(json, topLevelArrayName) {
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
}

export default function normalizeGLTFV1(gltf, options = {}) {
  return new GLTFV1Normalizer().normalize(gltf, options);
}
