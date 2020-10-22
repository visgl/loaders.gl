import assert from './utils/assert';
import {getAccessorArrayTypeAndLength} from './gltf-utils/gltf-utils';

// This is a post processor for loaded glTF files
// The goal is to make the loaded data easier to use in WebGL applications
//
// Functions:
// * Resolve indexed arrays structure of glTF into a linked tree.
// * Translate stringified enum keys and values into WebGL constants.
// * Load images (optional)

// ENUM LOOKUP

const COMPONENTS = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT2: 4,
  MAT3: 9,
  MAT4: 16
};

const BYTES = {
  5120: 1, // BYTE
  5121: 1, // UNSIGNED_BYTE
  5122: 2, // SHORT
  5123: 2, // UNSIGNED_SHORT
  5125: 4, // UNSIGNED_INT
  5126: 4 // FLOAT
};

const GL_SAMPLER = {
  // Sampler parameters
  TEXTURE_MAG_FILTER: 0x2800,
  TEXTURE_MIN_FILTER: 0x2801,
  TEXTURE_WRAP_S: 0x2802,
  TEXTURE_WRAP_T: 0x2803,

  // Sampler default values
  REPEAT: 0x2901,
  LINEAR: 0x2601,
  NEAREST_MIPMAP_LINEAR: 0x2702
};

const SAMPLER_PARAMETER_GLTF_TO_GL = {
  magFilter: GL_SAMPLER.TEXTURE_MAG_FILTER,
  minFilter: GL_SAMPLER.TEXTURE_MIN_FILTER,
  wrapS: GL_SAMPLER.TEXTURE_WRAP_S,
  wrapT: GL_SAMPLER.TEXTURE_WRAP_T
};

// When undefined, a sampler with repeat wrapping and auto filtering should be used.
// https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#texture
const DEFAULT_SAMPLER = {
  [GL_SAMPLER.TEXTURE_MAG_FILTER]: GL_SAMPLER.LINEAR,
  [GL_SAMPLER.TEXTURE_MIN_FILTER]: GL_SAMPLER.NEAREST_MIPMAP_LINEAR,
  [GL_SAMPLER.TEXTURE_WRAP_S]: GL_SAMPLER.REPEAT,
  [GL_SAMPLER.TEXTURE_WRAP_]: GL_SAMPLER.REPEAT
};

function getBytesFromComponentType(componentType) {
  return BYTES[componentType];
}

function getSizeFromAccessorType(type) {
  return COMPONENTS[type];
}

class GLTFPostProcessor {
  postProcess(gltf, options = {}) {
    const {json, buffers = [], images = [], baseUri = ''} = gltf;
    assert(json);

    this.baseUri = baseUri;
    this.json = json;
    this.buffers = buffers;
    this.images = images;

    this._resolveTree(this.json, options);

    return this.json;
  }

  // Convert indexed glTF structure into tree structure
  // cross-link index resolution, enum lookup, convenience calculations
  // eslint-disable-next-line complexity
  _resolveTree(json, options = {}) {
    if (json.bufferViews) {
      json.bufferViews = json.bufferViews.map((bufView, i) => this._resolveBufferView(bufView, i));
    }
    if (json.images) {
      json.images = json.images.map((image, i) => this._resolveImage(image, i));
    }
    if (json.samplers) {
      json.samplers = json.samplers.map((sampler, i) => this._resolveSampler(sampler, i));
    }
    if (json.textures) {
      json.textures = json.textures.map((texture, i) => this._resolveTexture(texture, i));
    }
    if (json.accessors) {
      json.accessors = json.accessors.map((accessor, i) => this._resolveAccessor(accessor, i));
    }
    if (json.materials) {
      json.materials = json.materials.map((material, i) => this._resolveMaterial(material, i));
    }
    if (json.meshes) {
      json.meshes = json.meshes.map((mesh, i) => this._resolveMesh(mesh, i));
    }
    if (json.nodes) {
      json.nodes = json.nodes.map((node, i) => this._resolveNode(node, i));
    }
    if (json.skins) {
      json.skins = json.skins.map((skin, i) => this._resolveSkin(skin, i));
    }
    if (json.scenes) {
      json.scenes = json.scenes.map((scene, i) => this._resolveScene(scene, i));
    }
    if (json.scene !== undefined) {
      json.scene = json.scenes[this.json.scene];
    }
  }

