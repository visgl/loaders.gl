// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
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
const vitestAssertions = {
  ok(value: unknown, message?: string) {
    expect(value, message).toBeTruthy();
  },
  notOk(value: unknown, message?: string) {
    expect(value, message).toBeFalsy();
  },
  equal(actual: unknown, expected: unknown, message?: string) {
    expect(actual, message).toBe(expected);
  }
};
test('LASWriter#writer conformance', () => {
  validateWriter(LASWriter, 'LASWriter');
});
test('LASWriter#encode plain and Arrow mesh data', async () => {
  const arrayBuffer = await encode(mesh, LASWriter);
  const data = await parse(arrayBuffer, LASLoader, {core: {worker: false}});
  validateMeshCategoryData(vitestAssertions, data);
  expect(data.mode, 'mode is POINTS (0)').toBe(0);
  expect(data.attributes.POSITION.value.length, 'POSITION attribute roundtripped').toBe(9);
  const arrowTable = convertMeshToTable(mesh, 'arrow-table');
  const arrowArrayBuffer = await encode(arrowTable, LASWriter);
  const arrowData = await parse(arrowArrayBuffer, LASLoader, {core: {worker: false}});
  validateMeshCategoryData(vitestAssertions, arrowData);
  expect(arrowData.attributes.POSITION.value.length, 'Arrow POSITION attribute roundtripped').toBe(
    9
  );
});
test('LASWriter#encode LAS 1.4 point format 7', async () => {
  const arrayBuffer = await encode(mesh, LASWriter, {
    las: {version: '1.4', pointDataRecordFormat: 7}
  });
  const data = await parse(arrayBuffer, LASLoader, {
    core: {worker: false}
  });
  const wasmData = await parse(arrayBuffer.slice(0), LASCOPCLoader, {
    core: {worker: false}
  });
  expect(data.loaderData.versionAsString, 'writes LAS 1.4 header').toBe('1.4');
  expect(data.loaderData.pointsFormatId, 'writes point format 7').toBe(7);
  expect(data.header.vertexCount, 'round trips point count').toBe(
    attributes.POSITION.value.length / 3
  );
  expect(data.attributes.COLOR_0, 'round trips color attribute').toBeTruthy();
  expect(
    Array.from(data.attributes.POSITION.value),
    'TypeScript parser matches WASM parser for written positions'
  ).toEqual(Array.from(wasmData.attributes.POSITION.value));
  expect(
    Array.from(data.attributes.intensity.value),
    'TypeScript parser matches WASM parser for written intensities'
  ).toEqual(Array.from(wasmData.attributes.intensity.value));
  expect(
    Array.from(data.attributes.classification.value),
    'TypeScript parser matches WASM parser for written classifications'
  ).toEqual(Array.from(wasmData.attributes.classification.value));
});
test('LASWriter#encodes fixed-chunk LAZ point formats 6-8', async () => {
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
    expect(
      dataView.getUint8(104),
      `PDRF ${pointDataRecordFormat} sets the compressed format flag`
    ).toBe(0x80 | pointDataRecordFormat);
    expect(dataView.getUint32(100, true), `PDRF ${pointDataRecordFormat} writes one VLR`).toBe(1);
    expect(chunkCount, `PDRF ${pointDataRecordFormat} writes two chunks`).toBe(2);
    expect(
      chunks.map(chunk => chunk.pointCount),
      `PDRF ${pointDataRecordFormat} fixed chunk counts roundtrip`
    ).toEqual([2, 1]);
    expect(
      chunks.reduce((byteLength, chunk) => byteLength + chunk.byteLength, 0),
      `PDRF ${pointDataRecordFormat} chunk sizes reach the table`
    ).toBe(chunkTableOffset - pointDataOffset - 8);
    expect(
      Array.from(data.attributes.POSITION.value),
      `PDRF ${pointDataRecordFormat} TypeScript positions match WASM`
    ).toEqual(Array.from(wasmData.attributes.POSITION.value));
    expect(
      Array.from(data.attributes.intensity.value),
      `PDRF ${pointDataRecordFormat} TypeScript intensities match WASM`
    ).toEqual(Array.from(wasmData.attributes.intensity.value));
    expect(
      Array.from(data.attributes.classification.value),
      `PDRF ${pointDataRecordFormat} TypeScript classifications match WASM`
    ).toEqual(Array.from(wasmData.attributes.classification.value));
  }
});
test('LASWriter#encodes legacy PDRF 0 LAZ', async () => {
  const arrayBuffer = await encode(mesh, LASWriter, {
    las: {format: 'laz', pointDataRecordFormat: 0, chunkSize: 2}
  });
  const data = await parse(arrayBuffer, LASLoader, {core: {worker: false}});
  expect(data.loaderData.pointsFormatId, 'writes legacy point format 0').toBe(0);
  expect(data.loaderData.versionAsString, 'writes the default legacy LAS version').toBe('1.2');
  expect(Array.from(data.attributes.POSITION.value), 'legacy LAZ positions roundtrip').toEqual(
    Array.from(attributes.POSITION.value)
  );
  expect(Array.from(data.attributes.intensity.value), 'legacy LAZ intensities roundtrip').toEqual(
    Array.from(attributes.intensity.value)
  );
});
test('LASWriter#encodes legacy GPS and RGB LAZ point formats', async () => {
  const legacyAttributes = {
    POSITION: {value: new Float64Array([1, 2, 3, 2, 3, 4, 3, 4, 5]), size: 3},
    gpsTime: {value: new Float64Array([123.5, 123.500001, 123.500002]), size: 1},
    COLOR_0: {value: new Uint8Array([10, 20, 30, 40, 50, 60, 70, 80, 90]), size: 3}
  };
  const legacyMesh = {
    attributes: legacyAttributes,
    topology: 'point-list' as const,
    mode: 0,
    schema: deduceMeshSchema(legacyAttributes, {topology: 'point-list', mode: '0'})
  };
  for (const pointDataRecordFormat of [1, 2, 3] as const) {
    const arrayBuffer = await encode(legacyMesh, LASWriter, {
      las: {format: 'laz', pointDataRecordFormat, chunkSize: 2}
    });
    const data = await parse(arrayBuffer, LASLoader, {core: {worker: false}});
    const wasmData = await parse(arrayBuffer.slice(0), LASCOPCLoader, {
      core: {worker: false}
    });
    expect(data.loaderData.pointsFormatId, `writes PDRF ${pointDataRecordFormat}`).toBe(
      pointDataRecordFormat
    );
    expect(
      Array.from(data.attributes.POSITION.value),
      `PDRF ${pointDataRecordFormat} positions roundtrip`
    ).toEqual(Array.from(legacyAttributes.POSITION.value));
    expect(
      Array.from(data.attributes.gpsTime?.value || []),
      `PDRF ${pointDataRecordFormat} GPS time matches WASM`
    ).toEqual(Array.from(wasmData.attributes.gpsTime?.value || []));
    if (pointDataRecordFormat >= 2 && pointDataRecordFormat < 3) {
      expect(
        Array.from(data.attributes.COLOR_0?.value || []),
        `PDRF ${pointDataRecordFormat} RGB matches WASM`
      ).toEqual(Array.from(wasmData.attributes.COLOR_0?.value || []));
    }
    if (pointDataRecordFormat === 3) {
      expect(
        Array.from(data.attributes.COLOR_0?.value || []),
        'PDRF 3 RGB roundtrips through TypeScript decoder'
      ).toEqual([10, 20, 30, 255, 40, 50, 60, 255, 70, 80, 90, 255]);
    }
  }
});
test('LASWriter#validates compressed output options', () => {
  expect(
    () =>
      LASWriter.encodeSync?.(mesh, {
        las: {format: 'laz', version: '1.2', pointDataRecordFormat: 6}
      }),
    'LAZ writer rejects legacy LAS versions'
  ).toThrow(/LAZ output requires LAS 1.4/);
  const waveform = LASWriter.encodeSync?.(mesh, {
    las: {format: 'laz', version: '1.4', pointDataRecordFormat: 5}
  });
  expect(
    new DataView(waveform!).getUint8(104) & 0x7f,
    'LAZ writer supports legacy waveform point formats'
  ).toBe(5);
  expect(
    () => LASWriter.encodeSync?.(mesh, {las: {format: 'laz', chunkSize: 0}}),
    'LAZ writer rejects empty chunks'
  ).toThrow(/invalid LAZ chunk size/);
  expect(
    () => LASWriter.encodeSync?.(mesh, {las: {version: '1.2', pointDataRecordFormat: 7}}),
    'LASWriter rejects modern point formats in legacy LAS headers'
  ).toThrow(/point data record format 7 requires LAS 1.4/);
});
test('LASWriter#encodes variable LAZ chunks', async () => {
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
  expect(dataView.getUint32(100, true), 'writes one LASzip VLR').toBe(1);
  expect(
    chunks.map(chunk => chunk.pointCount),
    'variable chunk table preserves point counts'
  ).toEqual([2, 1]);
  expect(data.attributes.POSITION.value.length, 'variable LAZ parses through LASLoader').toBe(9);
  expect(
    Array.from(data.attributes.POSITION.value),
    'variable LAZ positions match the independent WASM reader'
  ).toEqual(Array.from(wasmData.attributes.POSITION.value));
  expect(
    Array.from(data.attributes.intensity.value),
    'variable LAZ intensities match the independent WASM reader'
  ).toEqual(Array.from(wasmData.attributes.intensity.value));
});
test('LASWriter#preserves modern LAS point fields', () => {
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
  expect(dataView.getUint8(pointOffset + 14), 'writes return number and count').toBe(0x32);
  expect(
    dataView.getUint8(pointOffset + 15),
    'writes classification, scanner, and flight-line flags'
  ).toBe(0xef);
  expect(dataView.getUint32(263, true), 'writes the extended second-return count').toBe(1);
  expect(dataView.getUint8(pointOffset + 17), 'writes user data').toBe(7);
  expect(dataView.getInt16(pointOffset + 18, true), 'writes scan angle').toBe(-12);
  expect(dataView.getUint16(pointOffset + 20, true), 'writes point source id').toBe(99);
  expect(dataView.getFloat64(pointOffset + 22, true), 'writes GPS time').toBe(123.5);
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
  expect(lazPointView.getUint8(14), 'LAZ preserves return number and count').toBe(0x32);
  expect(
    lazPointView.getUint8(15),
    'LAZ preserves classification, scanner, and flight-line flags'
  ).toBe(0xef);
  expect(lazPointView.getUint8(17), 'LAZ preserves user data').toBe(7);
  expect(lazPointView.getInt16(18, true), 'LAZ preserves scan angle').toBe(-12);
  expect(lazPointView.getUint16(20, true), 'LAZ preserves point source id').toBe(99);
  expect(lazPointView.getFloat64(22, true), 'LAZ preserves GPS time').toBe(123.5);
});
test('LASWriter#encodes extended return histograms', () => {
  const extendedReturnAttributes = {
    POSITION: {value: new Float64Array([1, 2, 3]), size: 3},
    returnNumber: {value: new Uint8Array([15]), size: 1},
    numberOfReturns: {value: new Uint8Array([15]), size: 1}
  };
  const extendedReturnMesh = {
    attributes: extendedReturnAttributes,
    topology: 'point-list' as const,
    mode: 0,
    schema: deduceMeshSchema(extendedReturnAttributes, {topology: 'point-list', mode: '0'})
  };
  const arrayBuffer = LASWriter.encodeSync?.(extendedReturnMesh, {
    las: {version: '1.4', pointDataRecordFormat: 7}
  });
  if (!arrayBuffer) {
    throw new Error('LASWriter did not return an ArrayBuffer');
  }
  const dataView = new DataView(arrayBuffer);
  expect(dataView.getUint8(375 + 14), 'encodes the fifteenth return number and count').toBe(0xff);
  expect(dataView.getUint32(367, true), 'writes the fifteenth extended return count').toBe(1);
});
test('LASWriter#encodes legacy return metadata', () => {
  const legacyReturnAttributes = {
    POSITION: {value: new Float64Array([1, 2, 3]), size: 3},
    returnNumber: {value: new Uint8Array([2]), size: 1},
    numberOfReturns: {value: new Uint8Array([3]), size: 1}
  };
  const legacyReturnMesh = {
    attributes: legacyReturnAttributes,
    topology: 'point-list' as const,
    mode: 0,
    schema: deduceMeshSchema(legacyReturnAttributes, {topology: 'point-list', mode: '0'})
  };
  const arrayBuffer = LASWriter.encodeSync?.(legacyReturnMesh, {
    las: {pointDataRecordFormat: 0}
  });
  if (!arrayBuffer) {
    throw new Error('LASWriter did not return an ArrayBuffer');
  }
  const dataView = new DataView(arrayBuffer);
  expect(dataView.getUint8(227 + 14), 'encodes legacy return number and count').toBe(0x1a);
  expect(dataView.getUint32(115, true), 'writes the legacy second-return count').toBe(1);
});
test('LASWriter#preserves NIR in PDRF 8 LAZ', () => {
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
  expect(new DataView(chunk.buffer).getUint16(36, true), 'LAZ preserves NIR').toBe(1234);
});
test('LASWriter#encodes waveform PDRF 9 and 10 LAZ containers', async () => {
  const waveformAttributes = {
    POSITION: {value: new Float64Array([1, 2, 3]), size: 3},
    COLOR_0: {value: new Uint8Array([10, 20, 30]), size: 3},
    nir: {value: new Uint16Array([1234]), size: 1},
    wavePacketDescriptorIndex: {value: new Uint8Array([7]), size: 1},
    wavePacketOffset: {value: new Float64Array([123456]), size: 1},
    wavePacketSize: {value: new Uint32Array([4096]), size: 1},
    wavePacketReturnPoint: {value: new Float32Array([0.25]), size: 1},
    wavePacketVector: {value: new Float32Array([1.5, -2.5, 3.5]), size: 3}
  };
  const waveformMesh = {
    attributes: waveformAttributes,
    topology: 'point-list' as const,
    mode: 0,
    schema: deduceMeshSchema(waveformAttributes, {topology: 'point-list', mode: '0'})
  };
  for (const pointDataRecordFormat of [9, 10] as const) {
    const arrayBuffer = await encode(waveformMesh, LASWriter, {
      las: {format: 'laz', pointDataRecordFormat, chunkSize: 1}
    });
    const dataView = new DataView(arrayBuffer);
    const pointDataOffset = dataView.getUint32(96, true);
    const chunkTableOffset = readUint64(dataView, pointDataOffset);
    const pointDataRecordLength = pointDataRecordFormat === 9 ? 59 : 67;
    const decoded = decodeLAZChunk(arrayBuffer.slice(pointDataOffset + 8, chunkTableOffset), {
      pointDataRecordFormat,
      pointDataRecordLength,
      pointCount: 1,
      point14ItemVersion: 3,
      rgb14ItemVersion: 3,
      wavePacketItemVersion: 3,
      byte14ItemVersion: 3
    });
    const decodedView = new DataView(decoded.buffer, decoded.byteOffset, decoded.byteLength);
    const waveformOffset = pointDataRecordFormat === 9 ? 30 : 38;
    const uncompressed = await encode(waveformMesh, LASWriter, {
      las: {format: 'las', pointDataRecordFormat}
    });
    const uncompressedDataView = new DataView(uncompressed);
    const uncompressedPointOffset = uncompressedDataView.getUint32(96, true);
    expect(dataView.getUint8(104), `writes PDRF ${pointDataRecordFormat}`).toBe(
      0x80 | pointDataRecordFormat
    );
    expect(dataView.getUint16(105, true), 'writes the waveform record length').toBe(
      pointDataRecordLength
    );
    expect(decodedView.getUint8(waveformOffset), 'preserves the waveform descriptor index').toBe(7);
    expect(
      decodedView.getBigUint64(waveformOffset + 1, true),
      'preserves the waveform offset'
    ).toBe(123456n);
    expect(decodedView.getUint32(waveformOffset + 9, true), 'preserves the waveform size').toBe(
      4096
    );
    expect(decodedView.getFloat32(waveformOffset + 13, true), 'preserves the return location').toBe(
      0.25
    );
    expect(
      [0, 1, 2].map(componentIndex =>
        decodedView.getFloat32(waveformOffset + 17 + componentIndex * 4, true)
      ),
      'preserves the waveform vector'
    ).toEqual([1.5, -2.5, 3.5]);
    expect(
      decoded,
      `PDRF ${pointDataRecordFormat} compressed point bytes match uncompressed LAS`
    ).toEqual(new Uint8Array(uncompressed, uncompressedPointOffset, pointDataRecordLength));
    if (pointDataRecordFormat === 10) {
      expect(decodedView.getUint16(36, true), 'PDRF 10 preserves NIR').toBe(1234);
    }
  }
});
test('LASWriter#writes Extra Bytes in LAS and LAZ', () => {
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
  expect(lazDataView.getUint32(100, true), 'writes Extra Bytes and LASzip VLRs').toBe(2);
  expect(lazDataView.getUint16(105, true), 'includes Extra Bytes in the LAZ record length').toBe(
    38
  );
  expect(lazDataView.getUint16(375 + 20, true), 'writes one Extra Bytes descriptor').toBe(192);
  expect(lazDataView.getUint8(375 + 54 + 2), 'declares the Uint16 Extra Bytes type').toBe(3);
  expect(lazPointView.getUint16(36, true), 'LAZ preserves the Extra Bytes value').toBe(1234);
  expect(lasDataView.getUint32(100, true), 'writes an Extra Bytes VLR for LAS').toBe(1);
  expect(lasDataView.getUint16(105, true), 'includes Extra Bytes in the LAS record length').toBe(
    38
  );
  expect(lasDataView.getUint16(lasPointDataOffset + 36, true), 'LAS preserves Extra Bytes').toBe(
    1234
  );
});
test('LASWriter#preserves LAZ fields through encodeInBatches', async () => {
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
  expect(Array.from(data.attributes.intensity.value), 'merges batches').toEqual([10, 20, 30, 40]);
  expect(new DataView(chunk.buffer).getUint16(36, true), 'preserves first batch Extra Bytes').toBe(
    100
  );
});
test('LASWriter#validates batched attribute schemas', async () => {
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
  await await expect(consumeBatches(), 'rejects batches with missing attributes').rejects.toThrow(
    /consistent attribute names/
  );
});
test('LASWriter#writes vector Extra Bytes fields', () => {
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
  expect(dataView.getUint16(105, true), 'includes vector Extra Bytes width').toBe(48);
  expect(dataView.getUint8(375 + 54 + 2), 'declares a three-component float type').toBe(29);
  expect(pointView.getFloat32(36, true), 'preserves vector component one').toBe(1.5);
  expect(pointView.getFloat32(40, true), 'preserves vector component two').toBe(2.5);
  expect(pointView.getFloat32(44, true), 'preserves vector component three').toBe(3.5);
});
test('LASWriter#writes multiple Extra Bytes fields contiguously', () => {
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
  expect(dataView.getUint16(105, true), 'includes both Extra Bytes widths').toBe(39);
  expect(pointView.getUint8(36), 'writes the first Extra Bytes field at the base offset').toBe(11);
  expect(pointView.getUint16(37, true), 'writes the second Extra Bytes field contiguously').toBe(
    2233
  );
});
test('LASWriter#validates Extra Bytes declarations', () => {
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
  expect(
    () =>
      LASWriter.encodeSync?.(scalarMesh, {
        las: {extraBytes: [{attribute: 'value'}, {attribute: 'value'}]}
      }),
    'rejects duplicate Extra Bytes attributes'
  ).toThrow(/duplicate Extra Bytes attribute value/);
  const largeAttributes: Record<
    string,
    {
      value: Uint8Array | Float64Array;
      size: number;
    }
  > = {
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
  expect(
    () => LASWriter.encodeSync?.(largeMesh, {las: {extraBytes}}),
    'rejects an Extra Bytes record that exceeds the LAS limit'
  ).toThrow(/point data record length .* exceeds the LAS limit/);
  const vlrAttributes: Record<
    string,
    {
      value: Uint8Array | Float64Array;
      size: number;
    }
  > = {
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
  expect(
    () =>
      LASWriter.encodeSync?.(vlrMesh, {
        las: {extraBytes: Array.from({length: 342}, (_, index) => ({attribute: `value-${index}`}))}
      }),
    'rejects an Extra Bytes VLR that exceeds its length field'
  ).toThrow(/Extra Bytes VLR payload .* exceeds the LAS limit/);
});
test('LASWriter#validates point attribute shapes', () => {
  const invalidPositionMesh = {
    ...mesh,
    attributes: {
      ...mesh.attributes,
      POSITION: {value: new Float32Array([0, 0]), size: 2}
    }
  };
  expect(
    () => LASWriter.encodeSync?.(invalidPositionMesh),
    'rejects non-three-component positions'
  ).toThrow(/POSITION attribute must have size 3/);
  const shortExtraMesh = {
    ...mesh,
    attributes: {
      ...mesh.attributes,
      shortExtra: {value: new Uint8Array([1]), size: 1}
    }
  };
  expect(
    () =>
      LASWriter.encodeSync?.(shortExtraMesh, {
        las: {extraBytes: [{attribute: 'shortExtra'}]}
      }),
    'rejects Extra Bytes arrays shorter than the point count'
  ).toThrow(/Extra Bytes attribute shortExtra is too short/);
  const shortIntensityMesh = {
    ...mesh,
    attributes: {
      ...mesh.attributes,
      intensity: {value: new Uint16Array([1]), size: 1}
    }
  };
  expect(
    () => LASWriter.encodeSync?.(shortIntensityMesh),
    'rejects mapped point attributes shorter than POSITION'
  ).toThrow(/intensity attribute is too short/);
});
test('LASWriter#rejects four-component Extra Bytes fields', () => {
  const fourComponentAttributes = {
    POSITION: {value: new Float64Array([1, 2, 3]), size: 3},
    extraVector: {value: new Float32Array([1, 2, 3, 4]), size: 4}
  };
  const fourComponentMesh = {
    attributes: fourComponentAttributes,
    topology: 'point-list' as const,
    mode: 0,
    schema: deduceMeshSchema(fourComponentAttributes, {topology: 'point-list', mode: '0'})
  };
  expect(() =>
    LASWriter.encodeSync?.(fourComponentMesh, {
      las: {extraBytes: [{attribute: 'extraVector'}]}
    })
  ).toThrow(/Extra Bytes attribute extraVector must have size 1 or 3/);
});
test('LASWriter#validates coordinate quantization', () => {
  expect(() => LASWriter.encodeSync?.(mesh, {las: {scale: [0, 0.001, 0.001]}})).toThrow(
    /coordinate scale must be finite and positive/
  );
  expect(() =>
    LASWriter.encodeSync?.(mesh, {
      las: {scale: [0.001, 0.001, 0.001], offset: [Number.NaN, 0, 0]}
    })
  ).toThrow(/coordinate offset must be finite/);
  const overflowingMesh = {
    ...mesh,
    attributes: {
      ...mesh.attributes,
      POSITION: {value: new Float64Array([5000000, 0, 0]), size: 3}
    }
  };
  expect(() =>
    LASWriter.encodeSync?.(overflowingMesh, {
      las: {scale: [0.001, 0.001, 0.001], offset: [0, 0, 0]}
    })
  ).toThrow(/encoded coordinate exceeds the signed 32-bit LAS range/);
  const nonFiniteMesh = {
    ...mesh,
    attributes: {
      ...mesh.attributes,
      POSITION: {value: new Float64Array([Number.NaN, 0, 0]), size: 3}
    }
  };
  expect(() => LASWriter.encodeSync?.(nonFiniteMesh)).toThrow(/POSITION values must be finite/);
});
test('LASWriter#rejects non-finite mapped attributes', () => {
  const nonFiniteGPSMesh = {
    ...mesh,
    attributes: {
      ...mesh.attributes,
      gpsTime: {value: new Float64Array([Number.NaN, 1, 2]), size: 1}
    }
  };
  expect(() => LASWriter.encodeSync?.(nonFiniteGPSMesh, {las: {pointDataRecordFormat: 7}})).toThrow(
    /gpsTime attribute must contain finite values/
  );
  const nonFiniteExtraMesh = {
    ...mesh,
    attributes: {
      ...mesh.attributes,
      extraValue: {value: new Float32Array([Number.POSITIVE_INFINITY, 1, 2]), size: 1}
    }
  };
  expect(() =>
    LASWriter.encodeSync?.(nonFiniteExtraMesh, {
      las: {extraBytes: [{attribute: 'extraValue'}]}
    })
  ).toThrow(/extraValue attribute must contain finite values/);
});
test('LASWriter#validates return relationships', () => {
  const invalidReturnAttributes = {
    POSITION: {value: new Float64Array([1, 2, 3]), size: 3},
    returnNumber: {value: new Uint8Array([3]), size: 1},
    numberOfReturns: {value: new Uint8Array([2]), size: 1}
  };
  const invalidReturnMesh = {
    attributes: invalidReturnAttributes,
    topology: 'point-list' as const,
    mode: 0,
    schema: deduceMeshSchema(invalidReturnAttributes, {topology: 'point-list', mode: '0'})
  };
  expect(() =>
    LASWriter.encodeSync?.(invalidReturnMesh, {
      las: {pointDataRecordFormat: 7}
    })
  ).toThrow(/returnNumber cannot exceed numberOfReturns/);
});
test('LASWriter#preserves normalized byte colors', async () => {
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
  expect(dataView.getUint16(227 + 20, true), 'red channel preserves normalized byte value').toBe(
    32896
  );
  expect(dataView.getUint16(227 + 22, true), 'green channel preserves max byte value').toBe(65535);
  expect(dataView.getUint16(227 + 24, true), 'blue channel preserves zero byte value').toBe(0);
});
/** Read a little-endian UInt64 that is known to fit in JavaScript's safe integer range. */
function readUint64(dataView: DataView, byteOffset: number): number {
  return dataView.getUint32(byteOffset, true) + dataView.getUint32(byteOffset + 4, true) * 2 ** 32;
}
