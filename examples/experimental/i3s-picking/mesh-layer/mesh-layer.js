import {SimpleMeshLayer} from '@deck.gl/mesh-layers';

import vs from './simple-mesh-layer-vertex.glsl';
import fs from './simple-mesh-layer-fragment.glsl';

export default class MeshLayer extends SimpleMeshLayer {
  getShaders() {
    const shaders = super.getShaders();
    return {...shaders, vs, fs};
  }
}
