// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable */
import {DTYPE_LOOKUP} from './lib/zarr-pixel-source';
export type SupportedDtype = (typeof DTYPE_LOOKUP)[keyof typeof DTYPE_LOOKUP];
export type SupportedTypedArray = InstanceType<(typeof globalThis)[`${SupportedDtype}Array`]>;

interface Multiscale {
  axes?: Array<string | {name?: string; type?: string}>;
  datasets: {path: string; coordinateTransformations?: unknown[]}[];
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
    defaultT?: number;
    defaultZ?: number;
    model: string;
  };
  name?: string;
}

interface MultiscaleAttrs {
  multiscales: Multiscale[];
  coordinateTransformations?: unknown[];
}

interface OmeAttrs extends MultiscaleAttrs {
  omero: Omero;
}

interface OMEV05Attrs {
  ome?: Partial<OmeAttrs> & {coordinateTransformations?: unknown[]};
}

export type RootAttrs = (MultiscaleAttrs | OmeAttrs) & OMEV05Attrs;

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
