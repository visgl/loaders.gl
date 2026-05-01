// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {MeshArrowTable} from '@loaders.gl/schema';
import type {GaussianSplats} from '../types';
import {makeGaussianSplatsArrowTable} from './splats-arrow-table';
import {convertAlphaByteToLinearOpacity, decodeFloat16, normalizeQuaternion} from './splat-utils';

const CURRENT_MAJOR_VERSION = 0;
const CURRENT_MINOR_VERSION = 1;
const HEADER_BYTE_LENGTH = 4096;
const SECTION_HEADER_BYTE_LENGTH = 1024;
const DEFAULT_SH_8BIT_COMPRESSION_RANGE = 3;
const DEFAULT_SH_8BIT_COMPRESSION_HALF_RANGE = DEFAULT_SH_8BIT_COMPRESSION_RANGE / 2;

type KSPLATHeader = {
  versionMajor: number;
  versionMinor: number;
  maxSectionCount: number;
  sectionCount: number;
  maxSplatCount: number;
  splatCount: number;
  compressionLevel: 0 | 1 | 2;
  minSphericalHarmonicsCoeff: number;
  maxSphericalHarmonicsCoeff: number;
};

type KSPLATSection = {
  bytesPerSplat: number;
  splatCountOffset: number;
  splatCount: number;
  maxSplatCount: number;
  bucketSize: number;
  bucketCount: number;
  bucketStorageSizeBytes: number;
  bucketsStorageSizeBytes: number;
  compressionScaleRange: number;
  compressionScaleFactor: number;
  base: number;
  bucketsBase: number;
  dataBase: number;
  fullBucketCount: number;
  partiallyFilledBucketCount: number;
  sphericalHarmonicsDegree: number;
};

type CompressionLayout = {
  bytesPerCenter: number;
  bytesPerScale: number;
  bytesPerRotation: number;
  bytesPerColor: number;
  scaleOffsetBytes: number;
  colorOffsetBytes: number;
  sphericalHarmonicsOffsetBytes: number;
  scaleRange: number;
  bytesPerSphericalHarmonicsComponent: number;
};

const COMPRESSION_LAYOUTS: Record<0 | 1 | 2, CompressionLayout> = {
  0: {
    bytesPerCenter: 12,
    bytesPerScale: 12,
    bytesPerRotation: 16,
    bytesPerColor: 4,
    scaleOffsetBytes: 12,
    colorOffsetBytes: 40,
    sphericalHarmonicsOffsetBytes: 44,
    scaleRange: 1,
    bytesPerSphericalHarmonicsComponent: 4
  },
  1: {
    bytesPerCenter: 6,
    bytesPerScale: 6,
    bytesPerRotation: 8,
    bytesPerColor: 4,
    scaleOffsetBytes: 6,
    colorOffsetBytes: 20,
    sphericalHarmonicsOffsetBytes: 24,
    scaleRange: 32767,
    bytesPerSphericalHarmonicsComponent: 2
  },
  2: {
    bytesPerCenter: 6,
    bytesPerScale: 6,
    bytesPerRotation: 8,
    bytesPerColor: 4,
    scaleOffsetBytes: 6,
    colorOffsetBytes: 20,
    sphericalHarmonicsOffsetBytes: 24,
    scaleRange: 32767,
    bytesPerSphericalHarmonicsComponent: 1
  }
};

/** Parses a `.ksplat` ArrayBuffer into a Mesh Arrow table. */
export function parseKSPLAT(data: ArrayBuffer): MeshArrowTable {
  return makeGaussianSplatsArrowTable(parseKSPLATToGaussianSplats(data));
}

