// loaders.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {TiffDirectory} from './tiff-types';
import type {TiffNumericImage} from './tiff-numeric-decoder';
import {parseTiffGDALMetadata} from './tiff-gdal-metadata';
import {getTiffDimension, getTiffNumbers} from './plan-tiff-blocks';
import {UnsupportedTiffEncodingError} from './decode-tiff-samples';

/** TIFF 6.0 and GeoTIFF/GDAL identifiers required by the initial numeric support matrix. */
const TAG_NAMES: Readonly<Record<number, string>> = {
  254: 'NewSubfileType',
  255: 'SubfileType',
  256: 'ImageWidth',
  257: 'ImageLength',
  258: 'BitsPerSample',
  259: 'Compression',
  262: 'PhotometricInterpretation',
  263: 'Threshholding',
  264: 'CellWidth',
  265: 'CellLength',
  266: 'FillOrder',
  269: 'DocumentName',
  270: 'ImageDescription',
  271: 'Make',
  272: 'Model',
  273: 'StripOffsets',
  274: 'Orientation',
  277: 'SamplesPerPixel',
  278: 'RowsPerStrip',
  279: 'StripByteCounts',
  280: 'MinSampleValue',
  281: 'MaxSampleValue',
  282: 'XResolution',
  283: 'YResolution',
  284: 'PlanarConfiguration',
  285: 'PageName',
  286: 'XPosition',
  287: 'YPosition',
  288: 'FreeOffsets',
  289: 'FreeByteCounts',
  290: 'GrayResponseUnit',
  291: 'GrayResponseCurve',
  296: 'ResolutionUnit',
  297: 'PageNumber',
  301: 'TransferFunction',
  305: 'Software',
  306: 'DateTime',
  315: 'Artist',
  316: 'HostComputer',
  317: 'Predictor',
  318: 'WhitePoint',
  319: 'PrimaryChromaticities',
  320: 'ColorMap',
  322: 'TileWidth',
  323: 'TileLength',
  324: 'TileOffsets',
  325: 'TileByteCounts',
  330: 'SubIFDs',
  338: 'ExtraSamples',
  339: 'SampleFormat',
  340: 'SMinSampleValue',
  341: 'SMaxSampleValue',
  532: 'ReferenceBlackWhite',
  33432: 'Copyright',
  33550: 'ModelPixelScale',
  33922: 'ModelTiepoint',
  34264: 'ModelTransformation',
  34735: 'GeoKeyDirectory',
  34736: 'GeoDoubleParams',
  34737: 'GeoAsciiParams',
  42112: 'GDAL_METADATA',
  42113: 'GDAL_NODATA'
};

/** GeoTIFF key names interpreted by the initial core; unknown keys use the compatibility metadata adapter. */
const GEO_KEY_NAMES: Readonly<Record<number, string>> = {
  1024: 'GTModelTypeGeoKey',
  1025: 'GTRasterTypeGeoKey',
  1026: 'GTCitationGeoKey',
  2048: 'GeographicTypeGeoKey',
  2049: 'GeogCitationGeoKey',
  2050: 'GeogGeodeticDatumGeoKey',
  2051: 'GeogPrimeMeridianGeoKey',
  2052: 'GeogLinearUnitsGeoKey',
  2053: 'GeogLinearUnitSizeGeoKey',
  2054: 'GeogAngularUnitsGeoKey',
  2055: 'GeogAngularUnitSizeGeoKey',
  2056: 'GeogEllipsoidGeoKey',
  2057: 'GeogSemiMajorAxisGeoKey',
  2058: 'GeogSemiMinorAxisGeoKey',
  2059: 'GeogInvFlatteningGeoKey',
  2060: 'GeogAzimuthUnitsGeoKey',
  2061: 'GeogPrimeMeridianLongGeoKey',
  3072: 'ProjectedCSTypeGeoKey',
  3073: 'PCSCitationGeoKey',
  3074: 'ProjectionGeoKey',
  3075: 'ProjCoordTransGeoKey',
  3076: 'ProjLinearUnitsGeoKey',
  3077: 'ProjLinearUnitSizeGeoKey',
  4096: 'VerticalCSTypeGeoKey',
  4097: 'VerticalCitationGeoKey',
  4098: 'VerticalDatumGeoKey',
  4099: 'VerticalUnitsGeoKey'
};

