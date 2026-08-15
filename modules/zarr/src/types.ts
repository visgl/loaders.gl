// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable */
import {DTYPE_LOOKUP} from './lib/zarr-pixel-source';
export type SupportedDtype = (typeof DTYPE_LOOKUP)[keyof typeof DTYPE_LOOKUP];
export type SupportedTypedArray = InstanceType<(typeof globalThis)[`${SupportedDtype}Array`]>;

/** Named OME axis matching one Zarr array dimension. */
interface MultiscaleAxis {
  /** Axis name used for dimension selection. */
  name?: string;
  /** Semantic axis type such as `space`, `time`, or `channel`. */
  type?: string;
}

/** One resolution level in an OME multiscale pyramid. */
interface MultiscaleDataset {
  /** Array path relative to the image group. */
  path: string;
  /** Transformations from array coordinates into the multiscale coordinate system. */
  coordinateTransformations?: unknown[];
}

interface Multiscale {
  /** Ordered OME axis descriptors matching the Zarr array dimensions. */
  axes?: Array<string | MultiscaleAxis>;
  /** Resolution levels and their transforms into the multiscale coordinate system. */
  datasets: MultiscaleDataset[];
  /** Transformations applied uniformly after each resolution-level transformation. */
  coordinateTransformations?: unknown[];
  version?: string;
}

interface Channel {
  active: boolean;
  color: string;
  label: string;
  window: {
    min?: number;
    max?: number;
    start: number;
    end: number;
  };
}

interface Omero {
  channels: Channel[];
  rdefs: {
    /** Default time index used for display. */
    defaultT?: number;
    /** Default z index used for display. */
    defaultZ?: number;
    model: string;
  };
  name?: string;
}

interface MultiscaleAttrs {
  multiscales: Multiscale[];
  /** Non-standard legacy location retained for compatibility. */
  coordinateTransformations?: unknown[];
}

interface OmeAttrs extends MultiscaleAttrs {
  omero: Omero;
}

interface OMEV05Attrs {
  /** OME-Zarr v0.5 metadata envelope. */
  ome?: Partial<OmeAttrs>;
}

export type RootAttrs = MultiscaleAttrs | OmeAttrs | OMEV05Attrs;

export type {Channel, Multiscale, Omero};

export interface PixelData {
  data: SupportedTypedArray;
  width: number;
  height: number;
}

export type PixelSourceSelection<S extends string[]> = {
  [K in S[number]]: number;
};

export interface RasterSelection<S extends string[]> {
  selection: PixelSourceSelection<S>;
  signal?: AbortSignal;
}

export interface TileSelection<S extends string[]> {
  x: number;
  y: number;
  selection: PixelSourceSelection<S>;
  signal?: AbortSignal;
}

interface PhysicalSize {
  size: number;
  unit: string;
}

export interface PixelSourceMeta {
  physicalSizes?: Record<string, PhysicalSize>;
  photometricInterpretation?: number;
}

export type Labels<S extends string[]> = [...S, 'y', 'x'] | [...S, 'y', 'x', '_c'];

export interface PixelSource<S extends string[]> {
  getRaster(sel: RasterSelection<S>): Promise<PixelData>;
  getTile(sel: TileSelection<S>): Promise<PixelData>;
  onTileError(err: Error): void;
  shape: number[];
  dtype: SupportedDtype;
  labels: Labels<S>;
  tileSize: number;
  meta?: PixelSourceMeta;
}
