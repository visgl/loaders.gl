// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {validateWriter, validateMeshCategoryData} from 'test/common/conformance';

import {LASCOPCLoader, LASLoader, LASWriter, type LASExtraBytesWriter} from '@loaders.gl/las';
import {encode, parse} from '@loaders.gl/core';
import {decodeLAZChunk, decodeLAZChunkTable} from '@loaders.gl/loader-utils';
import {convertMeshToTable, deduceMeshSchema} from '@loaders.gl/schema-utils';

const attributes = {
  POSITION: {value: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 1]), size: 3},
  intensity: {value: new Uint16Array([10, 20, 30]), size: 1},
  classification: {value: new Uint8Array([1, 2, 3]), size: 1}
};

const mesh = {
  attributes,
  topology: 'point-list' as const,
  mode: 0,
  schema: deduceMeshSchema(attributes, {topology: 'point-list', mode: '0'})
};

const exportedExtraBytesTypeCheck: LASExtraBytesWriter = {attribute: 'value'};
void exportedExtraBytesTypeCheck;

test('LASWriter#writer conformance', t => {
  validateWriter(t, LASWriter, 'LASWriter');
  t.end();
});

test('LASWriter#encode plain and Arrow mesh data', async t => {
  const arrayBuffer = await encode(mesh, LASWriter);
  const data = await parse(arrayBuffer, LASLoader, {core: {worker: false}});

  validateMeshCategoryData(t, data);
  t.equal(data.mode, 0, 'mode is POINTS (0)');
  t.equal(data.attributes.POSITION.value.length, 9, 'POSITION attribute roundtripped');

  const arrowTable = convertMeshToTable(mesh, 'arrow-table');
  const arrowArrayBuffer = await encode(arrowTable, LASWriter);
  const arrowData = await parse(arrowArrayBuffer, LASLoader, {core: {worker: false}});

  validateMeshCategoryData(t, arrowData);
  t.equal(arrowData.attributes.POSITION.value.length, 9, 'Arrow POSITION attribute roundtripped');
  t.end();
});

test('LASWriter#encode LAS 1.4 point format 7', async t => {
  const arrayBuffer = await encode(mesh, LASWriter, {
    las: {version: '1.4', pointDataRecordFormat: 7}
  });
  const data = await parse(arrayBuffer, LASLoader, {
    core: {worker: false}
  });
  const wasmData = await parse(arrayBuffer.slice(0), LASCOPCLoader, {
    core: {worker: false}
  });

  t.equal(data.loaderData.versionAsString, '1.4', 'writes LAS 1.4 header');
  t.equal(data.loaderData.pointsFormatId, 7, 'writes point format 7');
  t.equal(data.header.vertexCount, attributes.POSITION.value.length / 3, 'round trips point count');
  t.ok(data.attributes.COLOR_0, 'round trips color attribute');
  t.deepEqual(
    Array.from(data.attributes.POSITION.value),
    Array.from(wasmData.attributes.POSITION.value),
    'TypeScript parser matches WASM parser for written positions'
  );
  t.deepEqual(
    Array.from(data.attributes.intensity.value),
    Array.from(wasmData.attributes.intensity.value),
    'TypeScript parser matches WASM parser for written intensities'
  );
  t.deepEqual(
    Array.from(data.attributes.classification.value),
    Array.from(wasmData.attributes.classification.value),
    'TypeScript parser matches WASM parser for written classifications'
  );
  t.end();
});