/** Tags represented as arrays even for one value, matching the established numeric metadata shape. */
const ARRAY_TAGS = new Set([
  258, 273, 279, 288, 289, 291, 297, 301, 318, 319, 320, 324, 325, 330, 338, 339, 532, 33550, 33922,
  34264, 34735, 34736
]);

/** Interprets known TIFF/GeoTIFF metadata without color conversion or physical sample scaling. */
export function readTiffMetadata(
  directory: TiffDirectory
): Omit<TiffNumericImage, 'width' | 'height' | 'bandCount' | 'readSamples'> {
  const fileDirectory: Record<string, unknown> = {};
  for (const [tag, values] of directory.tags) {
    const name = TAG_NAMES[tag];
    if (!name)
      throw new UnsupportedTiffEncodingError(
        `TIFF metadata tag ${tag} requires the compatibility decoder`
      );
    fileDirectory[name] =
      typeof values === 'string' || ARRAY_TAGS.has(tag)
        ? values
        : values.length === 1
          ? values[0]
          : values;
  }
  const gdalXML = directory.tags.get(42112);
  if (gdalXML !== undefined && typeof gdalXML !== 'string')
    throw new Error('Invalid TIFF GDAL metadata type');
  const noDataText = directory.tags.get(42113);
  if (noDataText !== undefined && typeof noDataText !== 'string')
    throw new Error('Invalid TIFF nodata type');
  if (typeof noDataText === 'string' && !noDataText.trim())
    throw new Error('Empty TIFF nodata declaration');
  const noData = typeof noDataText === 'string' ? Number(noDataText) : null;
  if (
    typeof noDataText === 'string' &&
    Number.isNaN(noData) &&
    noDataText.trim().toLowerCase() !== 'nan'
  )
    throw new Error('Invalid TIFF nodata declaration');
  return {
    fileDirectory,
    geoKeys: readGeoKeys(directory),
    noData,
    ...parseTiffGDALMetadata(gdalXML, getTiffDimension(directory, 277, 1))
  };
}

/** Resolves GeoKey storage locations with checked counts, original axis metadata, and no guessed CRS. */
function readGeoKeys(directory: TiffDirectory): Record<string, unknown> | null {
  if (!directory.tags.has(34735)) return null;
  const entries = getTiffNumbers(directory, 34735);
  if (
    entries.length < 4 ||
    entries[0] !== 1 ||
    entries[1] !== 1 ||
    ![0, 1].includes(entries[2]) ||
    !Number.isInteger(entries[3]) ||
    entries[3] < 0 ||
    entries.length < 4 + entries[3] * 4
  )
    throw new Error('Invalid GeoTIFF key directory');
  const keys: Record<string, unknown> = {};
  for (let index = 0; index < entries[3]; index++) {
    const [identifier, location, count, offset] = entries.slice(4 + index * 4, 8 + index * 4);
    const name = GEO_KEY_NAMES[identifier];
    if (!name)
      throw new UnsupportedTiffEncodingError(
        `GeoTIFF key ${identifier} requires the compatibility decoder`
      );
    if (
      name in keys ||
      !Number.isSafeInteger(count) ||
      count <= 0 ||
      !Number.isSafeInteger(offset) ||
      offset < 0
    )
      throw new Error('Invalid or duplicate GeoTIFF key');
    if (location === 0) {
      if (count !== 1) throw new Error('Invalid inline GeoTIFF key count');
      keys[name] = offset;
    } else {
      if (![34735, 34736, 34737].includes(location))
        throw new Error('Invalid GeoTIFF key location');
      const values = directory.tags.get(location);
      if (values === undefined || offset > values.length || count > values.length - offset)
        throw new Error('Truncated GeoTIFF key value');
      const value = values.slice(offset, offset + count);
      keys[name] =
        typeof value === 'string'
          ? value.replace(/[|\0]+$/, '')
          : value.length === 1
            ? value[0]
            : value;
    }
  }
  return keys;
}
