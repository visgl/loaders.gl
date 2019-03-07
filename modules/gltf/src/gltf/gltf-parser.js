import {TextDecoder, fetchFile} from '@loaders.gl/core';
import {getBytesFromComponentType, getSizeFromAccessorType} from '../utils/gltf-type-utils';
import GLBParser from '../glb/glb-parser';

const GL_SAMPLER = {
  TEXTURE_MAG_FILTER: 0x2800,
  TEXTURE_MIN_FILTER: 0x2801,
  TEXTURE_WRAP_S: 0x2802,
  TEXTURE_WRAP_T: 0x2803
};

const SAMPLER_PARAMETER_GLTF_TO_GL = {
  magFilter: GL_SAMPLER.TEXTURE_MAG_FILTER,
  minFilter: GL_SAMPLER.TEXTURE_MIN_FILTER,
  wrapS: GL_SAMPLER.TEXTURE_WRAP_S,
  wrapT: GL_SAMPLER.TEXTURE_WRAP_T
};

const DEFAULT_OPTIONS = {
  createImages: false,
  postProcess: true,
  fetch: fetchFile
};

export default class GLTFParser {
  async parse(gltf, options = {}) {
    this.options = Object.assign({}, DEFAULT_OPTIONS, options);

    this.parseSync(gltf, options);

    // Load linked buffers asynchronously/decode base64 in parallel
    await this._loadBuffers(options);

    if (options.postProcess) {
      return this.postProcessGLTF(options);
    }

    return this.gltf;
  }

  // The sync parser cannot handle linked or base64 encoded resources
  parseSync(gltf, options = {}) {
    this.options = Object.assign({}, DEFAULT_OPTIONS, options);

    // Soft dependency on Draco, needs to be imported and supplied by app
    this.DracoDecoder = options.DracoDecoder || null;
    this.log = options.log || console; // eslint-disable-line

    // GLTF can be JSON or binary (GLB)

    // If binary is not starting with magic bytes, try to parse as JSON
    if (gltf instanceof ArrayBuffer && !GLBParser.isGLB(gltf, options)) {
      const textDecoder = new TextDecoder();
      const text = textDecoder.decode(gltf);
      gltf = JSON.parse(text);
    }

    if (gltf instanceof ArrayBuffer) {
      this.glbParser = new GLBParser();
      this.gltf = this.glbParser.parse(gltf).json;
      this.json = this.gltf;
    } else {
      this.glbParser = null;
      this.gltf = gltf;
      this.json = gltf;
    }

    // TODO: we could handle base64 encoded files in the non-async path
    // await this._loadBuffersSync(options);

    return this.gltf;
  }

  postProcessGLTF(gltf, options = {}) {
    this._resolveToTree(options);
    return this.gltf;
  }

  // Accessors

  getApplicationData(key) {
    // TODO - Data is already unpacked by GLBParser
    const data = this.json[key];
    return data;
  }

  getExtraData(key) {
    // TODO - Data is already unpacked by GLBParser
    const extras = this.json.extras || {};
    return extras[key];
  }

  getExtension(extensionName) {
    // TODO - Data is already unpacked by GLBParser
    return this.json.extensions[extensionName];
  }

  getRequiredExtensions() {
    return this.json.extensionsRequired;
  }

  getUsedExtensions() {
    return this.json.extensionsUsed;
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
    const object = this.gltf[array] && this.gltf[array][index];
    if (!object) {
      console.warn(`glTF file error: Could not find ${array}[${index}]`); // eslint-disable-line
    }
    return object;
  }

  // PARSING HELPERS

  // Load linked assets
  async _loadBuffers(options) {
    return await Promise.all(this.gltf.buffers.map(buffer => this._loadBuffer(buffer, options)));
  }

  async _loadBuffer(buffer, options) {
    if (buffer.uri) {
      const fetch = options.fetch || window.fetch;
      const uri = this._getFullUri(buffer.uri, options.uri);
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();
      buffer.data = arrayBuffer;
      buffer.uri = null;
    }
  }

  _getFullUri(uri, base) {
    const absolute = uri.startsWith('data:') || uri.startsWith('http:') || uri.startsWith('https:');
    return absolute ? uri : base.substr(0, base.lastIndexOf('/') + 1) + uri;
  }

  _decompressMeshes() {
    for (const mesh of this.gltf.meshes || []) {
      // Decompress all the primitives in a mesh
      mesh.primitives = mesh.primitives.map(primitive => this._decompressPrimitive(primitive));
    }
  }

  // Unpacks one mesh primitive
  // TODO - decompression could be threaded?
  // TODO - fallback implementation?

