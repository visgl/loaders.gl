// loaders.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  type DefaultProps,
  type GetPickingInfoParams,
  type LayerContext,
  type UpdateParameters,
  log
} from '@deck.gl/core';
import {BitmapLayer, type BitmapLayerPickingInfo, type BitmapLayerProps} from '@deck.gl/layers';
import type {Texture} from '@luma.gl/core';
import type {ShaderModule} from '@luma.gl/shaders';
import type {TypedArray} from '@loaders.gl/core/loader-utils';
import {rasterBitmapUniforms, rasterTextureLayout} from './raster-bitmap-layer-shaders';
import {sampleColorRamp} from './raster-color-ramp';

/** Single-band samples in row-major order, starting at the top row. */
export type RasterBitmapData = {
  /** Samples to upload as float32. */
  data: TypedArray;
  /** Width in texels. */
  width: number;
  /** Height in texels. */
  height: number;
};

/** A preset name or a 256-entry table of RGBA bytes. */
export type RasterColormap = 'default' | 'viridis' | 'gray' | Uint8Array;

/** Transform applied to the normalized value before looking up its color. */
export type RasterValueScale = 'linear' | 'sqrt' | 'log';

/** Raster-specific props inherited by {@link RasterBitmapLayer}. */
type RasterBitmapExtraProps = {
  /** Single-band raster to display. */
  raster: RasterBitmapData | null;
  /** Inclusive endpoints of the color scale. Samples are clamped to this range. */
  valueRange: [number, number];
  /** Sentinel matched at source precision. Non-finite samples are always invalid. */
  noData?: number | null;
  /** Preset name or custom lookup table. Defaults to `'default'`. */
  colormap?: RasterColormap;
  /** Transform applied after normalization. Defaults to `'linear'`. */
  valueScale?: RasterValueScale;
  /** Texel interpolation mode. Defaults to `'linear'`. */
  interpolation?: 'linear' | 'nearest';
};

/** Props for {@link RasterBitmapLayer}. */
export type RasterBitmapLayerProps = Omit<BitmapLayerProps, 'data'> & RasterBitmapExtraProps;

/** Bitmap picking info augmented with the original CPU texel value. */
export type RasterBitmapLayerPickingInfo = BitmapLayerPickingInfo & {
  /**
   * Original sample, or null for a missing or invalid texel or unsupported raster dimensions.
   * Picking requires ceil(log2(width)) + ceil(log2(height)) <= 24.
   */
  value: number | null;
};

/** Default raster data and styling props. */
const defaultProps: DefaultProps<RasterBitmapExtraProps> = {
  raster: {type: 'object', value: null, compare: false},
  valueRange: {type: 'array', value: [0, 1], compare: true},
  noData: null,
  colormap: 'default',
  valueScale: 'linear',
  interpolation: 'linear'
};

/** Sampled Viridis stops from the float raster prototype. */
const VIRIDIS_STOPS = [
  [68, 1, 84],
  [59, 82, 139],
  [33, 145, 140],
  [94, 201, 98],
  [253, 231, 37]
];

/** Integer uniform values shared by both shader backends. */
const VALUE_SCALES: Record<RasterValueScale, number> = {linear: 0, sqrt: 1, log: 2};

/** Renders a single-band numeric raster with a GPU color lookup table. */
export class RasterBitmapLayer extends BitmapLayer<RasterBitmapExtraProps> {
  /** deck.gl layer name. */
  static override layerName = 'RasterBitmapLayer';

  /** Raster defaults, merged by deck.gl with BitmapLayer's defaults. */
  static override defaultProps: DefaultProps = defaultProps;

  /** Textures owned by this layer. */
  declare state: BitmapLayer['state'] & {
    /** Current single-band float texture. */
    rasterTexture?: Texture;
    /** Current color lookup texture. */
    colormapTexture?: Texture;
  };