  getScene(index) {
    return this._get('scenes', index);
  }

  getNode(index) {
    return this._get('nodes', index);
  }

  getSkin(index) {
    return this._get('skins', index);
  }

  getMesh(index) {
    return this._get('meshes', index);
  }

  getMaterial(index) {
    return this._get('materials', index);
  }

  getAccessor(index) {
    return this._get('accessors', index);
  }

  getCamera(index) {
    return null; // TODO: fix this
  }

  getTexture(index) {
    return this._get('textures', index);
  }

  getSampler(index) {
    return this._get('samplers', index);
  }

  getImage(index) {
    return this._get('images', index);
  }

  getBufferView(index) {
    return this._get('bufferViews', index);
  }

  getBuffer(index) {
    return this._get('buffers', index);
  }

  _get(array, index) {
    // check if already resolved
    if (typeof index === 'object') {
      return index;
    }
    const object = this.json[array] && this.json[array][index];
    if (!object) {
      console.warn(`glTF file error: Could not find ${array}[${index}]`); // eslint-disable-line
    }
    return object;
  }

  // PARSING HELPERS

  _resolveScene(scene, index) {
    // scene = {...scene};
    scene.id = scene.id || `scene-${index}`;
    scene.nodes = (scene.nodes || []).map(node => this.getNode(node));
    return scene;
  }

  _resolveNode(node, index) {
    // node = {...node};
    node.id = node.id || `node-${index}`;
    if (node.children) {
      node.children = node.children.map(child => this.getNode(child));
    }
    if (node.mesh !== undefined) {
      node.mesh = this.getMesh(node.mesh);
    }
    if (node.camera !== undefined) {
      node.camera = this.getCamera(node.camera);
    }
    if (node.skin !== undefined) {
      node.skin = this.getSkin(node.skin);
    }
    return node;
  }

  _resolveSkin(skin, index) {
    // skin = {...skin};
    skin.id = skin.id || `skin-${index}`;
    skin.inverseBindMatrices = this.getAccessor(skin.inverseBindMatrices);
    return skin;
  }

  _resolveMesh(mesh, index) {
    // mesh = {...mesh};
    mesh.id = mesh.id || `mesh-${index}`;
    if (mesh.primitives) {
      mesh.primitives = mesh.primitives.map(primitive => {
        primitive = {...primitive};
        const attributes = primitive.attributes;
        primitive.attributes = {};
        for (const attribute in attributes) {
          primitive.attributes[attribute] = this.getAccessor(attributes[attribute]);
        }
        if (primitive.indices !== undefined) {
          primitive.indices = this.getAccessor(primitive.indices);
        }
        if (primitive.material !== undefined) {
          primitive.material = this.getMaterial(primitive.material);
        }
        return primitive;
      });
    }
    return mesh;
  }

  _resolveMaterial(material, index) {
    // material = {...material};
    material.id = material.id || `material-${index}`;
    if (material.normalTexture) {
      material.normalTexture = {...material.normalTexture};
      material.normalTexture.texture = this.getTexture(material.normalTexture.index);
    }
    if (material.occlusionTexture) {
      material.occlustionTexture = {...material.occlustionTexture};
      material.occlusionTexture.texture = this.getTexture(material.occlusionTexture.index);
    }
    if (material.emissiveTexture) {
      material.emmisiveTexture = {...material.emmisiveTexture};
      material.emissiveTexture.texture = this.getTexture(material.emissiveTexture.index);
    }

    if (material.pbrMetallicRoughness) {
      material.pbrMetallicRoughness = {...material.pbrMetallicRoughness};
      const mr = material.pbrMetallicRoughness;
      if (mr.baseColorTexture) {
        mr.baseColorTexture = {...mr.baseColorTexture};
        mr.baseColorTexture.texture = this.getTexture(mr.baseColorTexture.index);
      }
      if (mr.metallicRoughnessTexture) {
        mr.metallicRoughnessTexture = {...mr.metallicRoughnessTexture};
        mr.metallicRoughnessTexture.texture = this.getTexture(mr.metallicRoughnessTexture.index);
      }
    }
    return material;
  }

