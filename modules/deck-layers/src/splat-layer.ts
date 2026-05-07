// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type * as arrow from 'apache-arrow';
import {
  color,
  CompositeLayer,
  Layer,
  type Attribute,
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
import type {ArrowTableBatch, MeshArrowTable, TypedArray} from '@loaders.gl/schema';
import {CullingVolume, Plane} from '@math.gl/culling';
import {SplatEngine, type SplatSortMode} from './splat/splat-engine';
import {getArrowTable, getGaussianSplatDataFromArrowTable} from './splat/splat-data';

const DEFAULT_COLOR = [255, 255, 255, 255] as const;

/** Public rendering modes supported by {@link SplatLayer}. */
export type SplatRenderMode = 'auto' | 'cpu' | 'gpu';

/** Public sorting modes supported by {@link SplatLayer}. */
export type PublicSplatSortMode = 'none' | 'global' | 'tile';

/** Props for {@link SplatLayer}. */
export type SplatLayerProps = CompositeLayerProps & {
  /** Gaussian splat table or loaders.gl Arrow table batches produced by `PLYLoader` with `ply.shape: 'arrow-table'`. */
  data: MeshArrowTable | arrow.Table | AsyncIterable<ArrowTableBatch> | null;
  /** Units used by decoded splat radii. */
  sizeUnits?: Unit;
  /** Radius multiplier applied after decoding `scale_*` columns. */
  radiusScale?: number;
  /** Minimum rendered splat radius in pixels. */
  radiusMinPixels?: number;
  /** Maximum rendered splat radius in pixels. */
  radiusMaxPixels?: number;
  /** Additional multiplier applied to decoded Gaussian alpha before blending. */
  alphaScale?: number;
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
  /** Additional two-dimensional screen-space Gaussian kernel radius in pixels. */
  kernel2DSize?: number;
  /** Maximum one-sigma screen-space splat size in pixels before support scaling. */
  maxScreenSpaceSplatSize?: number;
};

type SplatPrimitiveLayerProps = LayerProps & {
  data: LayerDataSource<unknown>;
  sizeUnits?: Unit;
  radiusScale?: number;
  radiusMinPixels?: number;
  radiusMaxPixels?: number;
  alphaScale?: number;
  screenSizeCutoffPixels?: number;
  gaussianSupportRadius?: number;
  kernel2DSize?: number;
  maxScreenSpaceSplatSize?: number;
  splatEngine?: SplatEngine | null;
};

type SplatUniformProps = {
  sizeUnits: number;
  radiusScale: number;
  radiusMinPixels: number;
  radiusMaxPixels: number;
  alphaScale: number;
  screenSizeCutoffPixels: number;
  gaussianSupportRadius: number;
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
  data: {type: 'object', compare: false, value: null},
  sizeUnits: 'meters',
  radiusScale: {type: 'number', min: 0, value: 1},
  radiusMinPixels: {type: 'number', min: 0, value: 0},
  radiusMaxPixels: {type: 'number', min: 0, value: Number.MAX_SAFE_INTEGER},
  alphaScale: {type: 'number', min: 0, value: 1},
  getColor: {type: 'color', value: DEFAULT_COLOR},
  renderMode: 'auto',
  sortMode: 'global',
  alphaCutoff: {type: 'number', min: 0, max: 1, value: 1 / 255},
  screenSizeCutoffPixels: {type: 'number', min: 0, value: 0},
  gaussianSupportRadius: {type: 'number', min: 0, value: 3},
  kernel2DSize: {type: 'number', min: 0, value: 0.3},
  maxScreenSpaceSplatSize: {type: 'number', min: 1, value: 1024}
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
  float alphaScale;
  float screenSizeCutoffPixels;
  float gaussianSupportRadius;
} splat;
`,
  fs: '',
  uniformTypes: {
    sizeUnits: 'i32',
    radiusScale: 'f32',
    radiusMinPixels: 'f32',
    radiusMaxPixels: 'f32',
    alphaScale: 'f32',
    screenSizeCutoffPixels: 'f32',
    gaussianSupportRadius: 'f32'
  }
} as const satisfies ShaderModule<SplatUniformProps>;

const source = /* wgsl */ `\
struct SplatUniforms {
  sizeUnits: i32,
  radiusScale: f32,
  radiusMinPixels: f32,
  radiusMaxPixels: f32,
  alphaScale: f32,
  screenSizeCutoffPixels: f32,
  gaussianSupportRadius: f32,
};

@group(0) @binding(auto)
var<uniform> splat: SplatUniforms;

@group(0) @binding(auto) var<storage, read> splatPositions: array<f32>;
@group(0) @binding(auto) var<storage, read> splatColors: array<u32>;
@group(0) @binding(auto) var<storage, read> splatIndices: array<u32>;
@group(0) @binding(auto) var<storage, read> splatProjected: array<vec4<f32>>;

struct FragmentInputs {
  @builtin(position) position: vec4<f32>,
  @location(0) gaussianCoord: vec2<f32>,
  @location(1) color: vec4<f32>,
  @location(2) splatAlpha: f32,
};

@vertex
fn vertexMain(
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32
) -> FragmentInputs {
  let corner = array<vec2<f32>, 4>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>(1.0, -1.0),
    vec2<f32>(-1.0, 1.0),
    vec2<f32>(1.0, 1.0)
  )[vertexIndex];
  let splatIndex = splatIndices[instanceIndex];
  let positionIndex = splatIndex * 3u;
  let projectedBase = splatIndex * 2u;
  let projectedAxes = splatProjected[projectedBase];
  let projectedMetadata = splatProjected[projectedBase + 1u];
  let splatPosition = vec3<f32>(
    splatPositions[positionIndex],
    splatPositions[positionIndex + 1u],
    splatPositions[positionIndex + 2u]
  );
  var adjustedSplatAlpha = projectedMetadata.x;
  var adjustedSupportRadius = splat.gaussianSupportRadius;
  if (adjustedSplatAlpha > 1.0) {
    adjustedSplatAlpha = min(adjustedSplatAlpha * 4.0 - 3.0, 5.0);
    adjustedSupportRadius = splat.gaussianSupportRadius + 0.7 * (adjustedSplatAlpha - 1.0);
  }
  let supportScale = adjustedSupportRadius * splat.radiusScale;
  let rawAxis0 = projectedAxes.xy * supportScale;
  let rawAxis1 = projectedAxes.zw * supportScale;
  let rawMaxAxisPixels = max(length(rawAxis0), length(rawAxis1));
  let clampedMaxAxisPixels = min(
    max(rawMaxAxisPixels, splat.radiusMinPixels),
    splat.radiusMaxPixels
  );
  let axisClampScale = clampedMaxAxisPixels / max(rawMaxAxisPixels, 0.000001);
  let axis0 = rawAxis0 * axisClampScale;
  let axis1 = rawAxis1 * axisClampScale;
  let sizeVisibility = select(
    0.0,
    1.0,
    rawMaxAxisPixels >= splat.screenSizeCutoffPixels
  );
  let visibleAlphaScale = layer.opacity * splat.alphaScale * projectedMetadata.y * sizeVisibility;
  let packedColor = splatColors[splatIndex];
  let color = vec4<f32>(
    f32(packedColor & 255u) / 255.0,
    f32((packedColor >> 8u) & 255u) / 255.0,
    f32((packedColor >> 16u) & 255u) / 255.0,
    visibleAlphaScale
  );
  var outputs: FragmentInputs;
  geometry.worldPosition = splatPosition;
  let gaussianCoord = corner * adjustedSupportRadius;
  geometry.uv = gaussianCoord;

  var clipPosition = project_position_to_clipspace(
    splatPosition,
    vec3<f32>(0.0, 0.0, 0.0),
    vec3<f32>(0.0, 0.0, 0.0)
  );
  let pixelOffset = corner.x * axis0 + corner.y * axis1;
  let clipOffset = project_pixel_size_to_clipspace(pixelOffset);
  clipPosition = vec4<f32>(
    clipPosition.x + clipOffset.x,
    clipPosition.y + clipOffset.y,
    clipPosition.z,
    clipPosition.w
  );

  outputs.position = clipPosition;
  outputs.gaussianCoord = gaussianCoord;
  outputs.color = color;
  outputs.splatAlpha = adjustedSplatAlpha;
  return outputs;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  let radiusSquared = dot(inputs.gaussianCoord, inputs.gaussianCoord);
  let supportRadius = select(
    splat.gaussianSupportRadius,
    splat.gaussianSupportRadius + 0.7 * (inputs.splatAlpha - 1.0),
    inputs.splatAlpha > 1.0
  );
  if (radiusSquared > supportRadius * supportRadius) {
    discard;
  }

  var alpha = inputs.splatAlpha;
  if (alpha <= 1.0) {
    alpha = alpha * exp(-0.5 * radiusSquared);
  } else {
    let alphaPower = exp((alpha * alpha - 1.0) / 2.718281828459045);
    alpha = 1.0 - pow(1.0 - exp(-0.5 * radiusSquared), alphaPower);
  }
  let color = vec4<f32>(inputs.color.rgb, inputs.color.a * alpha);
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

  vColor = vec4(instanceColors.rgb, instanceColors.a * layer.opacity * splat.alphaScale);
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

/** WebGPU vertex buffer layout for the storage-buffer driven render path. */
const WEBGPU_SPLAT_BUFFER_LAYOUT: BufferLayout[] = [];

/**
 * Renders GraphDECO-style Gaussian splat PLY data parsed as an Arrow table.
 *
 * The layer expects `POSITION`, `scale_0..2`, `opacity`, and `f_dc_0..2` columns.
 * Optional `f_rest_*` columns are evaluated as view-dependent spherical harmonic color.
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
    /** Arrow table batches loaded so far from async data. */
    arrowTableBatches: ArrowTableBatch[];
    /** WebGPU engines matching `arrowTableBatches`, when the GPU path is active. */
    streamEngines: (SplatEngine | null)[];
    /** Fallback color used to upload current stream engines. */
    streamEngineFallbackColor?: Color;
    /** Monotonic stream identifier used to ignore stale async data. */
    streamId: number;
    /** Error raised while consuming the current async data stream. */
    streamError: Error | null;
    /** Async iterable currently being consumed. */
    streamingData: AsyncIterable<ArrowTableBatch> | null;
    /** Version incremented when the engine loads another async batch. */
    engineDataVersion: number;
  };

  /** Initializes state used for static and streaming splat rendering. */
  initializeState(): void {
    this.setState({
      arrowTableBatches: [],
      streamEngines: [],
      streamId: 0,
      streamError: null,
      streamingData: null,
      engineDataVersion: 0
    });
  }

  /** Updates the shared splat engine when layer props change. */
  updateState(params: UpdateParameters<this>): void {
    super.updateState(params);

    if (isAsyncIterable(this.props.data)) {
      const splatEngine = this.getOrCreateSplatEngine();
      splatEngine.setProps(this.getSplatEngineProps());
      if (params.changeFlags.dataChanged) {
        this.destroyStreamEngines();
        const streamId = (this.state.streamId || 0) + 1;
        this.setState({
          arrowTableBatches: [],
          streamId,
          streamError: null,
          streamingData: this.props.data
        });
        splatEngine.setData(this.props.data, this.props.getColor || DEFAULT_COLOR);
      }
      return;
    }

    this.destroyStreamEngines();

    if (!this.props.data) {
      this.destroySplatEngine();
      return;
    }

    const arrowTable = getArrowTable(this.props.data);
    const fallbackColor = this.props.getColor || DEFAULT_COLOR;
    const splatEngine = this.getOrCreateSplatEngine();
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
    this.destroyStreamEngines();
  }

  /** Renders the Arrow table through a Gaussian billboard primitive. */
  renderLayers(): Layer | Layer[] | null {
    if (!this.props.data) {
      return null;
    }

    if (isAsyncIterable(this.props.data)) {
      const {streamError, splatEngine} = this.state;
      if (streamError) {
        throw streamError;
      }

      return splatEngine && splatEngine.getSplatCount() > 0
        ? this.renderSplatPrimitiveLayer(null, 'splats', splatEngine)
        : null;
    }

    const arrowTable = getArrowTable(this.props.data);
    return this.renderSplatPrimitiveLayer(arrowTable, 'splats', this.state?.splatEngine || null);
  }

  private renderSplatPrimitiveLayer(
    arrowTable: arrow.Table | null,
    id: string,
    splatEngine: SplatEngine | null
  ): Layer {
    const splatData = splatEngine
      ? this.context.device.type === 'webgpu'
        ? {length: splatEngine.getSplatCount(), attributes: {}}
        : splatEngine.getWebGLAttributes()
      : getDeckBinaryDataFromGaussianSplatArrowTable(
          arrowTable!,
          this.props.getColor,
          this.props.gaussianSupportRadius
        );

    return new SplatPrimitiveLayer({
      ...this.getSubLayerProps({id}),
      data: splatData,
      sizeUnits: this.props.sizeUnits,
      radiusScale: this.props.radiusScale,
      radiusMinPixels: this.props.radiusMinPixels,
      radiusMaxPixels: this.props.radiusMaxPixels,
      alphaScale: this.props.alphaScale,
      screenSizeCutoffPixels: this.props.screenSizeCutoffPixels,
      gaussianSupportRadius: this.props.gaussianSupportRadius,
      kernel2DSize: this.props.kernel2DSize,
      maxScreenSpaceSplatSize: this.props.maxScreenSpaceSplatSize,
      splatEngine
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

  private getOrCreateSplatEngine(): SplatEngine {
    this.shouldUseGpuEngine();
    let splatEngine = this.state.splatEngine;
    if (!splatEngine) {
      splatEngine = new SplatEngine(this.context.device, this.getSplatEngineProps());
      this.setState({splatEngine});
    }
    return splatEngine;
  }

  private getSplatEngineProps() {
    return {
      sortMode: (this.props.sortMode || 'global') as SplatSortMode,
      alphaCutoff: this.props.alphaCutoff ?? 1 / 255,
      screenSizeCutoffPixels: this.props.screenSizeCutoffPixels ?? 0,
      gaussianSupportRadius: this.props.gaussianSupportRadius ?? 3,
      kernel2DSize: this.props.kernel2DSize ?? 0.3,
      maxScreenSpaceSplatSize: this.props.maxScreenSpaceSplatSize ?? 1024,
      onDataUpdate: () =>
        this.setState({engineDataVersion: (this.state.engineDataVersion || 0) + 1}),
      onDataError: (error: Error) => this.setState({streamError: error})
    };
  }

  private destroySplatEngine(): void {
    this.state.splatEngine?.destroy();
    this.setState({splatEngine: undefined, engineTable: undefined, engineFallbackColor: undefined});
  }

  private destroyStreamEngines(): void {
    this.destroyStreamEngineResources();
    this.setState({
      arrowTableBatches: [],
      streamEngines: [],
      streamEngineFallbackColor: undefined,
      streamError: null,
      streamingData: null,
      engineDataVersion: 0
    });
  }

  /** Releases per-batch WebGPU engines without clearing loaded async batch state. */
  private destroyStreamEngineResources(): void {
    for (const splatEngine of this.state.streamEngines || []) {
      splatEngine?.destroy();
    }
    this.setState({
      streamEngines: [],
      streamEngineFallbackColor: undefined
    });
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
    alphaScale: {type: 'number', min: 0, value: 1},
    screenSizeCutoffPixels: {type: 'number', min: 0, value: 0},
    gaussianSupportRadius: {type: 'number', min: 0, value: 3},
    kernel2DSize: {type: 'number', min: 0, value: 0.3},
    maxScreenSpaceSplatSize: {type: 'number', min: 1, value: 1024},
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
    if (this.context.device.type === 'webgpu') {
      return;
    }

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

    const {
      sizeUnits,
      radiusScale,
      radiusMinPixels,
      radiusMaxPixels,
      alphaScale,
      screenSizeCutoffPixels,
      gaussianSupportRadius
    } = this.props;
    const splatProps: SplatUniformProps = {
      sizeUnits: UNIT[sizeUnits],
      radiusScale,
      radiusMinPixels,
      radiusMaxPixels,
      alphaScale,
      screenSizeCutoffPixels,
      gaussianSupportRadius
    };
    const model = this.state.model;
    if (!model) {
      return;
    }
    this.props.splatEngine?.update(
      getSplatEngineUpdateProps(this.context.viewport, this.props.radiusScale)
    );
    if (this.context.device.type === 'webgpu') {
      const splatEngine = this.props.splatEngine;
      if (!splatEngine) {
        return;
      }
      model.setBindings(splatEngine.getRenderBindings());
      model.setInstanceCount(splatEngine.getRenderSplatCount());
      model.setVertexCount(4);
    }
    model.shaderInputs.setProps({splat: splatProps});
    model.draw(this.context.renderPass);
  }

  /** Applies attribute buffers while preserving the explicit WebGPU buffer layout. */
  protected _setModelAttributes(
    model: Model,
    changedAttributes: {[id: string]: Attribute},
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
      geometry:
        this.context.device.type === 'webgpu'
          ? null
          : new Geometry({
              topology: 'triangle-strip',
              attributes: {
                positions: {
                  size: 3,
                  value: new Float32Array([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0])
                }
              }
            }),
      topology: 'triangle-strip',
      vertexCount: 4,
      instanceCount: this.props.splatEngine?.getRenderSplatCount() ?? 0,
      isInstanced: true
    });
  }
}

