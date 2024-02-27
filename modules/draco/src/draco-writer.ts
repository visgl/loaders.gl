import type {WriterWithEncoder, WriterOptions} from '@loaders.gl/loader-utils';
import type {DracoMesh} from './lib/draco-types';
import type {DracoBuildOptions} from './lib/draco-builder';
import DRACOBuilder from './lib/draco-builder';
import {loadDracoEncoderModule} from './lib/draco-module-loader';
import {VERSION} from './lib/utils/version';

/** Writer Options for draco */
export type DracoWriterOptions = WriterOptions & {
  draco?: DracoBuildOptions & {
    method?: 'MESH_EDGEBREAKER_ENCODING' | 'MESH_SEQUENTIAL_ENCODING';
    speed?: [number, number];
    quantization?: Record<string, number>;
    attributeNameEntry?: string;
  };
};

const DEFAULT_DRACO_WRITER_OPTIONS = {
  pointcloud: false, // Set to true if pointcloud (mode: 0, no indices)
  attributeNameEntry: 'name'
  // Draco Compression Parameters
  // method: 'MESH_EDGEBREAKER_ENCODING', // Use draco defaults
  // speed: [5, 5], // Use draco defaults
  // quantization: { // Use draco defaults
  //   POSITION: 10
  // }
};

/**
 * Exporter for Draco3D compressed geometries
 */
export const DracoWriter = {
  name: 'DRACO',
  id: 'draco',
  module: 'draco',
  version: VERSION,
  extensions: ['drc'],
  options: {
    draco: DEFAULT_DRACO_WRITER_OPTIONS
  },
  encode
} as const satisfies WriterWithEncoder<DracoMesh, unknown, DracoWriterOptions>;

async function encode(data: DracoMesh, options: DracoWriterOptions = {}): Promise<ArrayBuffer> {
  // Dynamically load draco
  const {draco} = await loadDracoEncoderModule(options);
  const dracoBuilder = new DRACOBuilder(draco);

  try {
    return dracoBuilder.encodeSync(data, options.draco);
  } finally {
    dracoBuilder.destroy();
  }
}
