// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoadLibraryOptions} from '@loaders.gl/worker-utils';
import type {DracoDecoderProfile} from './lib/draco-module-loader';

/** Bundled Draco runtime selection and optional application overrides. */
export type DracoLibraryOptions = LoadLibraryOptions & {
  /** Selects the full decoder or the smaller glTF-compatible subset. Defaults to full. */
  decoderProfile?: DracoDecoderProfile;
};

/**
 * Creates browser-bundler URL overrides for vendored Draco encoder and decoder runtimes.
 * Classic assets are adjacent to source and emitted modules; generated ESM assets live in dist/libs.
 * Explicit application modules override the bundled defaults.
 */
export function getDracoLibraryOptions(
  options: DracoLibraryOptions = {}
): DracoLibraryOptions & {decoderProfile: DracoDecoderProfile} {
  const decoderProfile = options.decoderProfile ?? 'full';
  const decoderModules =
    decoderProfile === 'gltf'
      ? {
          'draco_wasm_wrapper_gltf.js': new URL(
            './libs/draco_wasm_wrapper_gltf.js',
            import.meta.url
          ).href,
          'draco_decoder_gltf.wasm': new URL('./libs/draco_decoder_gltf.wasm', import.meta.url).href
        }
      : {
          'draco_wasm_wrapper.js': new URL('./libs/draco_wasm_wrapper.js', import.meta.url).href,
          'draco_decoder.wasm': new URL('./libs/draco_decoder.wasm', import.meta.url).href
        };
  const moduleLibraries: Record<string, string> = {
    'draco_encoder.mjs': new URL('../dist/libs/draco_encoder.mjs', import.meta.url).href,
    'draco_decoder.mjs': new URL('../dist/libs/draco_decoder.mjs', import.meta.url).href,
    ...(decoderProfile === 'gltf'
      ? {
          'draco_wasm_wrapper_gltf.mjs': new URL(
            '../dist/libs/draco_wasm_wrapper_gltf.mjs',
            import.meta.url
          ).href
        }
      : {
          'draco_wasm_wrapper.mjs': new URL('../dist/libs/draco_wasm_wrapper.mjs', import.meta.url)
            .href
        })
  };
  // Do not substitute bundled ESM assets for an application's classic-name override.
  for (const libraryName of Object.keys(moduleLibraries)) {
    const classicName = libraryName.replace(/\.mjs$/, '.js');
    if (options.modules?.[classicName] !== undefined) {
      delete moduleLibraries[libraryName];
    }
  }
  return {
    ...options,
    decoderProfile,
    modules: {
      'draco_encoder.js': new URL('./libs/draco_encoder.js', import.meta.url).href,
      'draco_encoder.wasm': new URL('./libs/draco_encoder.wasm', import.meta.url).href,
      'draco_decoder.js': new URL('./libs/draco_decoder.js', import.meta.url).href,
      ...decoderModules,
      ...moduleLibraries,
      ...options.modules
    }
  };
}
