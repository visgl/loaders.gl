// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type * as arrow from 'apache-arrow';
import {
  color,
  CompositeLayer,
  Layer,
  type LayerContext,
  picking,
  project32,
  UNIT,
  type CompositeLayerProps,
  type DefaultProps,
  type LayerProps,
  type LayerDataSource,
  type UpdateParameters,
  type Unit,
  type Color
} from '@deck.gl/core';
import type {BufferLayout} from '@luma.gl/core';
import {Geometry, Model} from '@luma.gl/engine';
import type {ShaderModule} from '@luma.gl/shadertools';
import type {MeshArrowTable, TypedArray} from '@loaders.gl/schema';
import {SplatEngine, type SplatSortMode} from './splat/splat-engine';
import {getArrowTable, getGaussianSplatDataFromArrowTable} from './splat/splat-data';

const DEFAULT_COLOR = [255, 255, 255, 255] as const;

/** Public rendering modes supported by {@link SplatLayer}. */
export type SplatRenderMode = 'auto' | 'cpu' | 'gpu';

/** Public sorting modes supported by {@link SplatLayer}. */
export type PublicSplatSortMode = 'none' | 'global';

/** Props for {@link SplatLayer}. */
export type SplatLayerProps = CompositeLayerProps & {
  /** Gaussian splat table produced by `PLYLoader` with `ply.shape: 'arrow-table'`. */
  data: MeshArrowTable | arrow.Table;
  /** Units used by decoded splat radii. */
  sizeUnits?: Unit;
  /** Radius multiplier applied after decoding `scale_*` columns. */
  radiusScale?: number;
  /** Minimum rendered splat radius in pixels. */
  radiusMinPixels?: number;
  /** Maximum rendered splat radius in pixels. */
  radiusMaxPixels?: number;
  /** Fallback color used when spherical harmonic DC columns are not present. */
  getColor?: Color;
  /** Selects CPU/WebGL fallback rendering or the WebGPU engine path. */
  renderMode?: SplatRenderMode;
  /** Sorting strategy used by the WebGPU engine path. */
  sortMode?: PublicSplatSortMode;
  /** Minimum normalized alpha retained by the WebGPU engine path. */
  alphaCutoff?: number;
  /** Minimum projected screen size retained by the WebGPU engine path. */
  screenSizeCutoffPixels?: number;
  /** Gaussian support radius used when deriving billboard radii and bounds. */
  gaussianSupportRadius?: number;
};

type SplatPrimitiveLayerProps = LayerProps & {
  data: LayerDataSource<unknown>;
  sizeUnits?: Unit;
  radiusScale?: number;
  radiusMinPixels?: number;
  radiusMaxPixels?: number;
  splatEngine?: SplatEngine | null;
};

type SplatUniformProps = {
  sizeUnits: number;
  radiusScale: number;
  radiusMinPixels: number;
  radiusMaxPixels: number;
};

type DeckBinaryData = {
  length: number;
  attributes: Record<string, {value: TypedArray; size: number; type?: string}>;
};

type DrawOptions = {
  /** Shader module props supplied by deck.gl for this draw pass. */
  shaderModuleProps?: {
    /** Picking module uniforms for picking framebuffer passes. */
    picking?: {
      /** Whether this draw is writing to a picking framebuffer. */
      isActive?: boolean;
    };
  };
};

const defaultProps: DefaultProps<SplatLayerProps> = {
  id: 'splat-layer',
  sizeUnits: 'meters',
  radiusScale: {type: 'number', min: 0, value: 1},
  radiusMinPixels: {type: 'number', min: 0, value: 0},
  radiusMaxPixels: {type: 'number', min: 0, value: Number.MAX_SAFE_INTEGER},
  getColor: {type: 'color', value: DEFAULT_COLOR},
  renderMode: 'auto',
  sortMode: 'global',
  alphaCutoff: {type: 'number', min: 0, max: 1, value: 1 / 255},
  screenSizeCutoffPixels: {type: 'number', min: 0, value: 0},
  gaussianSupportRadius: {type: 'number', min: 0, value: 3}
};

const splatUniforms = {
  name: 'splat',
  source: '',
  vs: /* glsl */ `\
layout(std140) uniform splatUniforms {
  highp int sizeUnits;
  float radiusScale;
  float radiusMinPixels;
  float radiusMaxPixels;
} splat;
`,
  fs: '',
  uniformTypes: {
    sizeUnits: 'i32',
    radiusScale: 'f32',
    radiusMinPixels: 'f32',
    radiusMaxPixels: 'f32'
  }
} as const satisfies ShaderModule<SplatUniformProps>;