/** Parses a `.ksplat` ArrayBuffer into decoded Gaussian splat values. */
export function parseKSPLATToGaussianSplats(data: ArrayBuffer): GaussianSplats {
  if (data.byteLength < HEADER_BYTE_LENGTH) {
    throw new Error(`KSPLATLoader: file must contain a ${HEADER_BYTE_LENGTH}-byte header.`);
  }

  const header = parseKSPLATHeader(data);
  checkKSPLATVersion(header);
  const sections = parseKSPLATSections(data, header);
  const splatCount = getTotalSplatCount(header, sections);
  const sphericalHarmonicsComponentCount = Math.max(
    0,
    ...sections
      .slice(0, getActiveSectionCount(header))
      .map(section => getSphericalHarmonicsComponentCount(section.sphericalHarmonicsDegree))
  );

  const positions = new Float32Array(splatCount * 3);
  const scales = new Float32Array(splatCount * 3);
  const rotations = new Float32Array(splatCount * 4);
  const colors = new Uint8Array(splatCount * 3);
  const opacities = new Float32Array(splatCount);
  const sphericalHarmonics = sphericalHarmonicsComponentCount
    ? new Float32Array(splatCount * sphericalHarmonicsComponentCount)
    : undefined;

  let outputSplatIndex = 0;
  for (const section of sections.slice(0, getActiveSectionCount(header))) {
    validateSectionBounds(data, section);
    for (
      let localSplatIndex = 0;
      localSplatIndex < section.splatCount && outputSplatIndex < splatCount;
      localSplatIndex++
    ) {
      decodeKSPLATSplat(
        data,
        header,
        section,
        localSplatIndex,
        outputSplatIndex,
        positions,
        scales,
        rotations,
        colors,
        opacities,
        sphericalHarmonics,
        sphericalHarmonicsComponentCount
      );
      outputSplatIndex++;
    }
  }

  return {
    format: 'ksplat',
    splatCount,
    positions,
    scales,
    rotations,
    colors,
    opacities,
    sphericalHarmonics,
    sphericalHarmonicsComponentCount,
    loaderData: {
      format: 'ksplat',
      ...header,
      sections: sections.slice(0, getActiveSectionCount(header)).map(section => ({
        splatCount: section.splatCount,
        maxSplatCount: section.maxSplatCount,
        sphericalHarmonicsDegree: section.sphericalHarmonicsDegree
      }))
    }
  };
}

/** Decodes one KSPLAT record into the shared Gaussian splat arrays. */
function decodeKSPLATSplat(
  data: ArrayBuffer,
  header: KSPLATHeader,
  section: KSPLATSection,
  localSplatIndex: number,
  outputSplatIndex: number,
  positions: Float32Array,
  scales: Float32Array,
  rotations: Float32Array,
  colors: Uint8Array,
  opacities: Float32Array,
  sphericalHarmonics: Float32Array | undefined,
  sphericalHarmonicsComponentCount: number
): void {
  const layout = COMPRESSION_LAYOUTS[header.compressionLevel];
  const splatBase = section.dataBase + section.bytesPerSplat * localSplatIndex;
  const positionOffset = outputSplatIndex * 3;
  const rotationOffset = outputSplatIndex * 4;
  const bucketCenter = getBucketCenter(data, section, localSplatIndex);

  positions[positionOffset + 0] = decodeKSPLATCenterComponent(
    data,
    splatBase,
    0,
    header,
    section,
    bucketCenter[0]
  );
  positions[positionOffset + 1] = decodeKSPLATCenterComponent(
    data,
    splatBase,
    1,
    header,
    section,
    bucketCenter[1]
  );
  positions[positionOffset + 2] = decodeKSPLATCenterComponent(
    data,
    splatBase,
    2,
    header,
    section,
    bucketCenter[2]
  );

  scales[positionOffset + 0] = readCompressedFloat(
    data,
    splatBase + layout.scaleOffsetBytes,
    0,
    header.compressionLevel
  );
  scales[positionOffset + 1] = readCompressedFloat(
    data,
    splatBase + layout.scaleOffsetBytes,
    1,
    header.compressionLevel
  );
  scales[positionOffset + 2] = readCompressedFloat(
    data,
    splatBase + layout.scaleOffsetBytes,
    2,
    header.compressionLevel
  );

  const [w, x, y, z] = normalizeQuaternion(
    readCompressedFloat(data, splatBase + layout.scaleOffsetBytes, 3, header.compressionLevel),
    readCompressedFloat(data, splatBase + layout.scaleOffsetBytes, 4, header.compressionLevel),
    readCompressedFloat(data, splatBase + layout.scaleOffsetBytes, 5, header.compressionLevel),
    readCompressedFloat(data, splatBase + layout.scaleOffsetBytes, 6, header.compressionLevel)
  );
  rotations[rotationOffset + 0] = w;
  rotations[rotationOffset + 1] = x;
  rotations[rotationOffset + 2] = y;
  rotations[rotationOffset + 3] = z;

  const colorBase = splatBase + layout.colorOffsetBytes;
  const colorView = new Uint8Array(data, colorBase, 4);
  colors[positionOffset + 0] = colorView[0];
  colors[positionOffset + 1] = colorView[1];
  colors[positionOffset + 2] = colorView[2];
  opacities[outputSplatIndex] = convertAlphaByteToLinearOpacity(colorView[3]);

  if (sphericalHarmonics && sphericalHarmonicsComponentCount) {
    decodeSphericalHarmonics(
      data,
      splatBase + layout.sphericalHarmonicsOffsetBytes,
      header,
      section,
      outputSplatIndex,
      sphericalHarmonics,
      sphericalHarmonicsComponentCount
    );
  }
}

