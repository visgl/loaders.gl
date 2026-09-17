import {describe, expect, test} from 'vitest';
import {getGaussianSplatPrimitives} from '@loaders.gl/gltf';
import {decode} from '../../../src/lib/extensions/KHR_gaussian_splatting';

const baseAttributes = {
  POSITION: 0,
  'KHR_gaussian_splatting:ROTATION': 1,
  'KHR_gaussian_splatting:SCALE': 2,
  'KHR_gaussian_splatting:OPACITY': 3,
  'KHR_gaussian_splatting:SH_DEGREE_0_COEF_0': 4
};

function makeGLTF(primitive: Record<string, unknown>) {
  return {
    json: {
      asset: {version: '2.0'},
      buffers: [{byteLength: 0}],
      bufferViews: [],
      accessors: [],
      meshes: [{primitives: [primitive]}]
    },
    buffers: []
  } as any;
}

describe('KHR_gaussian_splatting', () => {
  test('enumerates multiple Gaussian primitives without mutation', () => {
    const primitive = {
      mode: 0,
      attributes: baseAttributes,
      extensions: {KHR_gaussian_splatting: {kernel: 'ellipse', colorSpace: 'lin_rec709_display'}}
    };
    const gltf = makeGLTF(primitive);
    const descriptors = getGaussianSplatPrimitives(gltf);
    expect(descriptors).toHaveLength(1);
    expect(descriptors[0].attributes).toEqual(baseAttributes);
    expect(primitive.extensions).toHaveProperty('KHR_gaussian_splatting');
  });

  test('validates required POINTS attributes', async () => {
    const gltf = makeGLTF({
      mode: 4,
      attributes: baseAttributes,
      extensions: {KHR_gaussian_splatting: {kernel: 'ellipse', colorSpace: 'lin_rec709_display'}}
    });
    await expect(decode(gltf, {} as any)).rejects.toThrow(/POINTS mode/);
  });

  test('accepts an SPZ2 buffer view without placeholder attributes', async () => {
    const gltf = makeGLTF({
      mode: 0,
      attributes: {},
      extensions: {
        KHR_gaussian_splatting: {
          kernel: 'ellipse',
          colorSpace: 'lin_rec709_display',
          extensions: {KHR_gaussian_splatting_compression_spz_2: {bufferView: 0}}
        }
      }
    });
    gltf.json.bufferViews = [{buffer: 0, byteLength: 16}];
    await expect(decode(gltf, {} as any)).resolves.toBeUndefined();
  });

  test('preserves SPZ2 bytes and passes an explicit LUF hint to an injected decoder', async () => {
    const gltf = makeGLTF({
      mode: 0,
      attributes: {},
      extensions: {
        KHR_gaussian_splatting: {
          kernel: 'ellipse',
          colorSpace: 'lin_rec709_display',
          extensions: {KHR_gaussian_splatting_compression_spz_2: {bufferView: 0}}
        }
      }
    });
    gltf.json.bufferViews = [{buffer: 0, byteOffset: 1, byteLength: 3}];
    gltf.buffers = [
      {arrayBuffer: new Uint8Array([0, 1, 2, 3, 4]).buffer, byteOffset: 0, byteLength: 5}
    ];
    const decoder = async (bytes: ArrayBuffer, options: {sourceCoordinateSystem: string}) => {
      expect(Array.from(new Uint8Array(bytes))).toEqual([1, 2, 3]);
      expect(options.sourceCoordinateSystem).toBe('LUF');
      return {splatCount: 1};
    };
    await decode(gltf, {gltf: {splatDecoder: decoder}} as any);
    expect(gltf.gaussianSplatPrimitives?.[0].decoded).toEqual({splatCount: 1});
  });
});
