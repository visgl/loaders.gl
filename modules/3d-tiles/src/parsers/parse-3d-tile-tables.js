import {getStringFromTypedArray} from './parse-utils';

// eslint-disable-next-line max-statements
export default function parse3DTileTablesHeaderSync(tile, arrayBuffer, byteOffset) {
  const view = new DataView(arrayBuffer);

  tile.featureTableJsonByteLength = view.getUint32(byteOffset, true);
  byteOffset += SIZEOF_UINT32;

  tile.featureTableBinaryByteLength = view.getUint32(byteOffset, true);
  byteOffset += SIZEOF_UINT32;

  tile.batchTableJsonByteLength = view.getUint32(byteOffset, true);
  byteOffset += SIZEOF_UINT32;

  tile.batchTableBinaryByteLength = view.getUint32(byteOffset, true);
  byteOffset += SIZEOF_UINT32;

  return byteOffset;
}

export default function parse3DTileTablesSync(tile, arrayBuffer, byteOffset, options) {
  const byteStart = byteOffset;

  byteOffset = parse3DTileFeatureTable(tile, arrayBuffer, byteOffset, options);
  byteOffset = parse3DTileBatchTable(tile, arrayBuffer, byteOffset, options);

  byteOffset = parseGLTFView(tile, byteOffset, byteStart)

  return byteOffset
}

function parse3DTileFeatureTable(tile, arrayBuffer, byteOffset, options) {
  const {featureTableJsonByteLength, featureTableBinaryByteLength} = tile;

  let featureTableJson = {
    BATCH_LENGTH: 0
  };

  if (featureTableJsonByteLength > 0) {
    const featureTableString = getStringFromTypedArray(
      uint8Array,
      byteOffset,
      featureTableJsonByteLength
    );
    featureTableJson = JSON.parse(featureTableString);
  }
  byteOffset += featureTableJsonByteLength;

  const featureTableBinary = new Uint8Array(arrayBuffer, byteOffset, featureTableBinaryByteLength);
  byteOffset += featureTableBinaryByteLength;

  const featureTable = parseFeatureTable(featureTableJson, featureTableBinary);

  const batchLength = featureTable.getGlobalProperty('BATCH_LENGTH');
  featureTable.featuresLength = batchLength;

  return byteOffset;
}

function parse3DTileBatchTable(tile, arrayBuffer, byteOffset, options) {
  const {batchTableJsonByteLength, batchTableBinaryByteLength} = tile;

  // PARSE BATCH TABLE
  let batchTableJson;
  let batchTableBinary;
  if (batchTableJsonByteLength > 0) {
    const batchTableString = getStringFromTypedArray(
      uint8Array,
      byteOffset,
      batchTableJsonByteLength
    );
    batchTableJson = JSON.parse(batchTableString);
    byteOffset += batchTableJsonByteLength;

    if (batchTableBinaryByteLength > 0) {
      // Has a batch table binary
      batchTableBinary = new Uint8Array(arrayBuffer, byteOffset, batchTableBinaryByteLength);
      // Copy the batchTableBinary section and let the underlying ArrayBuffer be freed
      batchTableBinary = new Uint8Array(batchTableBinary);
      byteOffset += batchTableBinaryByteLength;
    }
  }

  const batchTable = parseBatchTable(
    content,
    batchLength,
    batchTableJson,
    batchTableBinary,
    colorChangedCallback
  );

  return byteOffset;
}


function parseFeatureTable(tile,
  uint8Array,
  byteOffset,
  featureTableJsonByteLength,
  featureTableBinaryByteLength
) {
  const uint8Array = new Uint8Array(arrayBuffer);
  const view = new DataView(arrayBuffer);
  let featureTableJson;
  if (featureTableJsonByteLength === 0) {
    featureTableJson = {
      BATCH_LENGTH: 0
    };
  } else {
    const featureTableString = getStringFromTypedArray(
      uint8Array,
      byteOffset,
      featureTableJsonByteLength
    );
    featureTableJson = JSON.parse(featureTableString);
  }
  byteOffset += featureTableJsonByteLength;

  const featureTableBinary = new Uint8Array(arrayBuffer, byteOffset, featureTableBinaryByteLength);
  byteOffset += featureTableBinaryByteLength;

  const featureTable = parseFeatureTable(featureTableJson, featureTableBinary);

  const batchLength = featureTable.getGlobalProperty('BATCH_LENGTH');
  featureTable.featuresLength = batchLength;
}

function parseBatchTable(
  uint8Array,
  byteOffset,
  batchTableJsonByteLength,
  batchTableBinaryByteLength
) {
  // PARSE BATCH TABLE
  let batchTableJson;
  let batchTableBinary;
  if (batchTableJsonByteLength > 0) {
    const batchTableString = getStringFromTypedArray(
      uint8Array,
      byteOffset,
      batchTableJsonByteLength
    );
    batchTableJson = JSON.parse(batchTableString);
    byteOffset += batchTableJsonByteLength;

    if (batchTableBinaryByteLength > 0) {
      // Has a batch table binary
      batchTableBinary = new Uint8Array(arrayBuffer, byteOffset, batchTableBinaryByteLength);
      // Copy the batchTableBinary section and let the underlying ArrayBuffer be freed
      batchTableBinary = new Uint8Array(batchTableBinary);
      byteOffset += batchTableBinaryByteLength;
    }
  }

  const batchTable = parseBatchTable(
    content,
    batchLength,
    batchTableJson,
    batchTableBinary,
    colorChangedCallback
  );
}
