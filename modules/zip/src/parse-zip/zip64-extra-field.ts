// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** ZIP64 extra-field header identifier. */
const ZIP64_EXTRA_FIELD_ID = 0x0001;

/** Sentinel indicating that a 16-bit ZIP header value is stored in ZIP64 data. */
export const ZIP64_UINT16_SENTINEL = 0xffffn;

/** Sentinel indicating that a 32-bit ZIP header value is stored in ZIP64 data. */
export const ZIP64_UINT32_SENTINEL = 0xffffffffn;

/** Description of a value stored in a ZIP64 extended information extra field. */
export type Zip64ExtraFieldDescription<FieldName extends string> = {
  /** Name used for the decoded value. */
  name: FieldName;
  /** Encoded value width in bytes. */
  byteLength: 4 | 8;
};

/**
 * Finds and decodes the ZIP64 record in a sequence of ZIP extra-field records.
 * @param extraField complete extra-field data from a local or central-directory header
 * @param expectedFields ZIP64 values required by sentinel fields in the legacy header
 * @returns decoded ZIP64 values keyed by the supplied field names
 * @throws If required ZIP64 data is missing, truncated, or has an unexpected size
 */
export function parseZip64ExtraField<FieldName extends string>(
  extraField: DataView,
  expectedFields: readonly Zip64ExtraFieldDescription<FieldName>[]
): Partial<Record<FieldName, bigint>> {
  const values: Partial<Record<FieldName, bigint>> = {};
  if (expectedFields.length === 0) {
    return values;
  }

  const expectedPayloadLength = expectedFields.reduce(
    (totalByteLength, field) => totalByteLength + field.byteLength,
    0
  );
  let recordOffset = 0;

  while (recordOffset < extraField.byteLength) {
    if (recordOffset + 4 > extraField.byteLength) {
      throw new Error(
        'Invalid ZIP archive: truncated extra-field record header while reading ZIP64 data'
      );
    }

    const headerId = extraField.getUint16(recordOffset, true);
    const payloadLength = extraField.getUint16(recordOffset + 2, true);
    const payloadOffset = recordOffset + 4;
    const nextRecordOffset = payloadOffset + payloadLength;

    if (nextRecordOffset > extraField.byteLength) {
      throw new Error(
        'Invalid ZIP archive: truncated extra-field record payload while reading ZIP64 data'
      );
    }

    if (headerId === ZIP64_EXTRA_FIELD_ID) {
      if (payloadLength !== expectedPayloadLength) {
        throw new Error(
          'Invalid ZIP archive: ZIP64 extended information has an unexpected payload size'
        );
      }

      let fieldOffset = payloadOffset;
      for (const field of expectedFields) {
        values[field.name] =
          field.byteLength === 8
            ? extraField.getBigUint64(fieldOffset, true)
            : BigInt(extraField.getUint32(fieldOffset, true));
        fieldOffset += field.byteLength;
      }
      return values;
    }

    recordOffset = nextRecordOffset;
  }

  throw new Error('Invalid ZIP archive: required ZIP64 extended information is missing');
}