test('LASWriter#encodes fixed-chunk LAZ point formats 6-8', async t => {
  for (const pointDataRecordFormat of [6, 7, 8] as const) {
    const arrayBuffer = await encode(mesh, LASWriter, {
      las: {format: 'laz', pointDataRecordFormat, chunkSize: 2}
    });
    const dataView = new DataView(arrayBuffer);
    const pointDataOffset = dataView.getUint32(96, true);
    const chunkTableOffset = readUint64(dataView, pointDataOffset);
    const chunkCount = dataView.getUint32(chunkTableOffset + 4, true);
    const chunks = decodeLAZChunkTable(new Uint8Array(arrayBuffer, chunkTableOffset + 8), {
      chunkCount,
      pointCount: 3,
      chunkSize: 2,
      variable: false
    });
    const data = await parse(arrayBuffer, LASLoader, {core: {worker: false}});
    const wasmData = await parse(arrayBuffer.slice(0), LASCOPCLoader, {
      core: {worker: false}
    });

    t.equal(
      dataView.getUint8(104),
      0x80 | pointDataRecordFormat,
      `PDRF ${pointDataRecordFormat} sets the compressed format flag`
    );
    t.equal(dataView.getUint32(100, true), 1, `PDRF ${pointDataRecordFormat} writes one VLR`);
    t.equal(chunkCount, 2, `PDRF ${pointDataRecordFormat} writes two chunks`);
    t.deepEqual(
      chunks.map(chunk => chunk.pointCount),
      [2, 1],
      `PDRF ${pointDataRecordFormat} fixed chunk counts roundtrip`
    );
    t.equal(
      chunks.reduce((byteLength, chunk) => byteLength + chunk.byteLength, 0),
      chunkTableOffset - pointDataOffset - 8,
      `PDRF ${pointDataRecordFormat} chunk sizes reach the table`
    );
    t.deepEqual(
      Array.from(data.attributes.POSITION.value),
      Array.from(wasmData.attributes.POSITION.value),
      `PDRF ${pointDataRecordFormat} TypeScript positions match WASM`
    );
    t.deepEqual(
      Array.from(data.attributes.intensity.value),
      Array.from(wasmData.attributes.intensity.value),
      `PDRF ${pointDataRecordFormat} TypeScript intensities match WASM`
    );
    t.deepEqual(
      Array.from(data.attributes.classification.value),
      Array.from(wasmData.attributes.classification.value),
      `PDRF ${pointDataRecordFormat} TypeScript classifications match WASM`
    );
  }
  t.end();
});

test('LASWriter#validates compressed output options', t => {
  t.throws(
    () =>
      LASWriter.encodeSync?.(mesh, {
        las: {format: 'laz', version: '1.2', pointDataRecordFormat: 6}
      }),
    /LAZ output requires LAS 1.4/,
    'LAZ writer rejects legacy LAS versions'
  );
  t.throws(
    () =>
      LASWriter.encodeSync?.(mesh, {
        las: {format: 'laz', version: '1.4', pointDataRecordFormat: 3}
      }),
    /only supports point data record formats 6-8/,
    'LAZ writer rejects legacy point formats'
  );
  t.throws(
    () => LASWriter.encodeSync?.(mesh, {las: {format: 'laz', chunkSize: 0}}),
    /invalid LAZ chunk size/,
    'LAZ writer rejects empty chunks'
  );
  t.end();
});

test('LASWriter#encodes variable LAZ chunks', async t => {
  const arrayBuffer = await encode(mesh, LASWriter, {
    las: {
      format: 'laz',
      pointDataRecordFormat: 7,
      chunkSize: 2,
      variableChunkTable: true
    }
  });
  const dataView = new DataView(arrayBuffer);
  const pointDataOffset = dataView.getUint32(96, true);
  const chunkTableOffset = readUint64(dataView, pointDataOffset);
  const chunkCount = dataView.getUint32(chunkTableOffset + 4, true);
  const chunks = decodeLAZChunkTable(new Uint8Array(arrayBuffer, chunkTableOffset + 8), {
    chunkCount,
    pointCount: 3,
    chunkSize: 0xffffffff,
    variable: true
  });
  const data = await parse(arrayBuffer, LASLoader, {core: {worker: false}});
  const wasmData = await parse(arrayBuffer.slice(0), LASCOPCLoader, {
    core: {worker: false}
  });

  t.equal(dataView.getUint32(100, true), 1, 'writes one LASzip VLR');
  t.deepEqual(
    chunks.map(chunk => chunk.pointCount),
    [2, 1],
    'variable chunk table preserves point counts'
  );
  t.equal(data.attributes.POSITION.value.length, 9, 'variable LAZ parses through LASLoader');
  t.deepEqual(
    Array.from(data.attributes.POSITION.value),
    Array.from(wasmData.attributes.POSITION.value),
    'variable LAZ positions match the independent WASM reader'
  );
  t.deepEqual(
    Array.from(data.attributes.intensity.value),
    Array.from(wasmData.attributes.intensity.value),
    'variable LAZ intensities match the independent WASM reader'
  );
  t.end();
});