  _resolveAccessor(accessor, index) {
    // accessor = {...accessor};
    accessor.id = accessor.id || `accessor-${index}`;
    if (accessor.bufferView !== undefined) {
      // Draco encoded meshes don't have bufferView
      accessor.bufferView = this.getBufferView(accessor.bufferView);
    }

    // Look up enums
    accessor.bytesPerComponent = getBytesFromComponentType(accessor.componentType);
    accessor.components = getSizeFromAccessorType(accessor.type);
    accessor.bytesPerElement = accessor.bytesPerComponent * accessor.components;

    // Create TypedArray for the accessor
    // Note: The canonical way to instantiate is to ignore this array and create
    // WebGLBuffer's using the bufferViews.
    if (accessor.bufferView) {
      const buffer = accessor.bufferView.buffer;
      const {ArrayType, length} = getAccessorArrayTypeAndLength(accessor, accessor.bufferView);
      const byteOffset = (accessor.bufferView.byteOffset || 0) + buffer.byteOffset;
      accessor.value = new ArrayType(buffer.arrayBuffer, byteOffset, length);
    }

    return accessor;
  }

  _resolveTexture(texture, index) {
    // texture = {...texture};
    texture.id = texture.id || `texture-${index}`;
    texture.sampler = 'sampler' in texture ? this.getSampler(texture.sampler) : DEFAULT_SAMPLER;
    texture.source = this.getImage(texture.source);
    return texture;
  }

  _resolveSampler(sampler, index) {
    // sampler = {...sampler};
    sampler.id = sampler.id || `sampler-${index}`;
    // Map textual parameters to GL parameter values
    sampler.parameters = {};
    for (const key in sampler) {
      const glEnum = this._enumSamplerParameter(key);
      if (glEnum !== undefined) {
        sampler.parameters[glEnum] = sampler[key];
      }
    }
    return sampler;
  }

  _enumSamplerParameter(key) {
    return SAMPLER_PARAMETER_GLTF_TO_GL[key];
  }

  _resolveImage(image, index) {
    // image = {...image};
    image.id = image.id || `image-${index}`;
    if (image.bufferView !== undefined) {
      image.bufferView = this.getBufferView(image.bufferView);
    }

    // Check if image has been preloaded by the GLTFLoader
    // If so, link it into the JSON and drop the URI
    const preloadedImage = this.images[index];
    if (preloadedImage) {
      image.image = preloadedImage;
    }

    return image;
  }

  _resolveBufferView(bufferView, index) {
    // bufferView = {...bufferView};
    bufferView.id = bufferView.id || `bufferView-${index}`;
    const bufferIndex = bufferView.buffer;
    bufferView.buffer = this.buffers[bufferIndex];

    const arrayBuffer = this.buffers[bufferIndex].arrayBuffer;
    let byteOffset = this.buffers[bufferIndex].byteOffset || 0;

    if ('byteOffset' in bufferView) {
      byteOffset += bufferView.byteOffset;
    }

    bufferView.data = new Uint8Array(arrayBuffer, byteOffset, bufferView.byteLength);
    return bufferView;
  }

  _resolveCamera(camera, index) {
    camera.id = camera.id || `camera-${index}`;
    // TODO - create 4x4 matrices
    if (camera.perspective) {
      // camera.matrix = createPerspectiveMatrix(camera.perspective);
    }
    if (camera.orthographic) {
      // camera.matrix = createOrthographicMatrix(camera.orthographic);
    }
    return camera;
  }
}

export default function postProcessGLTF(gltf, options) {
  return new GLTFPostProcessor().postProcess(gltf, options);
}