  /** Replaces the base shader's image read and picking payload, retaining its projection and color hooks. */
  override getShaders() {
    const shaders = super.getShaders();
    const modules: ShaderModule[] = shaders.modules;
    if (this.context.device.type === 'webgpu') {
      return {
        ...shaders,
        source: replaceBitmapSample(
          shaders.source,
          'textureSample(bitmapTexture, bitmapTextureSampler, uv)'
        ),
        shaderLayout: {
          attributes: shaders.shaderLayout?.attributes ?? [],
          bindings: [...(shaders.shaderLayout?.bindings ?? []), ...rasterTextureLayout.bindings]
        },
        modules: [
          ...modules.map(module =>
            module.name === 'bitmap'
              ? {
                  ...module,
                  source: module.source?.replace(/^.*var bitmapTexture(?:Sampler)?:.*\n/gm, '')
                }
              : module
          ),
          rasterBitmapUniforms
        ]
      };
    }
    return {
      ...shaders,
      fs: replaceBitmapSample(shaders.fs, 'texture(bitmapTexture, uv)'),
      modules: [...modules, rasterBitmapUniforms]
    };
  }

  /** Replaces owned textures when the raster, its upload-time sentinel, or lookup table changes. */
  override updateState(parameters: UpdateParameters<this>): void {
    super.updateState(parameters);
    const {props, oldProps} = parameters;
    const {raster, noData, colormap = 'default'} = props;
    if (
      raster !== oldProps.raster ||
      (raster && !(raster.data instanceof Float32Array) && !Object.is(noData, oldProps.noData))
    ) {
      const rasterTexture = raster
        ? this.context.device.createTexture({
            id: `${this.id}-values`,
            format: 'r32float',
            width: raster.width,
            height: raster.height,
            data: getRasterUploadData(raster, noData).data,
            mipLevels: 1,
            sampler: {minFilter: 'nearest', magFilter: 'nearest'}
          })
        : undefined;
      this.state.rasterTexture?.destroy();
      this.state.rasterTexture = rasterTexture;
    }
    if (!this.state.colormapTexture || props.colormap !== oldProps.colormap) {
      const colormapTexture = this.context.device.createTexture({
        id: `${this.id}-colormap`,
        format: 'rgba8unorm',
        width: 256,
        height: 1,
        data: getColormapBytes(colormap),
        mipLevels: 1
      });
      this.state.colormapTexture?.destroy();
      this.state.colormapTexture = colormapTexture;
    }
  }

  /** Binds the raster and color lookup and draws with BitmapLayer's geometry. */
  override draw({shaderModuleProps}: Parameters<BitmapLayer['draw']>[0]): void {
    const {model, rasterTexture, colormapTexture, coordinateConversion, bounds, disablePicking} =
      this.state;
    if (
      !model ||
      !rasterTexture ||
      !colormapTexture ||
      (shaderModuleProps.picking.isActive && disablePicking)
    ) {
      return;
    }
    const {
      desaturate,
      transparentColor,
      tintColor,
      raster,
      valueRange,
      noData,
      valueScale,
      interpolation,
      colormap = 'default'
    } = this.props;
    const sentinel = getFloat32NoData(raster, noData);
    model.shaderInputs.setProps({
      bitmap: {
        bounds,
        coordinateConversion,
        desaturate,
        tintColor: tintColor.slice(0, 3).map(value => value / 255),
        transparentColor: transparentColor.map(value => value / 255)
      },
      rasterBitmap: {
        rasterTexture,
        rasterColormap: colormapTexture,
        valueRange,
        noData: sentinel ?? 0,
        useNoData: Number(sentinel !== null),
        valueScale: VALUE_SCALES[valueScale ?? 'linear'],
        linearInterpolation: Number(interpolation !== 'nearest'),
        interpolateColormap: Number(colormap === 'default'),
        pickingRowStride: raster ? getPickingRowStride(raster) : 0
      }
    });
    model.draw(this.context.renderPass);
  }

