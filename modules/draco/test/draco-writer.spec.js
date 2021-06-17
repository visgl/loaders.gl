import test from 'tape-promise/tape';
import {validateWriter, validateMeshCategoryData} from 'test/common/conformance';

import {DracoWriter, DracoLoader} from '@loaders.gl/draco';
import {encode, fetchFile, parse} from '@loaders.gl/core';
import {_getMeshSize} from '@loaders.gl/loader-utils';
import draco3d from 'draco3d';

const TEST_CASES = [
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
  return await parse(arrayBuffer, DracoLoader);
}

test('DracoWriter#loader conformance', (t) => {
  validateWriter(t, DracoWriter, 'DracoWriter');
  t.end();
});

test('DracoWriter#encode(bunny.drc)', async (t) => {
  const data = await loadBunny();
  t.equal(data.attributes.POSITION.value.length, 104502, 'POSITION attribute was found');

  const MESH = {
    attributes: {
      POSITION: data.attributes.POSITION.value
    },
    indices: data.indices.value
  };
  const POINTCLOUD = {
    attributes: {
      POSITION: data.attributes.POSITION.value
    }
  };

  for (const tc of TEST_CASES) {
    const mesh = tc.options.draco.pointcloud ? POINTCLOUD : MESH;
    const meshSize = _getMeshSize(mesh.attributes);

    const compressedMesh = await encode(mesh, DracoWriter, tc.options);
    const ratio = meshSize / compressedMesh.byteLength;
    t.comment(`${tc.title} ${compressedMesh.byteLength} bytes, ratio ${ratio.toFixed(1)}`);

    if (!tc.options.pointcloud) {
      // Decode the mesh
      const data2 = await parse(compressedMesh, DracoLoader);
      validateMeshCategoryData(t, data2);

      // t.comment(JSON.stringify(data));
      t.equal(
        data2.attributes.POSITION.value.length,
        data.attributes.POSITION.value.length,
        `${tc.title} decoded POSITION length matched`
      );
    }
  }

  t.end();
});

test('DracoWriter#encode via draco3d npm package (bunny.drc)', async (t) => {
  const data = await loadBunny();
  t.equal(data.attributes.POSITION.value.length, 104502, 'POSITION attribute was found');

  const MESH = {
    attributes: {
      POSITION: data.attributes.POSITION.value
    },
    indices: data.indices.value
  };
  const POINTCLOUD = {
    attributes: {
      POSITION: data.attributes.POSITION.value
    }
  };

  for (const tc of TEST_CASES) {
    const mesh = tc.options.draco.pointcloud ? POINTCLOUD : MESH;
    const meshSize = _getMeshSize(mesh.attributes);

    const compressedMesh = await encode(mesh, DracoWriter, {
      ...tc.options,
      modules: {
        draco3d
      }
    });
    const ratio = meshSize / compressedMesh.byteLength;
    t.comment(`${tc.title} ${compressedMesh.byteLength} bytes, ratio ${ratio.toFixed(1)}`);

    if (!tc.options.pointcloud) {
      // Decode the mesh
      const data2 = await parse(compressedMesh, DracoLoader, {
        modules: {
          draco3d
        }
      });
      validateMeshCategoryData(t, data2);

      // t.comment(JSON.stringify(data));
      t.equal(
        data2.attributes.POSITION.value.length,
        data.attributes.POSITION.value.length,
        `${tc.title} decoded POSITION length matched`
      );
    }
  }

  t.end();
});

test('DracoWriter#encode(bunny.drc)', async (t) => {
  const data = await loadBunny();
  validateMeshCategoryData(t, data);
  t.equal(data.attributes.POSITION.value.length, 104502, 'POSITION attribute was found');

  const meshAttributes = {
    POSITION: data.attributes.POSITION.value,
    indices: data.indices.value
  };
  const pointCloudAttributes = {
    POSITION: data.attributes.POSITION.value
  };

  for (const tc of TEST_CASES) {
    const attributes = tc.options.draco.pointcloud ? pointCloudAttributes : meshAttributes;
    const meshSize = _getMeshSize(attributes);

    const compressedMesh = await encode(attributes, DracoWriter, tc.options);

    const ratio = meshSize / compressedMesh.byteLength;
    t.comment(`${tc.title} ${compressedMesh.byteLength} bytes, ratio ${ratio.toFixed(1)}`);

    if (!tc.options.pointcloud) {
      // Decode the mesh
      const data2 = await parse(compressedMesh, DracoLoader);
      validateMeshCategoryData(t, data2);

      // t.comment(JSON.stringify(data));
      t.equal(
        data2.attributes.POSITION.value.length,
        data.attributes.POSITION.value.length,
        `${tc.title} decoded POSITION length matched`
      );
    }
  }

  t.end();
});

test('DracoWriter#should encode texCoord/texCoords attribute as TEX_COORD attribute type', async (t) => {
  const data = await loadBunny();
  validateMeshCategoryData(t, data);
  t.equal(data.attributes.POSITION.value.length, 104502, 'POSITION attribute was found');

  const vertexCount = data.attributes.POSITION.value.length / 3;
  const texCoord = new Float32Array(vertexCount * 2);
  texCoord.fill(1);

  const meshAttributes = {
    POSITION: data.attributes.POSITION.value,
    texCoord,
    indices: data.indices.value
  };

  const compressedMesh = await encode(meshAttributes, DracoWriter);
  const data2 = await parse(compressedMesh, DracoLoader);

  t.equal(
    data2.attributes.TEXCOORD_0.value.length,
    texCoord.length,
    `Decoded texCoord length matched`
  );

  const meshAttributes2 = {
    POSITION: data.attributes.POSITION.value,
    texCoords: texCoord,
    indices: data.indices.value
  };

  const compressedMesh2 = await encode(meshAttributes2, DracoWriter);
  const data3 = await parse(compressedMesh2, DracoLoader);

  t.equal(
    data3.attributes.TEXCOORD_0.value.length,
    texCoord.length,
    `Decoded texCoords length matched`
  );

  t.end();
});

