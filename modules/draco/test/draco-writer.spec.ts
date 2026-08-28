import {expect, test} from 'vitest';
import {validateWriter, validateMeshCategoryData} from 'test/common/conformance';
import {DracoLoader, DracoWriterOptions, DracoWriter, DracoWriterWorker} from '@loaders.gl/draco';
import {encode, fetchFile, parse} from '@loaders.gl/core';
// import {getMeshSize} from '@loaders.gl/schema-utils';
import draco3d from 'draco3d';
import {isBrowser, processOnWorker, WorkerFarm} from '@loaders.gl/worker-utils';
import {cloneTypeArray} from './test-utils/copyTypedArray';
export type TestCase = {
  title: string;
  options: DracoWriterOptions;
};
const TEST_CASES: TestCase[] = [
  {
    title: 'Encoding Draco Mesh: SEQUENTIAL',
    options: {
      draco: {
        method: 'MESH_SEQUENTIAL_ENCODING'
      }
    }
  },
  {
    title: 'Encoding Draco Mesh: EDGEBREAKER',
    options: {
      draco: {
        method: 'MESH_EDGEBREAKER_ENCODING'
      }
    }
  },
  {
    title: 'Encoding Draco PointCloud (no indices)',
    options: {
      draco: {pointcloud: true}
    }
  }
];
const BUNNY_DRC_URL = '@loaders.gl/draco/test/data/bunny.drc';
async function loadBunny() {
  const response = await fetchFile(BUNNY_DRC_URL);
  const arrayBuffer = await response.arrayBuffer();
  // Decode Loaded Mesh to use as input data for encoders
  return await parse(arrayBuffer, DracoLoader, {useLocalLibraries: true});
}
test('DracoWriter#loader conformance', () => {
  validateWriter(DracoWriter, 'DracoWriter');
});
test('DracoWriter#preserves normalized MeshAttribute descriptors', async () => {
  const compressedMesh = await encode(
    {
      attributes: {
        POSITION: {
          value: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]),
          size: 3
        },
        COLOR_0: {
          value: new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255]),
          size: 4,
          normalized: true
        }
      },
      indices: {value: new Uint16Array([0, 1, 2]), size: 1}
    },
    DracoWriter,
    {useLocalLibraries: true}
  );
  const decodedMesh = await parse(compressedMesh, DracoLoader, {
    core: {worker: false},
    useLocalLibraries: true
  });

  expect(decodedMesh.attributes.COLOR_0.normalized).toBe(true);
  expect(decodedMesh.attributes.COLOR_0.value).toEqual(
    new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255])
  );
});
test('DracoWriter#encode(bunny.drc)', async () => {
  if (skipBrowserDracoWasmTest()) {
    return;
  }
  const data = await loadBunny();
  expect(data.attributes.POSITION.value.length, 'POSITION attribute was found').toBe(104502);
  const MESH = {
    attributes: {
      POSITION: data.attributes.POSITION.value
    },
    indices: data.indices?.value
  };
  const POINTCLOUD = {
    attributes: {
      POSITION: data.attributes.POSITION.value
    }
  };
  const compressedMeshByteLengths = new Map<string, number>();
  for (const tc of TEST_CASES) {
    const mesh = tc.options.draco?.pointcloud ? POINTCLOUD : MESH;
    const compressedMesh = await encode(mesh, DracoWriter, tc.options);
    compressedMeshByteLengths.set(tc.title, compressedMesh.byteLength);
    // const meshSize = getMeshSize(mesh.attributes);
    // const ratio = meshSize / compressedMesh.byteLength;
    // t.comment(`${tc.title} ${compressedMesh.byteLength} bytes, ratio ${ratio.toFixed(1)}`);
    if (!tc.options.pointcloud) {
      // Decode the mesh
      const data2 = await parse(compressedMesh, DracoLoader);
      validateMeshCategoryData(data2);
      // t.comment(JSON.stringify(data));
      expect(
        data2.attributes.POSITION.value.length,
        `${tc.title} decoded POSITION length matched`
      ).toBe(data.attributes.POSITION.value.length);
    }
  }
  const sequentialMeshByteLength = compressedMeshByteLengths.get('Encoding Draco Mesh: SEQUENTIAL');
  const edgebreakerMeshByteLength = compressedMeshByteLengths.get(
    'Encoding Draco Mesh: EDGEBREAKER'
  );
  expect(sequentialMeshByteLength, 'Sequential mesh encoded').toBeTruthy();
  expect(edgebreakerMeshByteLength, 'Edgebreaker mesh encoded').toBeTruthy();
  expect(
    sequentialMeshByteLength &&
      edgebreakerMeshByteLength &&
      edgebreakerMeshByteLength < sequentialMeshByteLength,
    `Edgebreaker mesh encoding (${edgebreakerMeshByteLength}) is smaller than sequential mesh encoding (${sequentialMeshByteLength})`
  ).toBeTruthy();
});
test('DracoWriter#Worker$encode(bunny.drc)', async () => {
  if (!isBrowser) {
    return;
  }
  const data = await loadBunny();
  const positionValueLength = data.attributes.POSITION.value.length;
  expect(positionValueLength, 'POSITION attribute was found').toBe(104502);
  for (const tc of TEST_CASES) {
    const mesh: {
      attributes: {POSITION: typeof data.attributes.POSITION.value};
      indices?: typeof data.indices.value;
    } = {
      attributes: {POSITION: cloneTypeArray(data.attributes.POSITION.value)}
    };
    if (!tc.options.draco?.pointcloud && data.indices) {
      mesh.indices = cloneTypeArray(data.indices.value);
    }
    const compressedMesh = await processOnWorker(DracoWriterWorker, mesh, {
      ...tc.options,
      useLocalLibraries: true,
      _workerType: 'test'
    });
    // const meshSize = getMeshSize(mesh.attributes);
    // const ratio = meshSize / compressedMesh.byteLength;
    // t.comment(`${tc.title} ${compressedMesh.byteLength} bytes, ratio ${ratio.toFixed(1)}`);
    if (!tc.options.pointcloud) {
      // Decode the mesh
      const data2 = await parse(compressedMesh, DracoLoader, {useLocalLibraries: true});
      validateMeshCategoryData(data2);
      // t.comment(JSON.stringify(data));
      expect(
        data2.attributes.POSITION.value.length,
        `${tc.title} decoded POSITION length matched`
      ).toBe(positionValueLength);
    }
  }
});
test('DracoWriter#WorkerNodeJS#encode(bunny.drc)', async () => {
  if (isBrowser) {
    return;
  }
  const data = await loadBunny();
  expect(data.attributes.POSITION.value.length, 'POSITION attribute was found').toBe(104502);
  for (const tc of TEST_CASES) {
    // Copy position buffer because it won't be available after being sent to the worker
    const mesh = {
      attributes: {
        POSITION: cloneTypeArray(data.attributes.POSITION.value)
      }
    };
    if (!tc.options.draco?.pointcloud) {
      // Copy indices buffer because it won't be available after being sent to the worker
      // @ts-expect-error
      mesh.indices = cloneTypeArray(data.indices?.value);
    }
    const compressedMesh = await processOnWorker(DracoWriterWorker, mesh, {
      ...tc.options,
      _workerType: 'test'
    });
    // const compressedMesh = await encode(mesh, DracoWriter, tc.options);
    // const meshSize = getMeshSize(mesh.attributes);
    // const ratio = meshSize / compressedMesh.byteLength;
    // t.comment(`${tc.title} ${compressedMesh.byteLength} bytes, ratio ${ratio.toFixed(1)}`);
    if (!tc.options.pointcloud) {
      // Decode the mesh
      const data2 = await parse(compressedMesh, DracoLoader);
      validateMeshCategoryData(data2);
      // t.comment(JSON.stringify(data));
      expect(
        data2.attributes.POSITION.value.length,
        `${tc.title} decoded POSITION length matched`
      ).toBe(data.attributes.POSITION.value.length);
    }
  }
  // Destroy all workers in NodeJS
  if (!isBrowser) {
    const workerFarm = WorkerFarm.getWorkerFarm({});
    workerFarm.destroy();
  }
});
test('DracoWriter#encode via draco3d npm package (bunny.drc)', async () => {
  if (skipBrowserDracoWasmTest()) {
    return;
  }
  const data = await loadBunny();
  expect(data.attributes.POSITION.value.length, 'POSITION attribute was found').toBe(104502);
  const MESH = {
    attributes: {
      POSITION: data.attributes.POSITION.value
    },
    indices: data.indices?.value
  };
  const POINTCLOUD = {
    attributes: {
      POSITION: data.attributes.POSITION.value
    }
  };
  for (const tc of TEST_CASES) {
    const mesh = tc.options.draco?.pointcloud ? POINTCLOUD : MESH;
    const compressedMesh = await encode(mesh, DracoWriter, {
      ...tc.options,
      modules: {
        draco3d
      }
    });
    // const meshSize = getMeshSize(mesh.attributes);
    // const ratio = meshSize / compressedMesh.byteLength;
    // t.comment(`${tc.title} ${compressedMesh.byteLength} bytes, ratio ${ratio.toFixed(1)}`);
    if (!tc.options.pointcloud) {
      // Decode the mesh
      const data2 = await parse(compressedMesh, DracoLoader, {
        modules: {
          draco3d
        }
      });
      validateMeshCategoryData(data2);
      // t.comment(JSON.stringify(data));
      expect(
        data2.attributes.POSITION.value.length,
        `${tc.title} decoded POSITION length matched`
      ).toBe(data.attributes.POSITION.value.length);
    }
  }
});
test('DracoWriter#encode(bunny.drc)', async () => {
  if (skipBrowserDracoWasmTest()) {
    return;
  }
  const data = await loadBunny();
  validateMeshCategoryData(data);
  expect(data.attributes.POSITION.value.length, 'POSITION attribute was found').toBe(104502);
  const meshAttributes = {
    POSITION: data.attributes.POSITION.value,
    indices: data.indices?.value
  };
  const pointCloudAttributes = {
    POSITION: data.attributes.POSITION.value
  };
  for (const tc of TEST_CASES) {
    const attributes = tc.options.draco?.pointcloud ? pointCloudAttributes : meshAttributes;
    const compressedMesh = await encode(attributes, DracoWriter, tc.options);
    // const meshSize = getMeshSize(attributes);
    // const ratio = meshSize / compressedMesh.byteLength;
    // t.comment(`${tc.title} ${compressedMesh.byteLength} bytes, ratio ${ratio.toFixed(1)}`);
    if (!tc.options.pointcloud) {
      // Decode the mesh
      const data2 = await parse(compressedMesh, DracoLoader);
      validateMeshCategoryData(data2);
      // t.comment(JSON.stringify(data));
      expect(
        data2.attributes.POSITION.value.length,
        `${tc.title} decoded POSITION length matched`
      ).toBe(data.attributes.POSITION.value.length);
    }
  }
});
test('DracoWriter#should encode texCoord/texCoords attribute as TEX_COORD attribute type', async () => {
  if (skipBrowserDracoWasmTest()) {
    return;
  }
  const data = await loadBunny();
  validateMeshCategoryData(data);
  expect(data.attributes.POSITION.value.length, 'POSITION attribute was found').toBe(104502);
  const vertexCount = data.attributes.POSITION.value.length / 3;
  const texCoord = new Float32Array(vertexCount * 2);
  texCoord.fill(1);
  const meshAttributes = {
    POSITION: data.attributes.POSITION.value,
    texCoord,
    indices: data.indices?.value
  };
  const compressedMesh = await encode(meshAttributes, DracoWriter);
  const data2 = await parse(compressedMesh, DracoLoader);
  expect(data2.attributes.TEXCOORD_0.value.length, 'Decoded texCoord length matched').toBe(
    texCoord.length
  );
  const meshAttributes2 = {
    POSITION: data.attributes.POSITION.value,
    texCoords: texCoord,
    indices: data.indices?.value
  };
  const compressedMesh2 = await encode(meshAttributes2, DracoWriter);
  const data3 = await parse(compressedMesh2, DracoLoader);
  expect(data3.attributes.TEXCOORD_0.value.length, 'Decoded texCoords length matched').toBe(
    texCoord.length
  );
});
test('DracoWriter#geometry metadata', async () => {
  if (skipBrowserDracoWasmTest()) {
    return;
  }
  const data = await loadBunny();
  validateMeshCategoryData(data);
  expect(data.attributes.POSITION.value.length, 'POSITION attribute was found').toBe(104502);
  const attributes = {
    POSITION: data.attributes.POSITION.value,
    indices: data.indices?.value
  };
  let compressedMesh = await encode(attributes, DracoWriter, {
    draco: {}
  });
  expect(compressedMesh.byteLength, 'Correct length').toBe(435479);
  compressedMesh = await encode(attributes, DracoWriter, {
    draco: {
      metadata: {
        author: 'loaders.gl',
        'optional-entry-int': 1444,
        'optional-entry-int-negative': -333333333,
        'optional-entry-int-zero': 0,
        'optional-entry-double': 1.00012323
      }
    }
  });
  expect(
    compressedMesh.byteLength,
    'Correct length - different from encoded geometry without metadata'
  ).toBe(435614);
  // Decode the mesh
  const data2 = await parse(compressedMesh, DracoLoader, {
    core: {worker: false}
  });
  validateMeshCategoryData(data2);
  expect(data2.loaderData.metadata).toBeTruthy();
  expect(data2.loaderData.metadata.author).toBeTruthy();
  expect(data2.loaderData.metadata.author.string).toBe('loaders.gl');
  expect(data2.loaderData.metadata['optional-entry-int']).toBeTruthy();
  expect(data2.loaderData.metadata['optional-entry-int-negative']).toBeTruthy();
  expect(data2.loaderData.metadata['optional-entry-int-zero']).toBeTruthy();
  expect(data2.loaderData.metadata['optional-entry-double']).toBeTruthy();
  expect(data2.loaderData.metadata['optional-entry-int'].int).toBe(1444);
  expect(data2.loaderData.metadata['optional-entry-int-negative'].int).toBe(-333333333);
  expect(data2.loaderData.metadata['optional-entry-int-zero'].int).toBe(0);
  expect(data2.loaderData.metadata['optional-entry-double'].double).toBe(1.00012323);
  expect(data2.attributes.POSITION.value.length, 'decoded POSITION length matched').toBe(
    data.attributes.POSITION.value.length
  );
});
test('DracoWriter#attributes metadata', async () => {
  if (skipBrowserDracoWasmTest()) {
    return;
  }
  const data = await loadBunny();
  validateMeshCategoryData(data);
  expect(data.attributes.POSITION.value.length, 'POSITION attribute was found').toBe(104502);
  const attributes = {
    POSITION: data.attributes.POSITION.value,
    indices: data.indices?.value
  };
  let compressedMesh = await encode(attributes, DracoWriter, {
    draco: {}
  });
  expect(compressedMesh.byteLength, 'Correct length').toBe(435479);
  compressedMesh = await encode(attributes, DracoWriter, {
    draco: {
      attributesMetadata: {
        POSITION: {
          'optional-entry': 'optional-entry-value',
          'optional-entry-int': 1444,
          'optional-entry-int-negative': -333333333,
          'optional-entry-int-zero': 0,
          'optional-entry-double': 1.00012323,
          'optional-entry-int-array': new Int32Array([0, 1, 2, -3000, 31987, 77])
        }
      }
    }
  });
  expect(
    compressedMesh.byteLength,
    'Correct length - different from encoded geometry without metadata'
  ).toBe(435682);
  // Decode the mesh
  const data2 = await parse(compressedMesh, DracoLoader, {
    core: {worker: false}
  });
  validateMeshCategoryData(data2);
  validatePositionMetadata(data2);
  expect(
    Object.keys(data2.schema.fields[0]?.metadata || {}).length,
    'Schema: Attribute metadata correct number of keys'
  ).toBe(7);
  expect(data2.attributes.POSITION.value.length, 'decoded POSITION length matched').toBe(
    data.attributes.POSITION.value.length
  );
});
test('DracoWriter#attributeNameEntry preserves custom attribute names', async () => {
  if (skipBrowserDracoWasmTest()) {
    return;
  }
  const data = await loadBunny();
  const attributes = {
    POSITION: data.attributes.POSITION.value,
    featureId: data.attributes.POSITION.value,
    indices: data.indices?.value
  };
  const compressedMesh = await encode(attributes, DracoWriter, {
    draco: {
      attributeNameEntry: 'custom-attribute-name'
    }
  });
  const data2 = await parse(compressedMesh, DracoLoader, {
    core: {worker: false},
    draco: {
      attributeNameEntry: 'custom-attribute-name'
    }
  });
  validateMeshCategoryData(data2);
  expect(data2.attributes.featureId).toBeTruthy();
  expect(data2.attributes.POSITION.value.length, 'decoded POSITION length matched').toBe(
    data.attributes.POSITION.value.length
  );
});