const source = /* wgsl */ `\
struct SplatUniforms {
  sizeUnits: i32,
  radiusScale: f32,
  radiusMinPixels: f32,
  radiusMaxPixels: f32,
};

@group(0) @binding(auto)
var<uniform> splat: SplatUniforms;

struct VertexInputs {
  @location(0) positions: vec3<f32>,
  @location(1) instancePositions: vec3<f32>,
  @location(2) instanceRadii: f32,
  @location(3) instanceColors: vec4<f32>,
};

struct FragmentInputs {
  @builtin(position) position: vec4<f32>,
  @location(0) unitPosition: vec2<f32>,
  @location(1) color: vec4<f32>,
};

@vertex
fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  var outputs: FragmentInputs;
  geometry.worldPosition = inputs.instancePositions;
  geometry.uv = inputs.positions.xy;

  let radiusPixels = clamp(
    project_unit_size_to_pixel(inputs.instanceRadii * splat.radiusScale, splat.sizeUnits),
    splat.radiusMinPixels,
    splat.radiusMaxPixels
  );

  var clipPosition = project_position_to_clipspace(
    inputs.instancePositions,
    vec3<f32>(0.0, 0.0, 0.0),
    vec3<f32>(0.0, 0.0, 0.0)
  );
  clipPosition.xy += project_pixel_size_to_clipspace(inputs.positions.xy * radiusPixels);

  outputs.position = clipPosition;
  outputs.unitPosition = inputs.positions.xy;
  outputs.color = vec4<f32>(inputs.instanceColors.rgb, inputs.instanceColors.a * layer.opacity);
  return outputs;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  let radiusSquared = dot(inputs.unitPosition, inputs.unitPosition);
  if (radiusSquared > 1.0) {
    discard;
  }

  let gaussianAlpha = exp(-6.0 * radiusSquared);
  let color = vec4<f32>(inputs.color.rgb, inputs.color.a * gaussianAlpha);
  if (color.a <= 0.00392156862) {
    discard;
  }

  return color;
}
`;

const vs = /* glsl */ `\
#version 300 es
#define SHADER_NAME splat-layer-vertex-shader

in vec3 positions;
in vec3 instancePositions;
in vec3 instancePositions64Low;
in float instanceRadii;
in vec4 instanceColors;
in vec3 instancePickingColors;

out vec2 unitPosition;
out vec4 vColor;

void main(void) {
  geometry.worldPosition = instancePositions;
  geometry.uv = positions.xy;
  geometry.pickingColor = instancePickingColors;
  unitPosition = positions.xy;

  float radiusPixels = clamp(
    project_size_to_pixel(instanceRadii * splat.radiusScale, splat.sizeUnits),
    splat.radiusMinPixels,
    splat.radiusMaxPixels
  );

  gl_Position = project_position_to_clipspace(
    instancePositions,
    instancePositions64Low,
    vec3(0.0),
    geometry.position
  );
  DECKGL_FILTER_GL_POSITION(gl_Position, geometry);

  vec3 offset = vec3(positions.xy * radiusPixels, 0.0);
  DECKGL_FILTER_SIZE(offset, geometry);
  gl_Position.xy += project_pixel_size_to_clipspace(offset.xy);

  vColor = vec4(instanceColors.rgb, instanceColors.a * layer.opacity);
  DECKGL_FILTER_COLOR(vColor, geometry);
}
`;

const fs = /* glsl */ `\
#version 300 es
#define SHADER_NAME splat-layer-fragment-shader

precision highp float;

in vec2 unitPosition;
in vec4 vColor;

out vec4 fragColor;

void main(void) {
  geometry.uv = unitPosition;
  float radiusSquared = dot(unitPosition, unitPosition);
  if (radiusSquared > 1.0) {
    discard;
  }

  float gaussianAlpha = exp(-6.0 * radiusSquared);
  fragColor = vec4(vColor.rgb, vColor.a * gaussianAlpha);
  if (fragColor.a <= 0.00392156862) {
    discard;
  }

  DECKGL_FILTER_COLOR(fragColor, geometry);
}
`;

