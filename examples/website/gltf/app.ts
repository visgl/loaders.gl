/* eslint-disable camelcase */
import {load} from '@loaders.gl/core';
import {GLTFLoader} from '@loaders.gl/gltf';
import GL from '@luma.gl/constants';
import {AnimationLoop, setParameters, clear, log, lumaStats} from '@luma.gl/core';
import {GLTFEnvironment} from '@luma.gl/experimental';
import {createGLTFObjects} from './create-gltf-objects';
import {Matrix4, radians} from '@math.gl/core';

// Missing types in luma.gl/experimental v8
type GLTFAnimator = any;

import {loadModelList, GLTF_ENV_BASE_URL} from './components/examples';
import {
  LIGHT_SOURCES,
  INFO_HTML,
  addModelsToDropdown,
  getSelectedModelUrl,
  onSettingsChange,
  onLightSettingsChange
} from './components/model-picker';
import Controller from './controller';

const CUBE_FACE_TO_DIRECTION = {
  [GL.TEXTURE_CUBE_MAP_POSITIVE_X]: 'right',
  [GL.TEXTURE_CUBE_MAP_NEGATIVE_X]: 'left',
  [GL.TEXTURE_CUBE_MAP_POSITIVE_Y]: 'top',
  [GL.TEXTURE_CUBE_MAP_NEGATIVE_Y]: 'bottom',
  [GL.TEXTURE_CUBE_MAP_POSITIVE_Z]: 'front',
  [GL.TEXTURE_CUBE_MAP_NEGATIVE_Z]: 'back'
};


export class AppAnimationLoop extends AnimationLoop {
  // TODO - do we need both?
  static getInfo() {
    return INFO_HTML;
  }

  getInfo() {
    return INFO_HTML;
  }

  scenes: any[] = [];
  animator: GLTFAnimator | null = null;
  modelFile: string | null;

  gl: WebGLRenderingContext | null = null;
  glOptions = {
    // Use to test gltf with webgl 1.0 and 2.0
    // webgl2: true,
    // alpha causes issues with some glTF demos
    alpha: false
  };

  controller: Controller | null = null;

  u_ScaleDiffBaseMR = [0, 0, 0, 0];
  u_ScaleFGDSpec = [0, 0, 0, 0];

  environment: GLTFEnvironment | null = null;

  gltfCreateOptions: {
    pbrDebug: boolean;
    imageBasedLightingEnvironment?: GLTFEnvironment | null;
    lights: boolean;
  } = {
    pbrDebug: true,
    imageBasedLightingEnvironment: null,
    lights: false
  };


  constructor({modelFile}: {modelFile?: string | null} = {modelFile: null}) {
    super();

    this.modelFile = modelFile || null;


    this.onInitialize = this.onInitialize.bind(this);
    this.onRender = this.onRender.bind(this);
  }

  async onInitialize({gl, canvas}) {
    setParameters(gl, {
      depthTest: true,
      blend: false
    });

    this.controller = new Controller(canvas, {
      initialZoom: 2,
      onDrop: (file) => this._loadGLTF(file)
    });

    this.environment = new GLTFEnvironment(gl, {
      brdfLutUrl: `${GLTF_ENV_BASE_URL}/brdfLUT.png`,
      getTexUrl: (type, dir, mipLevel) =>
        `${GLTF_ENV_BASE_URL}/papermill/${type}/${type}_${CUBE_FACE_TO_DIRECTION[dir]}_${mipLevel}.jpg`
    });
    this.gltfCreateOptions.imageBasedLightingEnvironment = this.environment;

    this.gl = gl;
    if (this.modelFile) {
      await this._loadGLTF(this.modelFile);
    } else {
      const models = await loadModelList();
      addModelsToDropdown(models, async (modelUrl) => {
        this._deleteScenes();
        await this._loadGLTF(modelUrl);
      });

      // Load the default model
      const defaultModelUrl = getSelectedModelUrl();
      await this._loadGLTF(defaultModelUrl);
    }

    onSettingsChange((settings) => {
      Object.assign(this, settings);
    });
    onLightSettingsChange((settings) => {
      Object.assign(this.gltfCreateOptions, settings);
      if (this.gltfCreateOptions.imageBasedLightingEnvironment) {
        this.gltfCreateOptions.imageBasedLightingEnvironment = this.environment;
      }
      this._rebuildModel();
    });
  }

