import {parse} from '@loaders.gl/core';
import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import {FlatGeobufLoader as FlatGeobufWorkerLoader} from './flatgeobuf-loader';
import {parseFlatGeobuf, parseFlatGeobufInBatches} from './lib/parse-flatgeobuf';
import {
  FlatGeobufLoaderOptions,
  GeoJSONRowTableOptions,
  ColumnarTableOptions,
  GeoJSONOptions,
  BinaryOptions,
  ReturnTypes
} from './lib/types';
import {
  GeoJSONRowTable,
  FeatureCollection,
  ColumnarTable,
  BinaryFeatures
} from '@loaders.gl/schema';

export {FlatGeobufWorkerLoader};

async function _parse(
  arrayBuffer: ArrayBuffer,
  options?: FlatGeobufLoaderOptions & GeoJSONOptions
): Promise<FeatureCollection>;
async function _parse(
  arrayBuffer: ArrayBuffer,
  options?: FlatGeobufLoaderOptions & GeoJSONRowTableOptions
): Promise<GeoJSONRowTable>;
async function _parse(
  arrayBuffer: ArrayBuffer,
  options?: FlatGeobufLoaderOptions & ColumnarTableOptions
): Promise<ColumnarTable>;
async function _parse(
  arrayBuffer: ArrayBuffer,
  options?: FlatGeobufLoaderOptions & BinaryOptions
): Promise<BinaryFeatures>;
async function _parse(arrayBuffer: ArrayBuffer, options?: FlatGeobufLoaderOptions): Promise<ReturnTypes> {
  return parseFlatGeobuf(arrayBuffer, options)
}

export const FlatGeobufLoader: LoaderWithParser<FlatGeobufLoaderOptions, ReturnTypes> = {
  ...FlatGeobufWorkerLoader,
  parse: _parse,
  parseSync: parseFlatGeobuf,
  // @ts-ignore
  parseInBatches: parseFlatGeobufInBatches,
  binary: true
};

export const _typecheckFlatGeobufLoader =
  FlatGeobufLoader;

// _typecheckFlatGeobufLoader.options
// TS knows this as an instance of FlatGeobufLoaderOptions

const test = await parse(new ArrayBuffer(0), FlatGeobufLoader);
test
// TS can at least infer ReturnTypes here

const test2 = await parse(new ArrayBuffer(0), FlatGeobufLoader, {flatgeobuf: {shape: 'binary'}});
test2
// But doesn't infer BinaryFeatures here :/