  /** Decodes the packed RGB texel index and reads the matching CPU sample. */
  override getPickingInfo(parameters: GetPickingInfoParams): RasterBitmapLayerPickingInfo {
    const info = parameters.info as RasterBitmapLayerPickingInfo;
    const {raster, noData} = this.props;
    info.bitmap = null;
    info.value = null;
    if (!raster || !info.color) {
      return info;
    }
    // RGB encodes the texel. The picking pass identifies the layer separately in alpha.
    info.index = 0;
    const rowStride = getPickingRowStride(raster);
    if (!rowStride) {
      if (!warnedPickingLimit) {
        warnedPickingLimit = true;
        log.warn('RasterBitmapLayer picking requires at most 24 bits across both raster axes')();
      }
      return info;
    }

    const {width, height, data} = raster;
    const [red, green, blue] = info.color;
    const packedIndex = red + green * 256 + blue * 65536;
    const column = packedIndex % rowStride;
    const row = Math.floor(packedIndex / rowStride);
    if (column >= width || row >= height) {
      return info;
    }
    info.bitmap = {
      size: {width, height},
      uv: [(column + 0.5) / width, (row + 0.5) / height],
      pixel: [column, row]
    };
    const value = data[row * width + column];
    const sentinel = getFloat32NoData(raster, noData) ?? noData;
    info.value = Number.isFinite(value) && value !== sentinel ? value : null;
    return info;
  }

  /** Releases owned raster and colormap textures. */
  override finalizeState(context: LayerContext): void {
    this.state.rasterTexture?.destroy();
    this.state.colormapTexture?.destroy();
    super.finalizeState(context);
  }
}

/**
 * Prepares float texture samples, masking converted samples before they lose source precision.
 * @returns The upload data and whether the shader should compare a noData sentinel.
 */
export function getRasterUploadData(
  raster: RasterBitmapData,
  noData?: number | null
): {data: Float32Array; useNoData: boolean} {
  const source = raster.data;
  if (source instanceof Float32Array) {
    return {data: source, useNoData: getFloat32NoData(raster, noData) !== null};
  }
  const hasSentinel = Number.isFinite(noData);
  const data = new Float32Array(source.length);
  for (let index = 0; index < source.length; index++) {
    const value = source[index];
    data[index] = hasSentinel && value === noData ? NaN : value;
  }
  return {data, useNoData: false};
}

/** Returns the shader and picking sentinel for a raster uploaded directly as float32. */
function getFloat32NoData(raster: RasterBitmapData | null, noData?: number | null): number | null {
  return raster?.data instanceof Float32Array && noData != null && Number.isFinite(noData)
    ? Math.fround(noData)
    : null;
}

/** Warns once when a raster is too large for the packed picking index. */
let warnedPickingLimit = false;

/** Returns the power-of-two picking row stride, or zero if the texel index exceeds 24 bits. */
function getPickingRowStride({width, height}: RasterBitmapData): number {
  const bitsX = Math.max(0, Math.ceil(Math.log2(width)));
  const bitsY = Math.max(0, Math.ceil(Math.log2(height)));
  return bitsX + bitsY <= 24 ? 2 ** bitsX : 0;
}

/** Replaces BitmapLayer's sampling and RGB picking expressions. */
function replaceBitmapSample(shader: string, sampleExpression: string): string {
  if (!shader.includes(sampleExpression)) {
    throw new Error('RasterBitmapLayer could not find the BitmapLayer texture sample');
  }
  return shader
    .replace(sampleExpression, 'raster_sample(uv)')
    .replaceAll('packUVsIntoRGB(uv)', 'raster_pickingColor(uv)');
}

/** Builds a 256-entry preset or validates a custom RGBA table. */
function getColormapBytes(colormap: RasterColormap): Uint8Array {
  if (colormap instanceof Uint8Array) {
    if (colormap.length !== 256 * 4) {
      throw new Error('RasterBitmapLayer colormap must contain 256 RGBA entries (1024 bytes)');
    }
    return colormap;
  }
  const bytes = new Uint8Array(256 * 4);
  for (let index = 0; index < 256; index++) {
    bytes[index * 4 + 3] = 255;
    if (colormap === 'default') {
      bytes.set(sampleColorRamp(index / 255), index * 4);
      continue;
    }
    const position = (index / 255) * (VIRIDIS_STOPS.length - 1);
    const start = Math.min(Math.floor(position), VIRIDIS_STOPS.length - 2);
    const fraction = position - start;
    for (let channel = 0; channel < 3; channel++) {
      bytes[index * 4 + channel] =
        colormap === 'gray'
          ? index
          : Math.round(
              VIRIDIS_STOPS[start][channel] * (1 - fraction) +
                VIRIDIS_STOPS[start + 1][channel] * fraction
            );
    }
  }
  return bytes;
}