  _decompressPrimitive(primitive) {
    // eslint-disable-next-line max-len
    // https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_draco_mesh_compression
    const compressedMesh =
      primitive.extensions && primitive.extensions.KHR_draco_mesh_compression;

    if (!this.DracoDecoder || !compressedMesh) {
      // TODO if no uncompressed attributes, fail
      return primitive;
    }

    const unpackedPrimitive = {
      mode: primitive.mode,
      material: primitive.material
    };

    const dracoDecoder = new this.DracoDecoder();

    try {
      const decodedData = dracoDecoder.decodeMesh(compressedMesh);
      unpackedPrimitive.attributes = decodedData.attributes;
      if (decodedData.indices) {
        unpackedPrimitive.indices = decodedData.indices;
      }
    } finally {
      dracoDecoder.destroy();
    }

    return unpackedPrimitive;
  }

  // TODO - remove?
  /*
  _decompressUberPrimitive(primtive) {
    const compressedMesh =
      primitive.extensions && primitive.extensions.UBER_draco_mesh_compression;
    const compressedPointCloud =
      primitive.extensions && primitive.extensions.UBER_draco_point_cloud_compression;

    const unpackedPrimitive = {
      mode: primitive.mode,
      material: primitive.material
    };

    if (compressedMesh) {
      const dracoDecoder = new this.DracoDecoder();
      const decodedData = dracoDecoder.decodeMesh(compressedMesh);
      dracoDecoder.destroy();

      Object.assign(unpackedPrimitive, {
        indices: decodedData.indices,
        attributes: decodedData.attributes
      });

    } else if (compressedPointCloud) {
      const dracoDecoder = new this.DracoDecoder();
      const decodedData = dracoDecoder.decodePointCloud(compressedPointCloud);
      dracoDecoder.destroy();

      Object.assign(unpackedPrimitive, {
        mode: 0,
        attributes: decodedData.attributes
      });
    } else {
      // No compression - just a glTF mesh primitive
      // TODO - Resolve all accessors
    }
  }
  */

  // POST PROCESSING

  // Convert indexed glTF structure into tree structure
  // PREPARATION STEP: CROSS-LINK INDEX RESOLUTION, ENUM LOOKUP, CONVENIENCE CALCULATIONS
  /* eslint-disable complexity */
  _resolveToTree(options = {}) {
    const {gltf} = this;

    (gltf.bufferViews || []).forEach((bufView, i) => this._resolveBufferView(bufView, i));

    (gltf.images || []).forEach((image, i) => this._resolveImage(image, i, options));
    (gltf.samplers || []).forEach((sampler, i) => this._resolveSampler(sampler, i));
    (gltf.textures || []).forEach((texture, i) => this._resolveTexture(texture, i));

    (gltf.accessors || []).forEach((accessor, i) => this._resolveAccessor(accessor, i));
    (gltf.materials || []).forEach((material, i) => this._resolveMaterial(material, i));
    (gltf.meshes || []).forEach((mesh, i) => this._resolveMesh(mesh, i));

    (gltf.nodes || []).forEach((node, i) => this._resolveNode(node, i));

    (gltf.skins || []).forEach((skin, i) => this._resolveSkin(skin, i));

    (gltf.scenes || []).forEach((scene, i) => this._resolveScene(scene, i));

    if (gltf.scene !== undefined) {
      gltf.scene = gltf.scenes[this.gltf.scene];
    }

    return gltf;
  }
  /* eslint-enable complexity */

  _resolveScene(scene, index) {
    scene.id = `scene-${index}`;
    scene.nodes = (scene.nodes || []).map(node => this.getNode(node));
  }

  _resolveNode(node, index) {
    node.id = `node-${index}`;
    node.children = (node.children || []).map(child => this.getNode(child));
    if (node.mesh !== undefined) {
      node.mesh = this.getMesh(node.mesh);
    }
    if (node.camera !== undefined) {
      node.camera = this.getCamera(node.camera);
    }
    if (node.skin !== undefined) {
      node.skin = this.getSkin(node.skin);
    }
  }

  _resolveSkin(skin, index) {
    skin.id = `skin-${index}`;
    skin.inverseBindMatrices = this.getAccessor(skin.inverseBindMatrices);
  }

  _resolveMesh(mesh, index) {
    mesh.id = `mesh-${index}`;
    for (const primitive of mesh.primitives) {
      for (const attribute in primitive.attributes) {
        primitive.attributes[attribute] = this.getAccessor(primitive.attributes[attribute]);
      }
      if (primitive.indices !== undefined) {
        primitive.indices = this.getAccessor(primitive.indices);
      }
      if (primitive.material !== undefined) {
        primitive.material = this.getMaterial(primitive.material);
      }
    }
  }