/** WebGPU vertex buffer layout matching the WGSL shader attributes. */
const WEBGPU_SPLAT_BUFFER_LAYOUT: BufferLayout[] = [
  {name: 'positions', stepMode: 'vertex', format: 'float32x3'},
  {name: 'instancePositions', stepMode: 'instance', format: 'float32x3'},
  {name: 'instanceRadii', stepMode: 'instance', format: 'float32'},
  {name: 'instanceColors', stepMode: 'instance', format: 'unorm8x4'}
];

/**
 * Renders GraphDECO-style Gaussian splat PLY data parsed as an Arrow table.
 *
 * The layer expects `POSITION`, `scale_0..2`, `opacity`, and `f_dc_0..2` columns.
 * `scale_*` and `opacity` encodings are read from `loaders_gl.gaussian_splats.*`
 * field metadata when available.
 */
export class SplatLayer extends CompositeLayer<SplatLayerProps> {
  /** deck.gl layer name used in debugging output. */
  static layerName = 'SplatLayer';

  /** Default props shared across splat layers. */
  static defaultProps: DefaultProps = defaultProps;

  declare state: {
    /** WebGPU engine used when the GPU path is selected. */
    splatEngine?: SplatEngine;
    /** Last Arrow table uploaded to the WebGPU engine. */
    engineTable?: arrow.Table;
    /** Last fallback color uploaded to the WebGPU engine. */
    engineFallbackColor?: Color;
  };

  /** Updates the optional WebGPU engine when layer props change. */
  updateState(params: UpdateParameters<this>): void {
    super.updateState(params);

    const useGpuEngine = this.shouldUseGpuEngine();
    if (!useGpuEngine) {
      this.destroySplatEngine();
      return;
    }

    const arrowTable = getArrowTable(this.props.data);
    const fallbackColor = this.props.getColor || DEFAULT_COLOR;
    let splatEngine = this.state.splatEngine;
    if (!splatEngine) {
      splatEngine = new SplatEngine(this.context.device, this.getSplatEngineProps());
      this.setState({splatEngine});
    }

    splatEngine.setProps(this.getSplatEngineProps());

    if (
      params.changeFlags.dataChanged ||
      this.state.engineTable !== arrowTable ||
      this.state.engineFallbackColor !== fallbackColor ||
      params.changeFlags.propsChanged
    ) {
      splatEngine.setData(arrowTable, fallbackColor);
      this.setState({engineTable: arrowTable, engineFallbackColor: fallbackColor});
    }
  }

  /** Releases the WebGPU engine. */
  finalizeState(context: LayerContext): void {
    super.finalizeState(context);
    this.destroySplatEngine();
  }

  /** Renders the Arrow table through a Gaussian billboard primitive. */
  renderLayers(): Layer | null {
    const arrowTable = getArrowTable(this.props.data);
    const splatData = getDeckBinaryDataFromGaussianSplatArrowTable(
      arrowTable,
      this.props.getColor,
      this.props.gaussianSupportRadius
    );

    return new SplatPrimitiveLayer({
      ...this.getSubLayerProps({id: 'splats'}),
      data: splatData,
      sizeUnits: this.props.sizeUnits,
      radiusScale: this.props.radiusScale,
      radiusMinPixels: this.props.radiusMinPixels,
      radiusMaxPixels: this.props.radiusMaxPixels,
      splatEngine: this.shouldUseGpuEngine() ? this.state.splatEngine : null
    }) as unknown as Layer;
  }

  private shouldUseGpuEngine(): boolean {
    const renderMode = this.props.renderMode || 'auto';
    const device = this.context?.device;
    if (renderMode === 'cpu') {
      return false;
    }
    if (device?.type === 'webgpu') {
      return true;
    }
    if (renderMode === 'gpu') {
      throw new Error('SplatLayer renderMode "gpu" requires a WebGPU device.');
    }
    return false;
  }

  private getSplatEngineProps() {
    return {
      sortMode: (this.props.sortMode || 'global') as SplatSortMode,
      alphaCutoff: this.props.alphaCutoff ?? 1 / 255,
      screenSizeCutoffPixels: this.props.screenSizeCutoffPixels ?? 0,
      gaussianSupportRadius: this.props.gaussianSupportRadius ?? 3
    };
  }

  private destroySplatEngine(): void {
    this.state.splatEngine?.destroy();
    this.setState({splatEngine: undefined, engineTable: undefined, engineFallbackColor: undefined});
  }
}

