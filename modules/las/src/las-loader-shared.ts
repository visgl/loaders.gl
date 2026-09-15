// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import {convertColorArrayToFloat16, convertColorArrayToFloat32} from '@loaders.gl/schema';
import type {MeshArrowTable} from '@loaders.gl/schema';
import {LASFormat} from './las-format';
import type {LASMesh} from './lib/las-types';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Arrow column names that can be selected from LAS point records. */
export type LASColumnName =
  | 'POSITION'
  | 'intensity'
  | 'classification'
  | 'synthetic'
  | 'keyPoint'
  | 'withheld'
  | 'overlap'
  | 'COLOR_0'
  | 'GPS_TIME'
  | 'NIR'
  | 'scanAngle'
  | 'userData'
  | 'pointSourceId'
  | 'returnNumber'
  | 'numberOfReturns'
  | 'scannerChannel'
  | 'scanDirectionFlag'
  | 'edgeOfFlightLine'
  | 'WAVEFORM'
  | 'EXTRA_BYTES';

/** Options accepted by LAS loader implementations. */
export type LASLoaderOptions = LoaderOptions & {
  las?: {
    /** Output representation. */
    shape?: 'mesh' | 'columnar-table' | 'arrow-table';
    /** Store positions in 64-bit floating point arrays. */
    fp64?: boolean;
    /** Output color depth or automatic source-depth detection. */
    colorDepth?: number | string;
    /** Color storage format. Defaults to uint8norm for backwards compatibility. */
    colorFormat?: 'uint8norm' | 'float16' | 'float32';
    /** Arrow columns to decode. POSITION is always included. */
    columns?: readonly LASColumnName[];
    /** Decode Extra Bytes descriptors into typed attributes instead of raw bytes. */
    extraBytes?: 'raw' | 'typed';
    /** Override the URL to the worker bundle. */
    workerUrl?: string;
  };
  /** Called as point data is decoded on the main thread. */
  onProgress?: Function;
};

/** Parser-independent LAS loader metadata shared by each loader variant. */
export const LAS_LOADER_METADATA = {
  ...LASFormat,

  dataType: null as unknown as LASMesh | MeshArrowTable,
  batchType: null as unknown as LASMesh | MeshArrowTable,

  version: VERSION,
  worker: false,
  options: {
    las: {
      shape: 'mesh',
      fp64: false,
      colorDepth: 8,
      colorFormat: 'uint8norm',
      columns: undefined,
      extraBytes: 'raw'
    }
  }
} as const satisfies Loader<LASMesh | MeshArrowTable, LASMesh | MeshArrowTable, LASLoaderOptions>;

/** Apply the requested normalized color representation to a decoded LAS mesh. */
export function formatLASMeshColors(
  mesh: LASMesh,
  colorFormat: 'uint8norm' | 'float16' | 'float32'
): LASMesh {
  if (colorFormat === 'uint8norm' || !mesh.attributes.COLOR_0) {
    return mesh;
  }

  const colorAttribute = mesh.attributes.COLOR_0;
  const sourceScale = colorAttribute.value instanceof Uint16Array ? 65535 : 255;
  const value =
    colorFormat === 'float16'
      ? convertColorArrayToFloat16(colorAttribute.value, sourceScale)
      : convertColorArrayToFloat32(colorAttribute.value, sourceScale);
  const attributes = {...mesh.attributes};

  for (const [attributeName, attribute] of Object.entries(attributes)) {
    if (attribute.value === colorAttribute.value) {
      attributes[attributeName] = {
        ...attribute,
        value,
        normalized: false,
        ...(colorFormat === 'float16' ? {componentType: 'float16' as const} : {})
      };
    }
  }

  return {...mesh, attributes};
}