  _resolveMaterial(material, index) {
    material.id = `material-${index}`;
    if (material.normalTexture) {
      material.normalTexture.texture = this.getTexture(material.normalTexture.index);
    }
    if (material.occlusionTexture) {
      material.occlusionTexture.texture = this.getTexture(material.occlusionTexture.index);
    }
    if (material.emissiveTexture) {
      material.emissiveTexture.texture = this.getTexture(material.emissiveTexture.index);
    }

    if (material.pbrMetallicRoughness) {
      const mr = material.pbrMetallicRoughness;
      if (mr.baseColorTexture) {
        mr.baseColorTexture.texture = this.getTexture(mr.baseColorTexture.index);
      }
      if (mr.metallicRoughnessTexture) {
        mr.metallicRoughnessTexture.texture = this.getTexture(mr.metallicRoughnessTexture.index);
      }
    }
  }

  _resolveAccessor(accessor, index) {
    accessor.id = `accessor-${index}`;
    accessor.bufferView = this.getBufferView(accessor.bufferView);
    // Look up enums
    accessor.bytesPerComponent = getBytesFromComponentType(accessor);
    accessor.components = getSizeFromAccessorType(accessor);
    accessor.bytesPerElement = accessor.bytesPerComponent * accessor.components;
  }

  _resolveTexture(texture, index) {
    texture.id = `texture-${index}`;
    texture.sampler = this.getSampler(texture.sampler);
    texture.source = this.getImage(texture.source);
  }

  _resolveSampler(sampler, index) {
    sampler.id = `sampler-${index}`;
    // Map textual parameters to GL parameter values
    sampler.parameters = {};
    for (const key in sampler) {
      const glEnum = this._enumSamplerParameter(key);
      if (glEnum !== undefined) {
        sampler.parameters[glEnum] = sampler[key];
      }
    }
  }

  _enumSamplerParameter(key) {
    return SAMPLER_PARAMETER_GLTF_TO_GL[key];
  }

  _resolveImage(image, index, options) {
    image.id = `image-${index}`;
    if (image.bufferView !== undefined) {
      image.bufferView = this.getBufferView(image.bufferView);
    }

    // TODO - Handle non-binary-chunk images, data URIs, URLs etc
    // TODO - Image creation could be done on getImage instead of during load
    const {createImages = true} = options;
    if (createImages) {
      image.image = this.glbParser.getImage(image);
    } else {
      image.getImageAsync = () => {
        if (this.glbParser) {
          return this.glbParser.getImageAsync(image);
        } else if (image.uri) {
          // TODO: Maybe just return the URL?
          // TODO: Maybe use loaders.gl/core loadImage?
          return new Promise(resolve => {
            /* global Image */
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.src = this._getFullUri(image.uri, options.uri);
          });
        }

        // cannot get image
        return null;
      };
    }
  }

  _resolveBufferView(bufferView, index) {
    bufferView.id = `bufferView-${index}`;
    bufferView.buffer = this.getBuffer(bufferView.buffer);

    if (this.glbParser) {
      bufferView.data = this.glbParser.getBufferView(bufferView);
    } else {
      const byteOffset = bufferView.byteOffset || 0;
      bufferView.data = new Uint8Array(bufferView.buffer.data, byteOffset, bufferView.byteLength);
    }
  }

  _decompressUberDracoPointCloud(primitive, extensions) {
    const bufferViewIndex = extensions.UBER_draco_point_cloud_compression.bufferView;
    const bufferView = this.getBufferView(bufferViewIndex);

    // TODO: change to getArrayFromBufferView()
    const compressedData = this.glbParser.getBufferView(bufferView);

    const dracoDecoder = new this.DracoDecoder();
    const decodedPrimitive = dracoDecoder.decode(compressedData);

    // TODO: what to do about original attributes
    primitive.attributes = decodedPrimitive.attributes;
    // TODO: stashing header on primitive, not sure if necessary
    primitive.header = decodedPrimitive.header;

    // TODO: drawmode is currently undefined, look into dracodecoder to set to 0 for point cloud
    primitive.drawMode = decodedPrimitive.drawMode || 0;
  }

  getDecompressedMesh(index) {
    if (!this.DracoDecoder) {
      throw new Error('DracoDecoder not available');
    }

    const mesh = this._get('meshes', index);

    for (const primitive of mesh.primitives) {
      // TODO: DracoMesh extension

      const extensions = primitive.extensions;
      if ('UBER_draco_point_cloud_compression' in extensions) {
        this._decompressUberDracoPointCloud(primitive, extensions);
      }
    }

    return mesh;
  }

  // PREPROC

  _resolveCamera(camera) {
    // TODO - create 4x4 matrices
    if (camera.perspective) {
      // camera.matrix = createPerspectiveMatrix(camera.perspective);
    }
    if (camera.orthographic) {
      // camera.matrix = createOrthographicMatrix(camera.orthographic);
    }
  }

}