test('LASWriter#preserves modern LAS point fields', t => {
  const modernAttributes = {
    POSITION: {value: new Float64Array([1, 2, 3]), size: 3},
    gpsTime: {value: new Float64Array([123.5]), size: 1},
    scanAngle: {value: new Int16Array([-12]), size: 1},
    userData: {value: new Uint8Array([7]), size: 1},
    pointSourceId: {value: new Uint16Array([99]), size: 1},
    returnNumber: {value: new Uint8Array([2]), size: 1},
    numberOfReturns: {value: new Uint8Array([3]), size: 1},
    scannerChannel: {value: new Uint8Array([2]), size: 1},
    scanDirectionFlag: {value: new Uint8Array([1]), size: 1},
    edgeOfFlightLine: {value: new Uint8Array([1]), size: 1},
    synthetic: {value: new Uint8Array([1]), size: 1},
    keyPoint: {value: new Uint8Array([1]), size: 1},
    withheld: {value: new Uint8Array([1]), size: 1},
    overlap: {value: new Uint8Array([1]), size: 1}
  };
  const modernMesh = {
    attributes: modernAttributes,
    topology: 'point-list' as const,
    mode: 0,
    schema: deduceMeshSchema(modernAttributes, {topology: 'point-list', mode: '0'})
  };
  const arrayBuffer = LASWriter.encodeSync?.(modernMesh, {
    las: {version: '1.4', pointDataRecordFormat: 7}
  });
  if (!arrayBuffer) {
    throw new Error('LASWriter did not return an ArrayBuffer');
  }
  const dataView = new DataView(arrayBuffer);
  const pointOffset = 375;

  t.equal(dataView.getUint8(pointOffset + 14), 0x3f, 'writes return number, count, and flags');
  t.equal(dataView.getUint8(pointOffset + 15), 0xe0, 'writes scanner and flight-line flags');
  t.equal(dataView.getUint8(pointOffset + 17), 7, 'writes user data');
  t.equal(dataView.getInt16(pointOffset + 18, true), -12, 'writes scan angle');
  t.equal(dataView.getUint16(pointOffset + 20, true), 99, 'writes point source id');
  t.equal(dataView.getFloat64(pointOffset + 22, true), 123.5, 'writes GPS time');

  const lazArrayBuffer = LASWriter.encodeSync?.(modernMesh, {
    las: {format: 'laz', pointDataRecordFormat: 7, chunkSize: 1}
  });
  if (!lazArrayBuffer) {
    throw new Error('LASWriter did not return a LAZ ArrayBuffer');
  }
  const lazDataView = new DataView(lazArrayBuffer);
  const lazPointDataOffset = lazDataView.getUint32(96, true);
  const lazChunkTableOffset = readUint64(lazDataView, lazPointDataOffset);
  const lazChunk = decodeLAZChunk(
    lazArrayBuffer.slice(lazPointDataOffset + 8, lazChunkTableOffset),
    {
      pointDataRecordFormat: 7,
      pointDataRecordLength: 36,
      pointCount: 1,
      point14ItemVersion: 3,
      rgb14ItemVersion: 3,
      byte14ItemVersion: 3
    }
  );
  const lazPointView = new DataView(lazChunk.buffer);
  t.equal(lazPointView.getUint8(14), 0x3f, 'LAZ preserves return number, count, and flags');
  t.equal(lazPointView.getUint8(15), 0xe0, 'LAZ preserves scanner and flight-line flags');
  t.equal(lazPointView.getUint8(17), 7, 'LAZ preserves user data');
  t.equal(lazPointView.getInt16(18, true), -12, 'LAZ preserves scan angle');
  t.equal(lazPointView.getUint16(20, true), 99, 'LAZ preserves point source id');
  t.equal(lazPointView.getFloat64(22, true), 123.5, 'LAZ preserves GPS time');
  t.end();
});

