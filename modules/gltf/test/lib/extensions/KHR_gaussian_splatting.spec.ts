import {describe, expect, test, vi} from 'vitest';
import {getGaussianSplatPrimitives} from '@loaders.gl/gltf';
import {decode} from '../../../src/lib/extensions/KHR_gaussian_splatting';

const baseAttributes = {
  POSITION: 0,
  'KHR_gaussian_splatting:ROTATION': 1,
  'KHR_gaussian_splatting:SCALE': 2,
  'KHR_gaussian_splatting:OPACITY': 3,
  'KHR_gaussian_splatting:SH_DEGREE_0_COEF_0': 4
};

/** Builds a minimal unresolved glTF around one Gaussian primitive. */
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
  test.each([
    ['kernel', undefined, 'missing kernel'],
    ['kernel', '', 'missing kernel'],
    ['colorSpace', undefined, 'missing colorSpace'],
    ['colorSpace', '', 'missing colorSpace']
  ])('rejects invalid %s %s', async (field, value, message) => {
    const gltf = makeGLTF({
      mode: 0,
      attributes: {},
      extensions: {
        KHR_gaussian_splatting: {
          kernel: 'ellipse',
          colorSpace: 'linear',
          [field]: value
        }
      }
    });
    await expect(decode(gltf, {} as any)).rejects.toThrow(message);
  });

  test.each([-1, 0.5, 2])('rejects invalid compressed bufferView %s', async bufferView => {
    const gltf = makeGLTF({
      mode: 0,
      attributes: {},
      extensions: {
        KHR_gaussian_splatting: {
          kernel: 'ellipse',
          colorSpace: 'linear',
          extensions: {KHR_gaussian_splatting_compression_spz_2: {bufferView}}
        }
      }
    });
    await expect(decode(gltf, {} as any)).rejects.toThrow('invalid SPZ bufferView');
  });

  test('requires base attributes and valid accessor indices', async () => {
    const extension = {kernel: 'ellipse', colorSpace: 'linear'};
    for (const attribute of Object.keys(baseAttributes)) {
      const attributes = {...baseAttributes} as Record<string, number>;
      delete attributes[attribute];
      const gltf = makeGLTF({mode: 0, attributes, extensions: {KHR_gaussian_splatting: extension}});
      await expect(decode(gltf, {} as any)).rejects.toThrow(`missing ${attribute}`);
    }
    for (const index of [-1, 0.5, 5]) {
      const gltf = makeGLTF({
        mode: 0,
        attributes: {...baseAttributes, POSITION: index},
        extensions: {KHR_gaussian_splatting: extension}
      });
      gltf.json.accessors = Array.from({length: 5}, () => ({
        componentType: 5126,
        count: 1,
        type: 'SCALAR'
      }));
      await expect(decode(gltf, {} as any)).rejects.toThrow('invalid accessor POSITION');
    }
  });

  test.each([
    ['KHR_gaussian_splatting:SCALE', -1],
    ['KHR_gaussian_splatting:OPACITY', -0.1],
    ['KHR_gaussian_splatting:OPACITY', 1.1]
  ])('validates loaded %s values', async (attribute, value) => {
    const gltf = makeGLTF({
      mode: 0,
      attributes: baseAttributes,
      extensions: {KHR_gaussian_splatting: {kernel: 'ellipse', colorSpace: 'linear'}}
    });
    const values = new Float32Array([1, 1, 1, 1, 1]);
    values[(baseAttributes as Record<string, number>)[attribute]] = value;
    gltf.json.accessors = Array.from({length: 5}, (_, index) => ({
      bufferView: index,
      componentType: 5126,
      count: 1,
      type: 'SCALAR'
    }));
    gltf.json.bufferViews = Array.from({length: 5}, (_, index) => ({
      buffer: 0,
      byteOffset: index * 4,
      byteLength: 4
    }));
    gltf.buffers = [{arrayBuffer: values.buffer, byteOffset: 0, byteLength: values.byteLength}];
    await expect(decode(gltf, {} as any)).rejects.toThrow(`invalid ${attribute} value`);
    values[(baseAttributes as Record<string, number>)[attribute]] = 0;
    await expect(decode(gltf, {} as any)).resolves.toBeUndefined();
  });

  test('validates complete spherical harmonic bands and lower-degree dependencies', async () => {
    const attributes = {...baseAttributes} as Record<string, number>;
    const gltf = makeGLTF({
      mode: 0,
      attributes,
      extensions: {KHR_gaussian_splatting: {kernel: 'ellipse', colorSpace: 'linear'}}
    });
    gltf.json.accessors = Array.from({length: 5}, () => ({
      componentType: 5126,
      count: 1,
      type: 'SCALAR'
    }));
    attributes['KHR_gaussian_splatting:SH_DEGREE_2_COEF_0'] = 4;
    await expect(decode(gltf, {} as any)).rejects.toThrow('incomplete SH degree 2');
    for (let index = 0; index < 5; index++)
      attributes[`KHR_gaussian_splatting:SH_DEGREE_2_COEF_${index}`] = 4;
    await expect(decode(gltf, {} as any)).rejects.toThrow('skips SH degree 1');
    for (let index = 0; index < 3; index++)
      attributes[`KHR_gaussian_splatting:SH_DEGREE_1_COEF_${index}`] = 4;
    for (let index = 0; index < 7; index++)
      attributes[`KHR_gaussian_splatting:SH_DEGREE_3_COEF_${index}`] = 4;
    await expect(decode(gltf, {} as any)).resolves.toBeUndefined();
  });

  test('requires loaded SPZ bytes when a decoder is supplied and preserves copies otherwise', async () => {
    const gltf = makeGLTF({
      mode: 0,
      attributes: {},
      extensions: {
        KHR_gaussian_splatting: {
          kernel: 'ellipse',
          colorSpace: 'linear',
          extensions: {KHR_gaussian_splatting_compression_spz_2: {bufferView: 0}}
        }
      }
    });
    gltf.json.bufferViews = [{buffer: 0, byteLength: 3}];
    const decoder = vi.fn();
    await expect(decode(gltf, {gltf: {splatDecoder: decoder}} as any)).rejects.toThrow(
      'not loaded'
    );
    const bytes = new Uint8Array([1, 2, 3]);
    gltf.buffers = [{arrayBuffer: bytes.buffer, byteOffset: 0, byteLength: 3}];
    await decode(gltf, {} as any);
    bytes[0] = 9;
    expect(Array.from(gltf.gaussianSplatPrimitives[0].compressedBytes)).toEqual([1, 2, 3]);
    expect(decoder).not.toHaveBeenCalled();
  });

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