/** Reads and validates the fixed-size KSPLAT global header. */
function parseKSPLATHeader(data: ArrayBuffer): KSPLATHeader {
  const dataView = new DataView(data, 0, HEADER_BYTE_LENGTH);
  const compressionLevel = dataView.getUint16(20, true);
  if (compressionLevel !== 0 && compressionLevel !== 1 && compressionLevel !== 2) {
    throw new Error(`KSPLATLoader: unsupported compression level ${compressionLevel}.`);
  }
  return {
    versionMajor: dataView.getUint8(0),
    versionMinor: dataView.getUint8(1),
    maxSectionCount: dataView.getUint32(4, true),
    sectionCount: dataView.getUint32(8, true),
    maxSplatCount: dataView.getUint32(12, true),
    splatCount: dataView.getUint32(16, true),
    compressionLevel,
    minSphericalHarmonicsCoeff:
      dataView.getFloat32(36, true) || -DEFAULT_SH_8BIT_COMPRESSION_HALF_RANGE,
    maxSphericalHarmonicsCoeff:
      dataView.getFloat32(40, true) || DEFAULT_SH_8BIT_COMPRESSION_HALF_RANGE
  };
}

/** Throws when the KSPLAT version is older than the supported SplatBuffer version. */
function checkKSPLATVersion(header: KSPLATHeader): void {
  if (
    header.versionMajor === CURRENT_MAJOR_VERSION
      ? header.versionMinor >= CURRENT_MINOR_VERSION
      : header.versionMajor > CURRENT_MAJOR_VERSION
  ) {
    return;
  }
  throw new Error(
    `KSPLATLoader: version ${header.versionMajor}.${header.versionMinor} is not supported.`
  );
}

