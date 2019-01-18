import {getBytesFromComponentType, getSizeFromAccessorType} from '../utils/gltf-type-utils';
import GLBParser from '../glb/glb-parser';

export default class GLTFParser {
  constructor(options = {}) {
    // TODO - move parsing to parse
    this.gltf = gltf;
    this.json = gltf;
    this.log = console; // eslint-disable-line
    this.out = {};

    // Soft dependency on Draco, needs to be imported and supplied by app
    this.DracoDecoder = options.DracoDecoder || null;
  }

  parse(gltf, options = {}) {
    this.glbParser = new GLBParser(gltf);

    // GLTF can be JSON or binary (GLB)
    if (gltf instanceof ArrayBuffer) {
      this.gltf = glbParser.parse().json;
    } else {
      this.gltf = gltf;
    }

    this._loadLinkedAssets(options); // TODO - not implemented
    this._postProcessGLTF(options);
    this.gltf = this._resolveToTree(options);
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

  // PRIVATE

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
    const object = this.gltf[array] && this.gltf[array][index];
    if (!object) {
      console.warn(`glTF file error: Could not find ${array}[${index}]`); // eslint-disable-line
    }
    return object;
  }

  // PARSING HELPERS

  // Start loading linked assets
  _loadLinkedAssets(options) {
    // TODO: Not implemented
    // TODO: Return a promise?
  }

  _postProcessGLTF(options = {}) {
    // Create all images (if requested)
    this.out.images = (this.gltf.images || [])
      _.map(image => this.parseImage(image, options))
      .filter(Boolean);

    // Normalize all scenes
    this.out.scenes = (this.gltf.scenes || [])
      _.map(scene => this.parseScene(scene, options))
      .filter(Boolean);

    if (this.gltf.scene) {
      this.out.scene = this.gltf.scenes[this.gltf.scene];
    }

    return this;
  }

  _parseScene(scene, options) {
    return scene;
  }

  _parseMesh(mesh) {
    // Each primitive is intended to correspond to a draw call
    _const primitives = (mesh.primitives || []).map(primitive => this.parseMeshPrimitive(primitive));

    return primitives.length === 1 ? primitives[0] : this.config.createGroup(primitives);
  }

  _parseAccessor(accessor) {
    return this.config.createBuffer(accessor);
  }

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

    if (gltf.scene) {
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
    if (node.mesh) {
      node.mesh = this.getMesh(node.mesh);
    }
    if (node.camera) {
      node.camera = this.getCamera(node.camera);
    }
    if (node.skin) {
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
      if (primitive.indices) {
        primitive.indices = this.getAccessor(primitive.indices);
      }
      if (primitive.material) {
        primitive.material = this.getMaterial(primitive.material);
      }
    }
  }

  _resolveMaterial(material, index) {
    material.id = `material-${index}`;
    if (material.normalTexture) {
      this.normalTexture = this.getTexture(material.normalTexture);
    }
    if (material.occlusionTexture) {
      this.occlusionTexture = this.getTexture(material.occlusionTexture);
    }
    if (material.emissiveTexture) {
      this.emissiveTexture = this.getTexture(material.emissiveTexture);
    }

    if (material.pbrMetallicRoughness) {
      const mr = material.pbrMetallicRoughness;
      if (mr.baseColorTexture) {
        mr.baseColorTexture = this.getTexture(mr.baseColorTexture);
      }
      if (mr.metallicRoughnessTexture) {
        mr.metallicRoughnessTexture = this.getTexture(mr.metallicRoughnessTexture);
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
    this.parameters = {};
    for (const key in sampler) {
      const glEnum = this.enumSamplerParameter(sampler[key]);
      this.parameters[glEnum] = sampler[key];
    }
  }

  _resolveImage(image, index, options) {
    image.id = `image-${index}`;
    if (image.bufferView) {
      image.bufferView = this.getBufferView(image.bufferView);
    }
    // TODO - Handle URIs etc

    const {createImages = true} = options;
    if (createImages) {
      image.image = this.glbParser.unpackImage(image);
    }
  }

  _resolveBufferView(bufferView, index) {
    bufferView.id = `bufferView-${index}`;
    bufferView.buffer = this.getBuffer(bufferView.buffer);
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

  // DATA UNPACKING

  // Unpacks all the primitives in a mesh
  unpackMesh(mesh) {
    return mesh.primitives.map(this.unpackPrimitive.bind(this));
  }

  // Unpacks one mesh primitive
  unpackPrimitive(primitive) {
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
}
