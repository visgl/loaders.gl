// loaders.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// Copyright (c) vis.gl contributors
// Compatibility reconstruction follows LASzip, copyright rapidlasso GmbH.
// See LASZIP-LICENSE and LASZIP-NOTICE in this directory.

import type {LASHeader, LASMetadata} from './las-types';

/** Descriptor offsets for LASzip's legacy representation of modern point records. */
export type LASCompatibilityLayout = {
  /** Logical modern point format, while the source header retains its physical legacy format. */
  pointDataRecordFormat: number;
  /** Logical LAS version stored in the compatibility VLR. */
  version: '1.4' | '1.5';
  /** Packed Extra Bytes offset of the scan angle remainder. */
  scanAngleByteOffset: number;
  /** Packed Extra Bytes offset of the return increments. */
  returnsByteOffset: number;
  /** Packed Extra Bytes offset of the classification increment. */
  classificationByteOffset: number;
  /** Packed Extra Bytes offset of overlap and scanner channel. */
  flagsByteOffset: number;
  /** Packed Extra Bytes offset of optional NIR data. */
  nirByteOffset?: number;
};

/** Selected column targets that can be reconstructed from compatibility Extra Bytes. */
export type LASCompatibilityTarget = {
  /** Classification codes. */
  classifications: Uint8Array | null;
  /** Return numbers. */
  returnNumbers: Uint8Array | null;
  /** Return counts. */
  numberOfReturns: Uint8Array | null;
  /** Scan angles in modern 0.006-degree units. */
  scanAngles: Int16Array | null;
  /** Overlap flags. */
  overlapFlags: Uint8Array | null;
  /** Scanner channels. */
  scannerChannels: Uint8Array | null;
  /** Optional NIR values. */
  nir: Uint16Array | null;
};

/** Validate the explicit compatibility marker and locate its descriptor-defined fields. */
export function getLASCompatibilityLayout(
  header: LASHeader,
  metadata: LASMetadata
): LASCompatibilityLayout | undefined {
  const record = metadata.vlrs.find(
    variableLengthRecord =>
      variableLengthRecord.userId === 'lascompatible' && variableLengthRecord.recordId === 22204
  );
  if (!record) return undefined;
  if (
    !['1.0', '1.1', '1.2', '1.3'].includes(header.versionAsString || '') ||
    ![1, 3, 4, 5].includes(header.pointsFormatId)
  ) {
    throw new Error('LASLoader: compatibility mode requires a legacy LAS point format');
  }
  const view = new DataView(record.data.buffer, record.data.byteOffset, record.data.byteLength);
  if (view.byteLength < 4) throw new Error('LASLoader: truncated LASzip compatibility VLR');
  const version = view.getUint16(2, true);
  if ((version !== 3 && version !== 4) || view.byteLength !== (version === 3 ? 156 : 174)) {
    throw new Error(`LASLoader: unsupported LASzip compatibility VLR version ${version} or length`);
  }
  const offsets = new Map<string, {byteOffset: number; dataType: number}>();
  let byteOffset = 0;
  for (const descriptor of metadata.extraBytes) {
    const scalarDataType =
      descriptor.dataType > 20
        ? descriptor.dataType - 20
        : descriptor.dataType > 10
          ? descriptor.dataType - 10
          : descriptor.dataType;
    const size = descriptor.dataType > 20 ? 3 : descriptor.dataType > 10 ? 2 : 1;
    const byteLength =
      descriptor.dataType === 0
        ? descriptor.options
        : scalarDataType <= 2
          ? size
          : scalarDataType <= 4
            ? 2 * size
            : scalarDataType <= 6 || scalarDataType === 9
              ? 4 * size
              : 8 * size;
    if (descriptor.dataType > 30 || !byteLength)
      throw new Error('LASLoader: invalid compatibility Extra Bytes layout');
    offsets.set(descriptor.name, {byteOffset, dataType: descriptor.dataType});
    byteOffset += byteLength;
  }
  const baseLength = {1: 28, 3: 34, 4: 57, 5: 63}[header.pointsFormatId]!;
  if (byteOffset !== header.pointsStructSize - baseLength)
    throw new Error('LASLoader: compatibility descriptors do not match point record length');
  const scanAngleByteOffset = getCompatibilityFieldOffset(offsets, 'LAS 1.4 scan angle', 4);
  const returnsByteOffset = getCompatibilityFieldOffset(offsets, 'LAS 1.4 extended returns', 1);
  const classificationByteOffset = getCompatibilityFieldOffset(
    offsets,
    'LAS 1.4 classification',
    1
  );
  const flagsByteOffset = getCompatibilityFieldOffset(offsets, 'LAS 1.4 flags and channel', 1);
  const nirByteOffset = offsets.has('LAS 1.4 NIR band')
    ? getCompatibilityFieldOffset(offsets, 'LAS 1.4 NIR band', 3)
    : undefined;
  const pointDataRecordFormat =
    header.pointsFormatId === 1
      ? 6
      : header.pointsFormatId === 3
        ? nirByteOffset === undefined
          ? 7
          : 8
        : header.pointsFormatId === 4
          ? 9
          : 10;
  if (header.pointsFormatId === 5 && nirByteOffset === undefined)
    throw new Error('LASLoader: compatibility waveform color points require NIR');
  return {
    pointDataRecordFormat,
    version: version === 3 ? '1.4' : '1.5',
    scanAngleByteOffset,
    returnsByteOffset,
    classificationByteOffset,
    flagsByteOffset,
    nirByteOffset
  };
}