/** Primitive Gaussian billboard layer used by {@link SplatLayer}. */
class SplatPrimitiveLayer extends Layer<Required<SplatPrimitiveLayerProps>> {
  /** deck.gl layer name used in debugging output. */
  static layerName = 'SplatPrimitiveLayer';

  /** Default props shared across primitive splat layers. */
  static defaultProps: DefaultProps = {
    sizeUnits: 'meters',
    radiusScale: {type: 'number', min: 0, value: 1},
    radiusMinPixels: {type: 'number', min: 0, value: 0},
    radiusMaxPixels: {type: 'number', min: 0, value: Number.MAX_SAFE_INTEGER},
    splatEngine: null
  };

  state: {
    model?: Model;
  } = {};

  /** Returns splat shaders. */
  getShaders() {
    if (this.context.device.type === 'webgpu') {
      return super.getShaders({
        source,
        modules: [project32, splatUniforms]
      });
    }

    return super.getShaders({
      vs,
      fs,
      modules: [project32, color, picking, splatUniforms]
    });
  }

  /** Registers binary attributes consumed by the primitive shader. */
  initializeState(): void {
    this.getAttributeManager()!.addInstanced({
      instancePositions: {
        size: 3,
        type: 'float64',
        fp64: this.use64bitPositions(),
        accessor: 'getPosition'
      },
      instanceRadii: {
        size: 1,
        accessor: 'getRadius',
        defaultValue: 1
      },
      instanceColors: {
        size: this.props.colorFormat.length,
        type: 'unorm8',
        accessor: 'getColor',
        defaultValue: DEFAULT_COLOR
      }
    });
  }

  /** Rebuilds the luma model when deck.gl shader extensions change. */
  updateState(params: UpdateParameters<this>): void {
    super.updateState(params);

    if (!this.state.model || params.changeFlags.extensionsChanged) {
      this.state.model?.destroy();
      this.state.model = this._getModel();
      this.getAttributeManager()!.invalidateAll();
    }
  }

  /** Draws all splat billboards. */
  draw(options: DrawOptions = {}): void {
    if (this.context.device.type === 'webgpu' && options.shaderModuleProps?.picking?.isActive) {
      return;
    }

    const {sizeUnits, radiusScale, radiusMinPixels, radiusMaxPixels} = this.props;
    const splatProps: SplatUniformProps = {
      sizeUnits: UNIT[sizeUnits],
      radiusScale,
      radiusMinPixels,
      radiusMaxPixels
    };
    const model = this.state.model;
    if (!model) {
      return;
    }
    this.props.splatEngine?.update();
    model.shaderInputs.setProps({splat: splatProps});
    model.draw(this.context.renderPass);
  }

  /** Applies attribute buffers while preserving the explicit WebGPU buffer layout. */
  protected _setModelAttributes(
    model: Model,
    changedAttributes: Record<string, unknown>,
    bufferLayoutChanged = false
  ): void {
    super._setModelAttributes(
      model,
      changedAttributes,
      this.context.device.type === 'webgpu' ? false : bufferLayoutChanged
    );
  }

  /** Builds the instanced billboard model. */
  protected _getModel(): Model {
    const bufferLayout =
      this.context.device.type === 'webgpu'
        ? WEBGPU_SPLAT_BUFFER_LAYOUT
        : this.getAttributeManager()!.getBufferLayouts();

    return new Model(this.context.device, {
      ...this.getShaders(),
      id: this.props.id,
      bufferLayout,
      geometry: new Geometry({
        topology: 'triangle-strip',
        attributes: {
          positions: {
            size: 3,
            value: new Float32Array([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0])
          }
        }
      }),
      isInstanced: true
    });
  }
}

/** Convert a Gaussian splat Arrow table into deck.gl binary attributes. */
function getDeckBinaryDataFromGaussianSplatArrowTable(
  table: arrow.Table,
  fallbackColor: Color = DEFAULT_COLOR,
  gaussianSupportRadius: number = 3
): DeckBinaryData {
  const splatData = getGaussianSplatDataFromArrowTable(table, fallbackColor, gaussianSupportRadius);

  return {
    length: splatData.length,
    attributes: {
      getPosition: {value: splatData.positions, size: 3},
      getRadius: {value: splatData.radii, size: 1},
      getColor: {value: splatData.colors, size: 4, type: 'unorm8'}
    }
  };
}