test('LASWriter#preserves NIR in PDRF 8 LAZ', t => {
  const nirAttributes = {
    POSITION: {value: new Float64Array([1, 2, 3]), size: 3},
    COLOR_0: {value: new Uint8Array([10, 20, 30]), size: 3},
    nir: {value: new Uint16Array([1234]), size: 1}
  };
  const nirMesh = {
    attributes: nirAttributes,
    topology: 'point-list' as const,
    mode: 0,
    schema: deduceMeshSchema(nirAttributes, {topology: 'point-list', mode: '0'})
  };
  const arrayBuffer = LASWriter.encodeSync?.(nirMesh, {
    las: {format: 'laz', pointDataRecordFormat: 8, chunkSize: 1}
  });
  if (!arrayBuffer) {
    throw new Error('LASWriter did not return a LAZ ArrayBuffer');
  }
  const dataView = new DataView(arrayBuffer);
  const pointDataOffset = dataView.getUint32(96, true);
  const chunkTableOffset = readUint64(dataView, pointDataOffset);
  const chunk = decodeLAZChunk(arrayBuffer.slice(pointDataOffset + 8, chunkTableOffset), {
    pointDataRecordFormat: 8,
    pointDataRecordLength: 38,
    pointCount: 1,
    point14ItemVersion: 3,
    rgb14ItemVersion: 3,
    byte14ItemVersion: 3
  });

  t.equal(new DataView(chunk.buffer).getUint16(36, true), 1234, 'LAZ preserves NIR');
  t.end();
});

test('LASWriter#writes Extra Bytes in LAS and LAZ', t => {
  const extraAttributes = {
    POSITION: {value: new Float64Array([1, 2, 3]), size: 3},
    extraIntensity: {value: new Uint16Array([1234]), size: 1}
  };
  const extraMesh = {
    attributes: extraAttributes,
    topology: 'point-list' as const,
    mode: 0,
    schema: deduceMeshSchema(extraAttributes, {topology: 'point-list', mode: '0'})
  };
  const options = {
    las: {
      format: 'laz' as const,
      pointDataRecordFormat: 7 as const,
      chunkSize: 1,
      extraBytes: [
        {attribute: 'extraIntensity', name: 'extra intensity', description: 'test field'}
      ]
    }
  };
  const lazArrayBuffer = LASWriter.encodeSync?.(extraMesh, options);
  if (!lazArrayBuffer) {
    throw new Error('LASWriter did not return a LAZ ArrayBuffer');
  }
  const lazDataView = new DataView(lazArrayBuffer);
  const lazPointDataOffset = lazDataView.getUint32(96, true);
  const lazChunkTableOffset = readUint64(lazDataView, lazPointDataOffset);
  const lazChunk = decodeLAZChunk(
    lazArrayBuffer.slice(lazPointDataOffset + 8, lazChunkTableOffset),
    {
      pointDataRecordFormat: 7,
      pointDataRecordLength: 38,
      pointCount: 1,
      point14ItemVersion: 3,
      rgb14ItemVersion: 3,
      byte14ItemVersion: 3
    }
  );
  const lazPointView = new DataView(lazChunk.buffer);

  const lasArrayBuffer = LASWriter.encodeSync?.(extraMesh, {
    las: {pointDataRecordFormat: 7, extraBytes: options.las.extraBytes}
  });
  if (!lasArrayBuffer) {
    throw new Error('LASWriter did not return a LAS ArrayBuffer');
  }
  const lasDataView = new DataView(lasArrayBuffer);
  const lasPointDataOffset = lasDataView.getUint32(96, true);

  t.equal(lazDataView.getUint32(100, true), 2, 'writes Extra Bytes and LASzip VLRs');
  t.equal(lazDataView.getUint16(105, true), 38, 'includes Extra Bytes in the LAZ record length');
  t.equal(lazDataView.getUint16(375 + 20, true), 192, 'writes one Extra Bytes descriptor');
  t.equal(lazDataView.getUint8(375 + 54 + 2), 3, 'declares the Uint16 Extra Bytes type');
  t.equal(lazPointView.getUint16(36, true), 1234, 'LAZ preserves the Extra Bytes value');
  t.equal(lasDataView.getUint32(100, true), 1, 'writes an Extra Bytes VLR for LAS');
  t.equal(lasDataView.getUint16(105, true), 38, 'includes Extra Bytes in the LAS record length');
  t.equal(lasDataView.getUint16(lasPointDataOffset + 36, true), 1234, 'LAS preserves Extra Bytes');
  t.end();
});

