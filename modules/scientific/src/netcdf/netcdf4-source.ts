// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {HDF5Source, type HDF5Backend} from '../hdf5/index';
import type {
  ScientificArray,
  ScientificDatasetMetadata,
  ScientificSelection,
  ScientificSourceCapabilities,
  ScientificVariable
} from '../scientific-array';

/**
 * NetCDF-4 metadata adapter over HDF5 datasets.
 * HDF5 decoding is delegated to the supplied backend; NetCDF dimension scales,
 * groups and CF conventions require additional semantic qualification.
 */
export class NetCDF4Source {
  /** HDF5 dataset source used by the NetCDF-4 adapter. */
  private readonly hdf5: HDF5Source;
  /** Selection and read capabilities shared with the HDF5 source. */
  readonly scientificCapabilities: ScientificSourceCapabilities;
  /** Create a NetCDF-4 adapter over an HDF5 backend. */
  constructor(backend: HDF5Backend) {
    this.hdf5 = new HDF5Source(backend);
    this.scientificCapabilities = this.hdf5.scientificCapabilities;
  }
  /** Read metadata and expose NetCDF units where available. */
  async getScientificMetadata(): Promise<ScientificDatasetMetadata> {
    const metadata = await this.hdf5.getScientificMetadata();
    return {
      ...metadata,
      variables: metadata.variables.map(
        (variable): ScientificVariable => ({
          ...variable,
          units:
            typeof variable.attributes?.units === 'string' ? variable.attributes.units : undefined
        })
      )
    };
  }
  /** Read a variable through the underlying HDF5 source. */
  readScientificVariable(name: string, selection?: ScientificSelection): Promise<ScientificArray> {
    return this.hdf5.readScientificVariable(name, selection);
  }
  /** Close the underlying HDF5 source. */
  close(): Promise<void> {
    return this.hdf5.close();
  }
}
