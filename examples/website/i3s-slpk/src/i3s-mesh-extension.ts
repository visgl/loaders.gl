import {LayerExtension} from '@deck.gl/core';

/**
 * Keeps deck.gl 9.4's WebGL I3S mesh material visible with the current PBR shader module.
 *
 * MeshLayer multiplies vertex colors outside pbr_filterColor, but passes vec4(0) into it.
 * The current PBR module also multiplies its input, making every mesh transparent. Supply
 * the multiplicative identity at that call until MeshLayer is updated in deck.gl.
 */
export class I3SMeshExtension extends LayerExtension {
  /** Name used by deck.gl to identify this example's extension. */
  static extensionName = 'I3SMeshExtension';

  /** Adjusts the MeshLayer fragment call without changing its picking or material hooks. */
  getShaders() {
    return {
      inject: {
        'fs:#main-start': '#define pbr_filterColor(color) pbr_filterColor(vec4(1.0))'
      }
    };
  }
}