test('LASWriter#preserves LAZ fields through encodeInBatches', async t => {
  const createBatch = (positions: number[], intensities: number[], extraValues: number[]) => {
    const batchAttributes = {
      POSITION: {value: new Float64Array(positions), size: 3},
      intensity: {value: new Uint16Array(intensities), size: 1},
      extraIntensity: {value: new Uint16Array(extraValues), size: 1}
    };
    return {
      attributes: batchAttributes,
      topology: 'point-list' as const,
      mode: 0,
      schema: deduceMeshSchema(batchAttributes, {topology: 'point-list', mode: '0'})
    };
  };
  const batches = [
    createBatch([0, 0, 0, 1, 0, 0], [10, 20], [100, 200]),
    createBatch([0, 1, 0, 1, 1, 0], [30, 40], [300, 400])
  ];
  const encodedBatches = LASWriter.encodeInBatches?.(
    (async function* () {
      yield* batches;
    })(),
    {
      las: {
        format: 'laz',
        pointDataRecordFormat: 7,
        chunkSize: 2,
        extraBytes: [{attribute: 'extraIntensity'}]
      }
    }
  );
  if (!encodedBatches) {
    throw new Error('LASWriter does not support batch encoding');
  }
  let arrayBuffer: ArrayBuffer | undefined;
  for await (const encodedBatch of encodedBatches) {
    arrayBuffer = encodedBatch;
  }
  if (!arrayBuffer) {
    throw new Error('LASWriter did not emit a batch output');
  }
  const data = await parse(arrayBuffer, LASLoader, {core: {worker: false}});
  const dataView = new DataView(arrayBuffer);
  const pointDataOffset = dataView.getUint32(96, true);
  const chunkTableOffset = readUint64(dataView, pointDataOffset);
  const chunk = decodeLAZChunk(arrayBuffer.slice(pointDataOffset + 8, chunkTableOffset), {
    pointDataRecordFormat: 7,
    pointDataRecordLength: 38,
    pointCount: 2,
    point14ItemVersion: 3,
    rgb14ItemVersion: 3,
    byte14ItemVersion: 3
  });

  t.deepEqual(Array.from(data.attributes.intensity.value), [10, 20, 30, 40], 'merges batches');
  t.equal(new DataView(chunk.buffer).getUint16(36, true), 100, 'preserves first batch Extra Bytes');
  t.end();
});

test('LASWriter#validates batched attribute schemas', async t => {
  const firstBatch = {
    attributes: {
      POSITION: {value: new Float64Array([0, 0, 0]), size: 3},
      intensity: {value: new Uint16Array([10]), size: 1}
    },
    topology: 'point-list' as const,
    mode: 0,
    schema: deduceMeshSchema(
      {
        POSITION: {value: new Float64Array([0, 0, 0]), size: 3},
        intensity: {value: new Uint16Array([10]), size: 1}
      },
      {topology: 'point-list', mode: '0'}
    )
  };
  const secondBatch = {
    ...firstBatch,
    attributes: {
      POSITION: {value: new Float64Array([1, 0, 0]), size: 3}
    }
  };
  const encodedBatches = LASWriter.encodeInBatches?.(
    (async function* () {
      yield firstBatch;
      yield secondBatch;
    })(),
    {}
  );
  if (!encodedBatches) {
    throw new Error('LASWriter does not support batch encoding');
  }
  const consumeBatches = async () => {
    for await (const ignored of encodedBatches) {
      void ignored;
    }
  };
  await t.rejects(
    consumeBatches(),
    /consistent attribute names/,
    'rejects batches with missing attributes'
  );
  t.end();
});