/** Require the named field to have the scalar representation used by LASzip. */
function getCompatibilityFieldOffset(
  offsets: Map<string, {byteOffset: number; dataType: number}>,
  name: string,
  dataType: number
): number {
  const field = offsets.get(name);
  if (!field || field.dataType !== dataType)
    throw new Error(`LASLoader: missing or invalid compatibility field ${name}`);
  return field.byteOffset;
}

/** Restore selected modern fields from one legacy record without changing raw point bytes. */
export function populateLASCompatibilityPoint(
  view: DataView,
  extraByteOffset: number,
  pointIndex: number,
  layout: LASCompatibilityLayout,
  target: LASCompatibilityTarget
): void {
  if (
    !target.classifications &&
    !target.returnNumbers &&
    !target.numberOfReturns &&
    !target.scanAngles &&
    !target.overlapFlags &&
    !target.scannerChannels &&
    !target.nir
  )
    return;
  const extendedReturns = view.getUint8(extraByteOffset + layout.returnsByteOffset);
  const flags = view.getUint8(extraByteOffset + layout.flagsByteOffset);
  if (target.classifications)
    target.classifications[pointIndex] += view.getUint8(
      extraByteOffset + layout.classificationByteOffset
    );
  if (target.returnNumbers) target.returnNumbers[pointIndex] += extendedReturns >> 4;
  if (target.numberOfReturns) target.numberOfReturns[pointIndex] += extendedReturns & 15;
  if (target.scanAngles) {
    const rank = target.scanAngles[pointIndex];
    const prediction = Math.fround(rank / Math.fround(0.006));
    const quantized = Math.sign(prediction) * Math.floor(Math.abs(prediction) + 0.5);
    target.scanAngles[pointIndex] =
      quantized + view.getInt16(extraByteOffset + layout.scanAngleByteOffset, true);
  }
  if (target.overlapFlags) target.overlapFlags[pointIndex] = flags & 1;
  if (target.scannerChannels) target.scannerChannels[pointIndex] = (flags >> 1) & 3;
  if (target.nir && layout.nirByteOffset !== undefined)
    target.nir[pointIndex] = view.getUint16(extraByteOffset + layout.nirByteOffset, true);
}