test('DracoWriter#preserves secondary glTF attribute semantics', async () => {
  const compressedMesh = await encode(
    {
      attributes: {
        POSITION: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]),
        TEXCOORD_1: new Float32Array([0, 0, 1, 0, 0, 1])
      },
      indices: new Uint16Array([0, 1, 2])
    },
    DracoWriter,
    {core: {worker: false}, useLocalLibraries: true}
  );
  const decodedMesh = await parse(compressedMesh, DracoLoader, {
    core: {worker: false},
    useLocalLibraries: true
  });

  expect(decodedMesh.attributes.TEXCOORD_1.value).toHaveLength(6);
});

test('DracoWriter#applies independent quantization to attributes in one category', async () => {
  const compressedMesh = await encode(
    {
      attributes: {
        POSITION: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]),
        TEXCOORD_0: new Float32Array([0, 0, 1, 0, 0, 1]),
        TEXCOORD_1: new Float32Array([-1, -1, 1, -1, -1, 1])
      },
      indices: new Uint16Array([0, 1, 2])
    },
    DracoWriter,
    {
      core: {worker: false},
      useLocalLibraries: true,
      draco: {
        quantization: {TEX_COORD: 8},
        attributeQuantization: {
          TEXCOORD_1: {bits: 12, origin: [-1, -1], range: 2}
        }
      }
    }
  );
  const decodedMesh = await parse(compressedMesh, DracoLoader, {
    core: {worker: false},
    useLocalLibraries: true,
    draco: {quantizedAttributes: ['TEX_COORD']}
  });
  const loaderAttributes = Object.values(decodedMesh.loaderData.attributes);
  const texCoord0 = loaderAttributes.find(
    attribute => attribute.metadata.name?.string === 'TEXCOORD_0'
  );
  const texCoord1 = loaderAttributes.find(
    attribute => attribute.metadata.name?.string === 'TEXCOORD_1'
  );

  expect(texCoord0?.quantization_transform).toMatchObject({
    quantization_bits: 8,
    range: 1
  });
  expect(texCoord0?.quantization_transform?.min_values).toEqual(new Float32Array([0, 0]));
  expect(texCoord1?.quantization_transform).toMatchObject({
    quantization_bits: 12,
    range: 2
  });
  expect(texCoord1?.quantization_transform?.min_values).toEqual(new Float32Array([-1, -1]));
});
function validatePositionMetadata(data) {
  const POSITION = 0;
  expect(data.loaderData.attributes[POSITION].metadata).toBeTruthy();
  expect(data.loaderData.attributes[POSITION].metadata.name).toBeTruthy();
  expect(data.loaderData.attributes[POSITION].metadata['optional-entry']).toBeTruthy();
  expect(data.loaderData.attributes[POSITION].metadata['optional-entry-int']).toBeTruthy();
  expect(data.loaderData.attributes[POSITION].metadata['optional-entry-int-negative']).toBeTruthy();
  expect(data.loaderData.attributes[POSITION].metadata['optional-entry-int-zero']).toBeTruthy();
  expect(data.loaderData.attributes[POSITION].metadata['optional-entry-double']).toBeTruthy();
  expect(data.loaderData.attributes[POSITION].metadata['optional-entry-int-array']).toBeTruthy();
  expect(data.loaderData.attributes[POSITION].metadata.name.string).toBe('POSITION');
  expect(data.loaderData.attributes[POSITION].metadata['optional-entry'].string).toBe(
    'optional-entry-value'
  );
  expect(data.loaderData.attributes[POSITION].metadata['optional-entry-int'].int).toBe(1444);
  expect(data.loaderData.attributes[POSITION].metadata['optional-entry-int-negative'].int).toBe(
    -333333333
  );
  expect(data.loaderData.attributes[POSITION].metadata['optional-entry-int-zero'].int).toBe(0);
  expect(data.loaderData.attributes[POSITION].metadata['optional-entry-double'].double).toBe(
    1.00012323
  );
  expect(
    data.loaderData.attributes[POSITION].metadata['optional-entry-int-array'].intArray
  ).toEqual([0, 1, 2, -3000, 31987, 77]);
}
/**
 * Skips Draco writer tests that depend on direct WASM module initialization in browser runs.
 */
function skipBrowserDracoWasmTest() {
  if (isBrowser) {
    console.log('Skipping Draco WASM writer test in browser');
    return true;
  }
  return false;
}