  onRender({gl, time, aspect, viewMatrix, projectionMatrix}) {
    clear(gl, {color: [0.2, 0.2, 0.2, 1.0], depth: true});

    this.controller?.animate(time);
    const controls = this.controller?.getMatrices();

    // TODO: find how to avoid using Array.from() to convert TypedArray to regular array
    const uView = viewMatrix ? new Matrix4(Array.from(viewMatrix)) : new Matrix4();
    const viewMatrix2 = controls?.viewMatrix;
    if (viewMatrix2) {
      uView.multiplyRight(viewMatrix2);
    }

    const uProjection = projectionMatrix
      ? new Matrix4(Array.from(projectionMatrix))
      : new Matrix4().perspective({fovy: radians(40), aspect, near: 0.01, far: 9000});

    if (!this.scenes.length) {
      return false;
    }

    if (this.animator) {
      this.animator.animate(time);
    }

    let success = true;

    this.scenes[0].traverse((model, {worldMatrix}) => {
      // In glTF, meshes and primitives do no have their own matrix.
      const u_MVPMatrix = new Matrix4(uProjection).multiplyRight(uView).multiplyRight(worldMatrix);
      this._applyLight(model);
      success =
        success &&
        model.draw({
          uniforms: {
            u_Camera: controls?.cameraPosition,
            u_MVPMatrix,
            u_ModelMatrix: worldMatrix,
            u_NormalMatrix: new Matrix4(worldMatrix).invert().transpose(),

            u_ScaleDiffBaseMR: this.u_ScaleDiffBaseMR,
            u_ScaleFGDSpec: this.u_ScaleFGDSpec
          },
          parameters: model.props.parameters
        });
    });

    return success;
  }

  // Can accept url, File, promise etc.
  async _loadGLTF(file) {
    const {gl} = this;

    this._deleteScenes();

    const rawGltf = await load(file, GLTFLoader);

    const {gltf, scenes, animator} = await createGLTFObjects(gl, rawGltf, this.gltfCreateOptions);

    this.scenes = scenes;
    this.animator = animator;
    this.gltf = gltf;
  }

  _rebuildModel() {
    // Clean and regenerate model so we have new "#defines"
    // TODO: Find better way to do this
    (this.gltf.meshes || []).forEach((mesh) => delete mesh._mesh);
    (this.gltf.nodes || []).forEach((node) => delete node._node);
    (this.gltf.bufferViews || []).forEach((bufferView) => delete bufferView.lumaBuffers);

    this._deleteScenes();
    Object.assign(this, createGLTFObjects(this.gl, this.gltf, this.gltfCreateOptions));
  }

  _deleteScenes() {
    this.scenes.forEach((scene) => scene.delete());
    this.scenes = [];

    lumaStats.get('Resource Counts').forEach(({name, count}) => {
      log.info(3, `${name}: ${count}`)();
    });
  }

  _applyLight(model) {
    // TODO: only do this when light changes
    model.updateModuleSettings({
      lightSources: LIGHT_SOURCES[this.light || 'default']
    });
  }
}

export function runApp() {
  if (typeof window !== 'undefined' && !window.website) {
    try {
      const animationLoop = new AppAnimationLoop();
      animationLoop.start();

      const infoDiv = document.createElement('div');
      infoDiv.innerHTML = animationLoop.getInfo();
      document.body.appendChild(infoDiv);
    } catch (error) {
      console.error(error);
    }
  }
}