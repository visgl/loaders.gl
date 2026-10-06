// loaders.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {XMLParser, XMLValidator} from 'fast-xml-parser';
import {UnsupportedTiffEncodingError} from './decode-tiff-samples';

/** Parses small, already-budgeted GDAL XML into explicit image and original-band records. */
export function parseTiffGDALMetadata(
  xml: string | undefined,
  bandCount: number
): {
  /** Image-level values, or null when absent. */
  metadata: Record<string, unknown> | null;
  /** Original-band values, or null for each band without metadata. */
  bandMetadata: (Record<string, unknown> | null)[];
} {
  const metadata: Record<string, unknown> = {};
  const bandMetadata = Array.from({length: bandCount}, () => ({}) as Record<string, unknown>);
  if (xml !== undefined) {
    if (XMLValidator.validate(xml) !== true) throw new Error('Invalid TIFF GDAL XML');
    if (/<!DOCTYPE/i.test(xml))
      throw new UnsupportedTiffEncodingError('TIFF GDAL XML document type');
    const parsed = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      parseTagValue: false,
      parseAttributeValue: false,
      trimValues: false,
      processEntities: false
    }).parse(xml);
    if (
      !Object.hasOwn(parsed, 'GDALMetadata') ||
      (parsed.GDALMetadata !== '' && typeof parsed.GDALMetadata !== 'object')
    )
      throw new Error('Invalid TIFF GDAL metadata root');
    const items = parsed.GDALMetadata?.Item;
    for (const item of items === undefined ? [] : Array.isArray(items) ? items : [items]) {
      if (typeof item.name !== 'string') throw new Error('Invalid TIFF GDAL metadata item');
      if (Object.values(item).some(value => typeof value === 'object'))
        throw new UnsupportedTiffEncodingError('Nested TIFF GDAL metadata');
      const hasBand = item.sample !== undefined;
      const band = Number(item.sample);
      if (hasBand && (!Number.isSafeInteger(band) || band < 0 || band >= bandCount))
        throw new Error('Invalid TIFF GDAL metadata band');
      const target = hasBand ? bandMetadata[band] : metadata;
      Object.defineProperty(target, item.name, {
        value: String(item['#text'] ?? ''),
        enumerable: true,
        configurable: true,
        writable: true
      });
    }
  }
  return {
    metadata: xml === undefined ? null : metadata,
    bandMetadata: bandMetadata.map(values => (xml === undefined ? null : values))
  };
}