test('LASWriter#writes vector Extra Bytes fields', t => {
  const vectorAttributes = {
    POSITION: {value: new Float64Array([1, 2, 3]), size: 3},
    extraVector: {value: new Float32Array([1.5, 2.5, 3.5]), size: 3}
  };
  const vectorMesh = {
    attributes: vectorAttributes,
    topology: 'point-list' as const,
    mode: 0,
    schema: deduceMeshSchema(vectorAttributes, {topology: 'point-list', mode: '0'})
  };
  const arrayBuffer = LASWriter.encodeSync?.(vectorMesh, {
    las: {
      format: 'laz',
      pointDataRecordFormat: 7,
      chunkSize: 1,
      extraBytes: [{attribute: 'extraVector', name: 'vector'}]
    }
  });
  if (!arrayBuffer) {
    throw new Error('LASWriter did not return a LAZ ArrayBuffer');
  }
  const dataView = new DataView(arrayBuffer);
  const pointDataOffset = dataView.getUint32(96, true);
  const chunkTableOffset = readUint64(dataView, pointDataOffset);
  const chunk = decodeLAZChunk(arrayBuffer.slice(pointDataOffset + 8, chunkTableOffset), {
    pointDataRecordFormat: 7,
    pointDataRecordLength: 48,
    pointCount: 1,
    point14ItemVersion: 3,
    rgb14ItemVersion: 3,
    byte14ItemVersion: 3
  });
  const pointView = new DataView(chunk.buffer);

  t.equal(dataView.getUint16(105, true), 48, 'includes vector Extra Bytes width');
  t.equal(dataView.getUint8(375 + 54 + 2), 19, 'declares a three-component float type');
  t.equal(pointView.getFloat32(36, true), 1.5, 'preserves vector component one');
  t.equal(pointView.getFloat32(40, true), 2.5, 'preserves vector component two');
  t.equal(pointView.getFloat32(44, true), 3.5, 'preserves vector component three');
  t.end();
});

test('LASWriter#writes multiple Extra Bytes fields contiguously', t => {
  const extraAttributes = {
    POSITION: {value: new Float64Array([1, 2, 3]), size: 3},
    firstExtra: {value: new Uint8Array([11]), size: 1},
    secondExtra: {value: new Uint16Array([2233]), size: 1}
  };
  const extraMesh = {
    attributes: extraAttributes,
    topology: 'point-list' as const,
    mode: 0,
    schema: deduceMeshSchema(extraAttributes, {topology: 'point-list', mode: '0'})
  };
  const arrayBuffer = LASWriter.encodeSync?.(extraMesh, {
    las: {
      format: 'laz',
      pointDataRecordFormat: 7,
      chunkSize: 1,
      extraBytes: [{attribute: 'firstExtra'}, {attribute: 'secondExtra'}]
    }
  });
  if (!arrayBuffer) {
    throw new Error('LASWriter did not return a LAZ ArrayBuffer');
  }
  const dataView = new DataView(arrayBuffer);
  const pointDataOffset = dataView.getUint32(96, true);
  const chunkTableOffset = readUint64(dataView, pointDataOffset);
  const chunk = decodeLAZChunk(arrayBuffer.slice(pointDataOffset + 8, chunkTableOffset), {
    pointDataRecordFormat: 7,
    pointDataRecordLength: 39,
    pointCount: 1,
    point14ItemVersion: 3,
    rgb14ItemVersion: 3,
    byte14ItemVersion: 3
  });
  const pointView = new DataView(chunk.buffer);

  t.equal(dataView.getUint16(105, true), 39, 'includes both Extra Bytes widths');
  t.equal(pointView.getUint8(36), 11, 'writes the first Extra Bytes field at the base offset');
  t.equal(pointView.getUint16(37, true), 2233, 'writes the second Extra Bytes field contiguously');
  t.end();
});

