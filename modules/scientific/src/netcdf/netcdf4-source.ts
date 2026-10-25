// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {HDF5Source, type HDF5Backend} from '../hdf5';
import type {
  ScientificArray, ScientificDatasetMetadata, ScientificSelection,
  ScientificSourceCapabilities, ScientificVariable
} from '../scientific-array';

/**
 * NetCDF-4 metadata adapter over HDF5 datasets.
 * HDF5 decoding is delegated to the supplied backend; NetCDF dimension scales,
 * groups and CF conventions require additional semantic qualification.
 */
export class NetCDF4Source {
  private readonly hdf5: HDF5Source;
  readonly scientificCapabilities: ScientificSourceCapabilities;
  constructor(backend: HDF5Backend) {
    this.hdf5 = new HDF5Source(backend);
    this.scientificCapabilities = this.hdf5.scientificCapabilities;
  }
  async getScientificMetadata(): Promise<ScientificDatasetMetadata> {
    const metadata = await this.hdf5.getScientificMetadata();
    return {
      ...metadata,
      variables: metadata.variables.map((variable): ScientificVariable => ({
        ...variable,
        units: typeof variable.attributes?.units === 'string' ?
          variable.attributes.units : undefined
      }))
    };
  }
  readScientificVariable(name: string, selection?: ScientificSelection): Promise<ScientificArray> {
    return this.hdf5.readScientificVariable(name, selection);
  }
  close(): Promise<void> {return this.hdf5.close();}
}