/** Reads all fixed-size KSPLAT section headers and derives their byte ranges. */
function parseKSPLATSections(data: ArrayBuffer, header: KSPLATHeader): KSPLATSection[] {
  if (data.byteLength < HEADER_BYTE_LENGTH + header.maxSectionCount * SECTION_HEADER_BYTE_LENGTH) {
    throw new Error('KSPLATLoader: file does not contain all section headers.');
  }

  const sections: KSPLATSection[] = [];
  let sectionBase = HEADER_BYTE_LENGTH + header.maxSectionCount * SECTION_HEADER_BYTE_LENGTH;
  let splatCountOffset = 0;

  for (let sectionIndex = 0; sectionIndex < header.maxSectionCount; sectionIndex++) {
    const sectionHeaderBase = HEADER_BYTE_LENGTH + sectionIndex * SECTION_HEADER_BYTE_LENGTH;
    const dataView = new DataView(data, sectionHeaderBase, SECTION_HEADER_BYTE_LENGTH);
    const splatCount = dataView.getUint32(0, true);
    const maxSplatCount = dataView.getUint32(4, true);
    const bucketSize = dataView.getUint32(8, true);
    const bucketCount = dataView.getUint32(12, true);
    const bucketBlockSize = dataView.getFloat32(16, true);
    const bucketStorageSizeBytes = dataView.getUint16(20, true);
    const compressionScaleRange =
      dataView.getUint32(24, true) || COMPRESSION_LAYOUTS[header.compressionLevel].scaleRange;
    const fullBucketCount = dataView.getUint32(32, true);
    const partiallyFilledBucketCount = dataView.getUint32(36, true);
    const sphericalHarmonicsDegree = dataView.getUint16(40, true);
    const bytesPerSplat = getBytesPerSplat(header.compressionLevel, sphericalHarmonicsDegree);
    const bucketsMetaDataSizeBytes = partiallyFilledBucketCount * 4;
    const bucketsStorageSizeBytes = bucketStorageSizeBytes * bucketCount + bucketsMetaDataSizeBytes;
    const storageSizeBytes = bytesPerSplat * maxSplatCount + bucketsStorageSizeBytes;

    sections.push({
      bytesPerSplat,
      splatCountOffset,
      splatCount: splatCount || maxSplatCount,
      maxSplatCount,
      bucketSize,
      bucketCount,
      bucketStorageSizeBytes,
      bucketsStorageSizeBytes,
      compressionScaleRange,
      compressionScaleFactor: bucketBlockSize / 2 / compressionScaleRange,
      base: sectionBase,
      bucketsBase: sectionBase + bucketsMetaDataSizeBytes,
      dataBase: sectionBase + bucketsStorageSizeBytes,
      fullBucketCount,
      partiallyFilledBucketCount,
      sphericalHarmonicsDegree
    });

    sectionBase += storageSizeBytes;
    splatCountOffset += maxSplatCount;
  }

  return sections;
}

/** Decodes one center component, including bucket-relative decompression. */
function decodeKSPLATCenterComponent(
  data: ArrayBuffer,
  splatBase: number,
  component: number,
  header: KSPLATHeader,
  section: KSPLATSection,
  bucketCenter: number
): number {
  const value = readCompressedCenterValue(data, splatBase, component, header.compressionLevel);
  return header.compressionLevel >= 1
    ? (value - section.compressionScaleRange) * section.compressionScaleFactor + bucketCenter
    : value;
}

/** Reads one center component, preserving quantized uint16 values for compressed sections. */
function readCompressedCenterValue(
  data: ArrayBuffer,
  byteOffset: number,
  component: number,
  compressionLevel: 0 | 1 | 2
): number {
  const dataView = new DataView(data);
  return compressionLevel === 0
    ? dataView.getFloat32(byteOffset + component * 4, true)
    : dataView.getUint16(byteOffset + component * 2, true);
}

/** Returns the bucket center for a compressed splat section. */
function getBucketCenter(
  data: ArrayBuffer,
  section: KSPLATSection,
  localSplatIndex: number
): [number, number, number] {
  if (!section.bucketCount) {
    return [0, 0, 0];
  }
  const bucketIndex = getBucketIndex(data, section, localSplatIndex);
  const bucketBase = section.bucketsBase + bucketIndex * section.bucketStorageSizeBytes;
  const dataView = new DataView(data, bucketBase, 12);
  return [dataView.getFloat32(0, true), dataView.getFloat32(4, true), dataView.getFloat32(8, true)];
}

/** Returns the bucket index containing a local splat index. */
function getBucketIndex(
  data: ArrayBuffer,
  section: KSPLATSection,
  localSplatIndex: number
): number {
  const maxSplatIndexInFullBuckets = section.fullBucketCount * section.bucketSize;
  if (localSplatIndex < maxSplatIndexInFullBuckets) {
    return Math.floor(localSplatIndex / section.bucketSize);
  }

  let bucketSplatIndex = maxSplatIndexInFullBuckets;
  let bucketIndex = section.fullBucketCount;
  for (
    let partiallyFilledBucketIndex = 0;
    partiallyFilledBucketIndex < section.partiallyFilledBucketCount;
    partiallyFilledBucketIndex++
  ) {
    const bucketLength = new DataView(
      data,
      section.base + partiallyFilledBucketIndex * 4,
      4
    ).getUint32(0, true);
    if (localSplatIndex < bucketSplatIndex + bucketLength) {
      return bucketIndex;
    }
    bucketSplatIndex += bucketLength;
    bucketIndex++;
  }
  return Math.max(bucketIndex - 1, 0);
}