/** Build draw-time engine inputs from the active deck.gl viewport. */
function getSplatEngineUpdateProps(viewport: any, radiusScale: number) {
  if (!viewport) {
    return {radiusScale};
  }

  return {
    modelViewProjectionMatrix: viewport.viewProjectionMatrix,
    viewportSize: [viewport.width || 1, viewport.height || 1] as [number, number],
    cullingVolume: getCullingVolume(viewport),
    radiusScale,
    viewOrigin: getViewportCameraPosition(viewport)
  };
}

/** Return a viewport camera position suitable for view-dependent splat color. */
function getViewportCameraPosition(viewport: any): [number, number, number] | undefined {
  const cameraPosition = viewport.cameraPosition;
  if (cameraPosition && cameraPosition.length >= 3) {
    return [Number(cameraPosition[0]), Number(cameraPosition[1]), Number(cameraPosition[2])];
  }

  const viewMatrix = viewport.viewMatrix;
  if (viewMatrix && viewMatrix.length >= 16) {
    const translationX = Number(viewMatrix[12]);
    const translationY = Number(viewMatrix[13]);
    const translationZ = Number(viewMatrix[14]);
    const position: [number, number, number] = [
      -(
        Number(viewMatrix[0]) * translationX +
        Number(viewMatrix[1]) * translationY +
        Number(viewMatrix[2]) * translationZ
      ),
      -(
        Number(viewMatrix[4]) * translationX +
        Number(viewMatrix[5]) * translationY +
        Number(viewMatrix[6]) * translationZ
      ),
      -(
        Number(viewMatrix[8]) * translationX +
        Number(viewMatrix[9]) * translationY +
        Number(viewMatrix[10]) * translationZ
      )
    ];
    if (position.every(Number.isFinite)) {
      return position;
    }
  }
  return undefined;
}

/** Build a math.gl frustum culling volume from a deck.gl viewport. */
function getCullingVolume(viewport: any): CullingVolume | undefined {
  if (typeof viewport.getFrustumPlanes !== 'function') {
    return undefined;
  }

  const planes = Object.values(viewport.getFrustumPlanes()).map(
    ({normal, distance}: any) => new Plane(normal.clone().negate(), distance)
  );
  return new CullingVolume(planes);
}

/** Returns true when data can be consumed as async Arrow table batches. */
function isAsyncIterable(data: unknown): data is AsyncIterable<ArrowTableBatch> {
  return Boolean(
    data && typeof (data as AsyncIterable<ArrowTableBatch>)[Symbol.asyncIterator] === 'function'
  );
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
