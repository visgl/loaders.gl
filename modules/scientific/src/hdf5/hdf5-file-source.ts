// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {HDF5Source} from './hdf5-source';
import {openH5WasmBackend} from './h5wasm-backend';

/** Opens HDF5 bytes through the optional WASM decoder and shared scientific source. */
export async function openHDF5Source(input: ArrayBuffer | Uint8Array): Promise<HDF5Source> {
  return new HDF5Source(await openH5WasmBackend(input));
}