test('DracoWriter#geometry metadata', async (t) => {
  const data = await loadBunny();
  validateMeshCategoryData(t, data);
  t.equal(data.attributes.POSITION.value.length, 104502, 'POSITION attribute was found');

  const attributes = {
    POSITION: data.attributes.POSITION.value,
    indices: data.indices.value
  };

  let compressedMesh = await encode(attributes, DracoWriter, {
    draco: {}
  });
  t.equal(compressedMesh.byteLength, 435479, 'Correct length');

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
  t.equal(
    compressedMesh.byteLength,
    435614,
    'Correct length - different from encoded geometry without metadata'
  );

  // Decode the mesh
  const data2 = await parse(compressedMesh, DracoLoader, {
    worker: false
  });
  validateMeshCategoryData(t, data2);

  t.ok(data2.loaderData.metadata);
  t.ok(data2.loaderData.metadata.author);
  t.equal(data2.loaderData.metadata.author.string, 'loaders.gl');

  t.ok(data2.loaderData.metadata['optional-entry-int']);
  t.ok(data2.loaderData.metadata['optional-entry-int-negative']);
  t.ok(data2.loaderData.metadata['optional-entry-int-zero']);
  t.ok(data2.loaderData.metadata['optional-entry-double']);

  t.equal(data2.loaderData.metadata['optional-entry-int'].int, 1444);
  t.equal(data2.loaderData.metadata['optional-entry-int-negative'].int, -333333333);
  t.equal(data2.loaderData.metadata['optional-entry-int-zero'].int, 0);
  t.equal(data2.loaderData.metadata['optional-entry-double'].double, 1.00012323);

  t.equal(
    data2.attributes.POSITION.value.length,
    data.attributes.POSITION.value.length,
    `decoded POSITION length matched`
  );
  t.end();
});

test('DracoWriter#attributes metadata', async (t) => {
  const data = await loadBunny();
  validateMeshCategoryData(t, data);
  t.equal(data.attributes.POSITION.value.length, 104502, 'POSITION attribute was found');

  const attributes = {
    POSITION: data.attributes.POSITION.value,
    indices: data.indices.value
  };

  let compressedMesh = await encode(attributes, DracoWriter, {
    draco: {}
  });
  t.equal(compressedMesh.byteLength, 435479, 'Correct length');

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
  t.equal(
    compressedMesh.byteLength,
    435682,
    'Correct length - different from encoded geometry without metadata'
  );

  // Decode the mesh
  const data2 = await parse(compressedMesh, DracoLoader, {
    worker: false
  });
  validateMeshCategoryData(t, data2);
  validatePositionMetadata(t, data2);

  t.equal(
    data2.attributes.POSITION.value.length,
    data.attributes.POSITION.value.length,
    `decoded POSITION length matched`
  );
  t.end();
});

test('DracoWriter#metadata - should be able to define optional "name entry" for custom attribute', async (t) => {
  const data = await loadBunny();
  const attributes = {
    POSITION: data.attributes.POSITION.value,
    featureId: data.attributes.POSITION.value,
    indices: data.indices.value
  };
  const compressedMesh = await encode(attributes, DracoWriter, {
    draco: {
      attributesMetadata: {
        featureId: {
          'custom-attribute-name': 'featureId'
        }
      }
    }
  });
  const data2 = await parse(compressedMesh, DracoLoader, {
    worker: false,
    draco: {
      attributeNameEntry: 'custom-attribute-name'
    }
  });
  validateMeshCategoryData(t, data2);
  t.ok(data2.attributes.featureId);
  t.equal(
    data2.attributes.POSITION.value.length,
    data.attributes.POSITION.value.length,
    `decoded POSITION length matched`
  );
  t.end();
});

function validatePositionMetadata(t, data) {
  const POSITION = 0;
  t.ok(data.loaderData.attributes[POSITION].metadata);
  t.ok(data.loaderData.attributes[POSITION].metadata.name);
  t.ok(data.loaderData.attributes[POSITION].metadata['optional-entry']);
  t.ok(data.loaderData.attributes[POSITION].metadata['optional-entry-int']);
  t.ok(data.loaderData.attributes[POSITION].metadata['optional-entry-int-negative']);
  t.ok(data.loaderData.attributes[POSITION].metadata['optional-entry-int-zero']);
  t.ok(data.loaderData.attributes[POSITION].metadata['optional-entry-double']);
  t.ok(data.loaderData.attributes[POSITION].metadata['optional-entry-int-array']);

  t.equal(data.loaderData.attributes[POSITION].metadata.name.string, 'POSITION');
  t.equal(
    data.loaderData.attributes[POSITION].metadata['optional-entry'].string,
    'optional-entry-value'
  );
  t.equal(data.loaderData.attributes[POSITION].metadata['optional-entry-int'].int, 1444);
  t.equal(
    data.loaderData.attributes[POSITION].metadata['optional-entry-int-negative'].int,
    -333333333
  );
  t.equal(data.loaderData.attributes[POSITION].metadata['optional-entry-int-zero'].int, 0);
  t.equal(
    data.loaderData.attributes[POSITION].metadata['optional-entry-double'].double,
    1.00012323
  );
  t.deepEqual(
    data.loaderData.attributes[POSITION].metadata['optional-entry-int-array'].intArray,
    [0, 1, 2, -3000, 31987, 77]
  );
}
