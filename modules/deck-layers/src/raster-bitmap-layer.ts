// loaders.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {
  DefaultProps,
  GetPickingInfoParams,
  LayerContext,
  UpdateParameters
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
  /** Sentinel for invalid texels. NaN is always invalid. */
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
  /** Original sample, or null for a missing or invalid texel. */
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

  /** Replaces only the base shader's image read, retaining its projection and color hooks. */
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

  /** Replaces owned textures when the raster or lookup table changes. */
  override updateState(parameters: UpdateParameters<this>): void {
    super.updateState(parameters);
    const {props, oldProps} = parameters;
    const {raster, colormap = 'default'} = props;
    if (raster !== oldProps.raster) {
      const rasterTexture = raster
        ? this.context.device.createTexture({
            id: `${this.id}-values`,
            format: 'r32float',
            width: raster.width,
            height: raster.height,
            data:
              raster.data instanceof Float32Array ? raster.data : Float32Array.from(raster.data),
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
      valueRange,
      noData,
      valueScale,
      interpolation,
      colormap = 'default'
    } = this.props;
    const useNoData = noData != null && Number.isFinite(noData);
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
        noData: useNoData ? noData : 0,
        useNoData: Number(useNoData),
        valueScale: VALUE_SCALES[valueScale ?? 'linear'],
        linearInterpolation: Number(interpolation !== 'nearest'),
        interpolateColormap: Number(colormap === 'default')
      }
    });
    model.draw(this.context.renderPass);
  }

  /** Decodes BitmapLayer's picking payload and reads the matching CPU texel. */
  override getPickingInfo(parameters: GetPickingInfoParams): RasterBitmapLayerPickingInfo {
    const info = parameters.info as RasterBitmapLayerPickingInfo;
    const {raster, noData} = this.props;
    if (!raster || (!info.bitmap && !info.color)) {
      info.bitmap = null;
      info.value = null;
      return info;
    }
    const {width, height, data} = raster;
    // BitmapLayer normally decodes this color only when its image prop is set.
    if (!info.bitmap) {
      const [red, green, blue] = info.color!;
      const uv: [number, number] = [
        (red * 16 + (blue & 15)) / 4096,
        (green * 16 + (blue >> 4)) / 4096
      ];
      info.index = 0;
      info.bitmap = {
        size: {width, height},
        uv,
        pixel: [Math.floor(uv[0] * width), Math.floor(uv[1] * height)]
      };
    }
    const [column, row] = info.bitmap.pixel;
    const value =
      column >= 0 && column < width && row >= 0 && row < height ? data[row * width + column] : NaN;
    const sentinel = noData != null && data instanceof Float32Array ? Math.fround(noData) : noData;
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

/** Replaces the sample expression and keeps picking UVs in BitmapLayer's 12-bit range. */
function replaceBitmapSample(shader: string, sampleExpression: string): string {
  if (!shader.includes(sampleExpression)) {
    throw new Error('RasterBitmapLayer could not find the BitmapLayer texture sample');
  }
  return shader
    .replace(sampleExpression, 'raster_sample(uv)')
    .replaceAll('packUVsIntoRGB(uv)', 'packUVsIntoRGB(raster_pickingUV(uv))');
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
