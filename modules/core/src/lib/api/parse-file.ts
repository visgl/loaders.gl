// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  Loader,
  LoaderContext,
  LoaderOptions,
  LoaderOptionsWithShape,
  LoaderOptionsType,
  LoaderShapeType,
  LoaderReturnType,
  LoaderArrayOptionsType,
  LoaderArrayReturnType,
  LoaderWithParser,
  ReadableFile,
  StrictLoaderOptions
} from '@loaders.gl/loader-utils';
import {isSourceLoader, mergeOptions} from '@loaders.gl/loader-utils';
import {validateWorkerVersion} from '@loaders.gl/worker-utils';
import {isLoaderObject} from '../loader-utils/normalize-loader';
import {normalizeOptions} from '../loader-utils/option-utils';
import {getLoaderContext, getLoadersFromContext} from '../loader-utils/loader-context';
import {getLoaderImplementation} from './load-loader';
import {parse} from './parse';
import {selectLoader} from './select-loader';

/**
 * Parses a random access readable file asynchronously using the supplied loader.
 */
export async function parseFile<
  LoaderT extends Loader,
  OptionsT extends LoaderOptions = LoaderOptionsWithShape<
    LoaderOptionsType<LoaderT>,
    LoaderShapeType<LoaderT>
  >
>(
  file: ReadableFile,
  loader: LoaderT,
  options?: OptionsT,
  context?: LoaderContext
): Promise<LoaderReturnType<LoaderT>>;

/**
 * Parses a random access readable file asynchronously by matching one of the supplied loaders.
 */
export async function parseFile<
  LoaderArrayT extends Loader[],
  OptionsT extends LoaderOptions = LoaderArrayOptionsType<LoaderArrayT>
>(
  file: ReadableFile,
  loaders: LoaderArrayT,
  options?: OptionsT,
  context?: LoaderContext
): Promise<LoaderArrayReturnType<LoaderArrayT>>;

/**
 * Parses a random access readable file asynchronously by matching a pre-registered loader.
 * @deprecated Loader registration is deprecated, use parseFile(file, loaders, options) instead.
 */
export async function parseFile(file: ReadableFile, options?: LoaderOptions): Promise<unknown>;

/**
 * Parses a random access readable file using a specified loader.
 * @param file readable file
 * @param loaders loader or loaders to use
 * @param options loader options
 * @param context loader context
 * @returns parsed data
 */
export async function parseFile(
  file: ReadableFile,
  loaders?: Loader | Loader[] | LoaderOptions,
  options?: LoaderOptions,
  context?: LoaderContext
): Promise<unknown> {
  if (loaders && !Array.isArray(loaders) && !isLoaderObject(loaders)) {
    context = undefined;
    options = loaders as LoaderOptions;
    loaders = undefined;
  }

  options = options || {};
  const url = file.url || '';
  const typedLoaders = loaders as Loader | Loader[] | undefined;
  const candidateLoaders = getLoadersFromContext(typedLoaders, context);
  const loader = await selectLoader(url, candidateLoaders, options);
  if (!loader) {
    return null;
  }

  if (isSourceLoader(loader)) {
    throw new Error(
      `${loader.id} is a SourceLoader. Use load() to create a runtime source object instead of parseFile().`
    );
  }

  // @ts-expect-error candidateLoaders may be a single forced loader
  const strictOptions = normalizeOptions(options, loader, candidateLoaders, url);
  context = getLoaderContext(
    // @ts-expect-error candidateLoaders may be a single forced loader
    {url, _parse: parse, loaders: candidateLoaders},
    strictOptions,
    context || null
  );

  return await parseFileWithLoader(loader, file, strictOptions, context);
}

/**
 * Parses a readable file after a loader has been selected.
 * @param loader selected loader
 * @param file readable file
 * @param options strict loader options
 * @param context loader context
 * @returns parsed data
 */
async function parseFileWithLoader(
  loader: Loader,
  file: ReadableFile,
  options: StrictLoaderOptions,
  context: LoaderContext
): Promise<unknown> {
  validateWorkerVersion(loader);
  options = mergeOptions(loader.options, options);

  const loaderWithParser = await getLoaderImplementation(loader, options, context.url);
  if (loaderWithParser.parseFile) {
    return await loaderWithParser.parseFile(file, options, context);
  }

  const parseFunction = (loaderWithParser as {parse?: LoaderWithParser['parse']}).parse;
  if (parseFunction) {
    const length = file.bigsize > 0n ? Number(file.bigsize) : file.size;
    if (!length) {
      throw new Error(`${loader.id} loader - cannot fall back to parse without a file size`);
    }
    const data = await file.read(0n, length);
    return await parse(data, loaderWithParser, options, context);
  }

  throw new Error(`${loader.id} loader - no file parser found`);
}