/** Decodes all SH rest coefficients for one splat into the output array. */
function decodeSphericalHarmonics(
  data: ArrayBuffer,
  byteOffset: number,
  header: KSPLATHeader,
  section: KSPLATSection,
  outputSplatIndex: number,
  output: Float32Array,
  outputComponentCount: number
): void {
  const componentCount = getSphericalHarmonicsComponentCount(section.sphericalHarmonicsDegree);
  const componentBase = outputSplatIndex * outputComponentCount;
  for (let component = 0; component < componentCount; component++) {
    output[componentBase + component] = readCompressedFloat(
      data,
      byteOffset,
      component,
      header.compressionLevel,
      true,
      header.minSphericalHarmonicsCoeff,
      header.maxSphericalHarmonicsCoeff
    );
  }
}

/** Reads one compressed float or spherical harmonic coefficient. */
function readCompressedFloat(
  data: ArrayBuffer,
  byteOffset: number,
  component: number,
  compressionLevel: 0 | 1 | 2,
  sphericalHarmonic: boolean = false,
  sphericalHarmonicRangeMin: number = 0,
  sphericalHarmonicRangeMax: number = 0
): number {
  const dataView = new DataView(data);
  if (compressionLevel === 0) {
    return dataView.getFloat32(byteOffset + component * 4, true);
  }
  if (compressionLevel === 1 || !sphericalHarmonic) {
    return decodeFloat16(dataView.getUint16(byteOffset + component * 2, true));
  }
  const value = dataView.getUint8(byteOffset + component);
  return (
    (value / 255) * (sphericalHarmonicRangeMax - sphericalHarmonicRangeMin) +
    sphericalHarmonicRangeMin
  );
}

/** Returns the byte length of one splat record for a compression level and SH degree. */
function getBytesPerSplat(compressionLevel: 0 | 1 | 2, sphericalHarmonicsDegree: number): number {
  const layout = COMPRESSION_LAYOUTS[compressionLevel];
  return (
    layout.bytesPerCenter +
    layout.bytesPerScale +
    layout.bytesPerRotation +
    layout.bytesPerColor +
    layout.bytesPerSphericalHarmonicsComponent *
      getSphericalHarmonicsComponentCount(sphericalHarmonicsDegree)
  );
}

/** Returns the number of SH rest coefficients for a GaussianSplats3D SH degree. */
function getSphericalHarmonicsComponentCount(sphericalHarmonicsDegree: number): number {
  switch (sphericalHarmonicsDegree) {
    case 0:
      return 0;
    case 1:
      return 9;
    case 2:
      return 24;
    case 3:
      return 45;
    default:
      throw new Error(
        `KSPLATLoader: unsupported spherical harmonics degree ${sphericalHarmonicsDegree}.`
      );
  }
}

/** Returns the active section count in a complete KSPLAT file. */
function getActiveSectionCount(header: KSPLATHeader): number {
  return header.sectionCount || header.maxSectionCount;
}

/** Returns the total number of splats that will be decoded. */
function getTotalSplatCount(header: KSPLATHeader, sections: KSPLATSection[]): number {
  const sectionSplatCount = sections
    .slice(0, getActiveSectionCount(header))
    .reduce((splatCount, section) => splatCount + section.splatCount, 0);
  return header.splatCount
    ? Math.min(header.splatCount, sectionSplatCount || header.splatCount)
    : sectionSplatCount;
}

/** Throws when a section record range extends beyond the file buffer. */
function validateSectionBounds(data: ArrayBuffer, section: KSPLATSection): void {
  const requiredByteLength = section.dataBase + section.bytesPerSplat * section.splatCount;
  if (requiredByteLength > data.byteLength) {
    throw new Error('KSPLATLoader: section data extends beyond the file length.');
  }
}
