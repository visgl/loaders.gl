// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {openH5WasmBackend} from '../hdf5/h5wasm-backend';
import {NetCDF4Source} from './netcdf4-source';

/** Open HDF5-backed NetCDF-4 bytes. NetCDF dimension scales and CF interpretation remain pending. */
export async function openNetCDF4Source(input: ArrayBuffer | Uint8Array): Promise<NetCDF4Source> {
  return new NetCDF4Source(await openH5WasmBackend(input));
}
