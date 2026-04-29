// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type * as arrow from 'apache-arrow';
import {
  color,
  CompositeLayer,
  Layer,
  picking,
  project32,
  UNIT,
  type CompositeLayerProps,
  type DefaultProps,
  type LayerProps,
  type LayerDataSource,
  type Unit,
  type Color
} from '@deck.gl/core';
import {Geometry, Model} from '@luma.gl/engine';
import type {ShaderModule} from '@luma.gl/shadertools';
import type {MeshArrowTable, TypedArray} from '@loaders.gl/schema';

const SH_C0 = 0.28209479177387814;
const DEFAULT_COLOR = [255, 255, 255, 255] as const;

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
};

type SplatPrimitiveLayerProps = LayerProps & {
  data: LayerDataSource<unknown>;
  sizeUnits?: Unit;
  radiusScale?: number;
  radiusMinPixels?: number;
  radiusMaxPixels?: number;
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

const defaultProps: DefaultProps<SplatLayerProps> = {
  id: 'splat-layer',
  sizeUnits: 'meters',
  radiusScale: {type: 'number', min: 0, value: 1},
  radiusMinPixels: {type: 'number', min: 0, value: 0},
  radiusMaxPixels: {type: 'number', min: 0, value: Number.MAX_SAFE_INTEGER},
  getColor: {type: 'color', value: DEFAULT_COLOR}
};

const splatUniforms = {
  name: 'splat',
  vs: /* glsl */ `\
layout(std140) uniform splatUniforms {
  highp int sizeUnits;
  float radiusScale;
  float radiusMinPixels;
  float radiusMaxPixels;
} splat;
`,
  fs: '',
  source: '',
  uniformTypes: {
    sizeUnits: 'i32',
    radiusScale: 'f32',
    radiusMinPixels: 'f32',
    radiusMaxPixels: 'f32'
  }
} as const satisfies ShaderModule<SplatUniformProps>;

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

  float gaussianAlpha = exp(-4.0 * radiusSquared);
  fragColor = vec4(vColor.rgb, vColor.a * gaussianAlpha);
  if (fragColor.a <= 0.00392156862) {
    discard;
  }

  DECKGL_FILTER_COLOR(fragColor, geometry);
}
`;

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

  /** Renders the Arrow table through a Gaussian billboard primitive. */
  renderLayers(): Layer | null {
    const arrowTable = getArrowTable(this.props.data);
    const splatData = getDeckBinaryDataFromGaussianSplatArrowTable(arrowTable, this.props.getColor);

    return new SplatPrimitiveLayer({
      ...this.getSubLayerProps({id: 'splats'}),
      data: splatData,
      sizeUnits: this.props.sizeUnits,
      radiusScale: this.props.radiusScale,
      radiusMinPixels: this.props.radiusMinPixels,
      radiusMaxPixels: this.props.radiusMaxPixels
    }) as unknown as Layer;
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
    radiusMaxPixels: {type: 'number', min: 0, value: Number.MAX_SAFE_INTEGER}
  };

  declare state: {
    model?: Model;
  };

  /** Returns splat shaders. */
  getShaders() {
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

  /** Draws all splat billboards. */
  draw(): void {
    const {sizeUnits, radiusScale, radiusMinPixels, radiusMaxPixels} = this.props;
    const splatProps: SplatUniformProps = {
      sizeUnits: UNIT[sizeUnits],
      radiusScale,
      radiusMinPixels,
      radiusMaxPixels
    };
    const model = this.state.model!;
    model.shaderInputs.setProps({splat: splatProps});
    model.draw(this.context.renderPass);
  }

  /** Builds the instanced billboard model. */
  protected _getModel(): Model {
    return new Model(this.context.device, {
      ...this.getShaders(),
      id: this.props.id,
      bufferLayout: this.getAttributeManager()!.getBufferLayouts(),
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
  fallbackColor: Color = DEFAULT_COLOR
): DeckBinaryData {
  const length = table.numRows;
  const positions = getPositionValues(table);
  const radii = getSplatRadii(table);
  const colors = getSplatColors(table, fallbackColor);

  return {
    length,
    attributes: {
      getPosition: {value: positions, size: 3},
      getRadius: {value: radii, size: 1},
      getColor: {value: colors, size: 4, type: 'unorm8'}
    }
  };
}

/** Return the underlying Apache Arrow table. */
function getArrowTable(data: MeshArrowTable | arrow.Table): arrow.Table {
  return isMeshArrowTable(data) ? data.data : (data as arrow.Table);
}

/** Checks whether layer data is a loaders.gl Arrow table wrapper. */
function isMeshArrowTable(data: MeshArrowTable | arrow.Table): data is MeshArrowTable {
  return (data as MeshArrowTable).shape === 'arrow-table';
}

/** Return POSITION values as an interleaved XYZ array. */
function getPositionValues(table: arrow.Table): Float32Array {
  const positionVector = table.getChild('POSITION');
  if (!positionVector) {
    throw new Error('SplatLayer requires a POSITION column.');
  }

  const directValues = getDirectFixedSizeListValues(positionVector, 3);
  if (directValues) {
    return directValues;
  }

  const positions = new Float32Array(table.numRows * 3);
  for (let rowIndex = 0; rowIndex < table.numRows; rowIndex++) {
    const position = positionVector.get(rowIndex) as ArrayLike<number> | null;
    if (!position || position.length < 3) {
      throw new Error(`SplatLayer could not read POSITION row ${rowIndex}.`);
    }
    positions[rowIndex * 3 + 0] = getArrayLikeValue(position, 0);
    positions[rowIndex * 3 + 1] = getArrayLikeValue(position, 1);
    positions[rowIndex * 3 + 2] = getArrayLikeValue(position, 2);
  }
  return positions;
}

/** Return a direct typed array for a single-chunk FixedSizeList vector when possible. */
function getDirectFixedSizeListValues(vector: arrow.Vector, size: number): Float32Array | null {
  const data = vector.data[0];
  const childData = data?.children[0];
  if (vector.data.length !== 1 || data.offset !== 0 || !childData?.values) {
    return null;
  }

  const values = childData.values;
  if (values instanceof Float32Array && values.length === vector.length * size) {
    return values;
  }

  return null;
}

/** Return decoded splat radii from `scale_0..2` columns. */
function getSplatRadii(table: arrow.Table): Float32Array {
  const scale0 = getRequiredNumericColumn(table, 'scale_0');
  const scale1 = getRequiredNumericColumn(table, 'scale_1');
  const scale2 = getRequiredNumericColumn(table, 'scale_2');
  const scaleEncoding = getFieldMetadata(table, 'scale_0', 'loaders_gl.gaussian_splats.encoding');
  const radii = new Float32Array(table.numRows);

  for (let rowIndex = 0; rowIndex < table.numRows; rowIndex++) {
    const radius = Math.max(scale0[rowIndex], scale1[rowIndex], scale2[rowIndex]);
    radii[rowIndex] = scaleEncoding === 'linear' ? radius : Math.exp(radius);
  }

  return radii;
}

/** Return splat colors from SH DC and opacity columns. */
function getSplatColors(table: arrow.Table, fallbackColor: Color): Uint8Array {
  const fdc0 = getOptionalNumericColumn(table, 'f_dc_0');
  const fdc1 = getOptionalNumericColumn(table, 'f_dc_1');
  const fdc2 = getOptionalNumericColumn(table, 'f_dc_2');
  const opacity = getOptionalNumericColumn(table, 'opacity');
  const opacityEncoding = getFieldMetadata(table, 'opacity', 'loaders_gl.gaussian_splats.encoding');
  const colors = new Uint8Array(table.numRows * 4);

  for (let rowIndex = 0; rowIndex < table.numRows; rowIndex++) {
    const colorIndex = rowIndex * 4;
    if (fdc0 && fdc1 && fdc2) {
      colors[colorIndex + 0] = normalizeColorByte(fdc0[rowIndex] * SH_C0 + 0.5);
      colors[colorIndex + 1] = normalizeColorByte(fdc1[rowIndex] * SH_C0 + 0.5);
      colors[colorIndex + 2] = normalizeColorByte(fdc2[rowIndex] * SH_C0 + 0.5);
    } else {
      colors[colorIndex + 0] = fallbackColor[0] ?? DEFAULT_COLOR[0];
      colors[colorIndex + 1] = fallbackColor[1] ?? DEFAULT_COLOR[1];
      colors[colorIndex + 2] = fallbackColor[2] ?? DEFAULT_COLOR[2];
    }

    const alpha = opacity ? opacity[rowIndex] : (fallbackColor[3] ?? DEFAULT_COLOR[3]) / 255;
    colors[colorIndex + 3] = normalizeColorByte(
      opacityEncoding === 'linear' ? alpha : 1 / (1 + Math.exp(-alpha))
    );
  }

  return colors;
}

/** Return a required numeric column as Float32 values. */
function getRequiredNumericColumn(table: arrow.Table, columnName: string): Float32Array {
  const column = getOptionalNumericColumn(table, columnName);
  if (!column) {
    throw new Error(`SplatLayer requires a ${columnName} column.`);
  }
  return column;
}

/** Return an optional numeric column as Float32 values. */
function getOptionalNumericColumn(table: arrow.Table, columnName: string): Float32Array | null {
  const column = table.getChild(columnName);
  if (!column) {
    return null;
  }

  const values = new Float32Array(table.numRows);
  for (let rowIndex = 0; rowIndex < table.numRows; rowIndex++) {
    values[rowIndex] = Number(column.get(rowIndex) ?? 0);
  }
  return values;
}

/** Return one field metadata value. */
function getFieldMetadata(table: arrow.Table, fieldName: string, key: string): string | undefined {
  return table.schema.fields.find(field => field.name === fieldName)?.metadata.get(key);
}

/** Return an indexed value from either an array or an Arrow vector. */
function getArrayLikeValue(values: ArrayLike<number>, index: number): number {
  const value = hasGetValue(values) ? values.get(index) : values[index];
  return Number(value);
}

/** Return true when a value has an Arrow-vector-style getter. */
function hasGetValue(values: ArrayLike<number>): values is ArrayLike<number> & {
  get: (index: number) => number;
} {
  return 'get' in values && typeof values.get === 'function';
}

/** Clamp a normalized color value and convert it to an unorm8 byte. */
function normalizeColorByte(value: number): number {
  return Math.round(Math.min(Math.max(value, 0), 1) * 255);
}