test('LASWriter#validates Extra Bytes declarations', t => {
  const scalarAttributes = {
    POSITION: {value: new Float64Array([1, 2, 3]), size: 3},
    value: {value: new Uint8Array([1]), size: 1}
  };
  const scalarMesh = {
    attributes: scalarAttributes,
    topology: 'point-list' as const,
    mode: 0,
    schema: deduceMeshSchema(scalarAttributes, {topology: 'point-list', mode: '0'})
  };

  t.throws(
    () =>
      LASWriter.encodeSync?.(scalarMesh, {
        las: {extraBytes: [{attribute: 'value'}, {attribute: 'value'}]}
      }),
    /duplicate Extra Bytes attribute value/,
    'rejects duplicate Extra Bytes attributes'
  );

  const largeAttributes: Record<string, {value: Uint8Array | Float64Array; size: number}> = {
    POSITION: scalarAttributes.POSITION
  };
  for (let index = 0; index < 65536; index++) {
    largeAttributes[`value-${index}`] = {value: new Uint8Array([1]), size: 1};
  }
  const largeMesh = {
    attributes: largeAttributes,
    topology: 'point-list' as const,
    mode: 0,
    schema: deduceMeshSchema(largeAttributes, {topology: 'point-list', mode: '0'})
  };
  const extraBytes = Array.from({length: 65536}, (_, index) => ({
    attribute: `value-${index}`,
    name: `field-${index}`
  }));
  t.throws(
    () => LASWriter.encodeSync?.(largeMesh, {las: {extraBytes}}),
    /point data record length .* exceeds the LAS limit/,
    'rejects an Extra Bytes record that exceeds the LAS limit'
  );

  const vlrAttributes: Record<string, {value: Uint8Array | Float64Array; size: number}> = {
    POSITION: scalarAttributes.POSITION
  };
  for (let index = 0; index < 342; index++) {
    vlrAttributes[`value-${index}`] = {value: new Uint8Array([1]), size: 1};
  }
  const vlrMesh = {
    attributes: vlrAttributes,
    topology: 'point-list' as const,
    mode: 0,
    schema: deduceMeshSchema(vlrAttributes, {topology: 'point-list', mode: '0'})
  };
  t.throws(
    () =>
      LASWriter.encodeSync?.(vlrMesh, {
        las: {extraBytes: Array.from({length: 342}, (_, index) => ({attribute: `value-${index}`}))}
      }),
    /Extra Bytes VLR payload .* exceeds the LAS limit/,
    'rejects an Extra Bytes VLR that exceeds its length field'
  );
  t.end();
});

test('LASWriter#validates point attribute shapes', t => {
  const invalidPositionMesh = {
    ...mesh,
    attributes: {
      ...mesh.attributes,
      POSITION: {value: new Float32Array([0, 0]), size: 2}
    }
  };
  t.throws(
    () => LASWriter.encodeSync?.(invalidPositionMesh),
    /POSITION attribute must have size 3/,
    'rejects non-three-component positions'
  );

  const shortExtraMesh = {
    ...mesh,
    attributes: {
      ...mesh.attributes,
      shortExtra: {value: new Uint8Array([1]), size: 1}
    }
  };
  t.throws(
    () =>
      LASWriter.encodeSync?.(shortExtraMesh, {
        las: {extraBytes: [{attribute: 'shortExtra'}]}
      }),
    /Extra Bytes attribute shortExtra is too short/,
    'rejects Extra Bytes arrays shorter than the point count'
  );
  t.end();
});

test('LASWriter#preserves normalized byte colors', async t => {
  const colorAttributes = {
    POSITION: attributes.POSITION,
    COLOR_0: {value: new Uint8Array([128, 255, 0]), size: 3, normalized: true}
  };
  const colorMesh = {
    attributes: colorAttributes,
    topology: 'point-list' as const,
    mode: 0,
    schema: deduceMeshSchema(colorAttributes, {topology: 'point-list', mode: '0'})
  };

  const arrayBuffer = await encode(colorMesh, LASWriter);
  const dataView = new DataView(arrayBuffer);

  t.equal(dataView.getUint16(227 + 20, true), 32896, 'red channel preserves normalized byte value');
  t.equal(dataView.getUint16(227 + 22, true), 65535, 'green channel preserves max byte value');
  t.equal(dataView.getUint16(227 + 24, true), 0, 'blue channel preserves zero byte value');
  t.end();
});

/** Read a little-endian UInt64 that is known to fit in JavaScript's safe integer range. */
function readUint64(dataView: DataView, byteOffset: number): number {
  return dataView.getUint32(byteOffset, true) + dataView.getUint32(byteOffset + 4, true) * 2 ** 32;
}
