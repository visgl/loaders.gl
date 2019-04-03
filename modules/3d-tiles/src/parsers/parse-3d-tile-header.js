// This code is inspired by

const SIZEOF_UINT32 = 4;

// eslint-disable-next-line max-statements
export function parse3DTileHeaderSync(arrayBuffer, byteOffset = 0) {
  const uint8Array = new Uint8Array(arrayBuffer);
  const view = new DataView(arrayBuffer);

  // PARSE FIXED HEADER

  const magic = view.getUint32(byteOffset, true);
  const magicString = getMagicString(dataView);
  byteOffset += SIZEOF_UINT32;

  const version = view.getUint32(byteOffset, true);
  if (version !== 1) {
    throw new Error('3D Tile Version');
  }
  byteOffset += SIZEOF_UINT32;

  const byteLength = view.getUint32(byteOffset, true);
  byteOffset += SIZEOF_UINT32;

  return {
    // FIXED HEADER
    magic, // identifies type of tile
    magicString, // String version of magic
    version,
    byteLength,

    // ADDITIONAL DATA
    byteOffset // Indicates where the parsing ended
  };
}

export default function parse3DTileTablesSync(header, arrayBuffer, byteOffset = 0) {
  const uint8Array = new Uint8Array(arrayBuffer);
  const view = new DataView(arrayBuffer);

  const featureTableJsonByteLength = view.getUint32(byteOffset, true);
  byteOffset += SIZEOF_UINT32;

  const featureTableBinaryByteLength = view.getUint32(byteOffset, true);
  byteOffset += SIZEOF_UINT32;

  const batchTableJsonByteLength = view.getUint32(byteOffset, true);
  byteOffset += SIZEOF_UINT32;

  const batchTableBinaryByteLength = view.getUint32(byteOffset, true);
  byteOffset += SIZEOF_UINT32;

  // PARSE FEATURE TABLE
  let batchLength;

  let featureTableJson;
  if (featureTableJsonByteLength === 0) {
    featureTableJson = {
      BATCH_LENGTH: batchLength || 0
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

  batchLength = featureTable.getGlobalProperty('BATCH_LENGTH');
  featureTable.featuresLength = batchLength;

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

  const gltfByteLength = byteStart + byteLength - byteOffset;
  if (gltfByteLength === 0) {
    throw new RuntimeError('glTF byte length must be greater than 0.');
  }

  let gltfView;
  if (byteOffset % 4 === 0) {
    gltfView = new Uint8Array(arrayBuffer, byteOffset, gltfByteLength);
  } else {
    // Create a copy of the glb so that it is 4-byte aligned
    log.warn('b3dm: embedded glb is not aligned to a 4-byte boundary.');
    gltfView = new Uint8Array(uint8Array.subarray(byteOffset, byteOffset + gltfByteLength));
  }

  content._rtcCenterTransform = Matrix4.IDENTITY;
  const rtcCenter = featureTable.getGlobalProperty('RTC_CENTER', ComponentDatatype.FLOAT, 3);
  if (defined(rtcCenter)) {
    content._rtcCenterTransform = Matrix4.fromTranslation(Cartesian3.fromArray(rtcCenter));
  }

  content._contentModelMatrix = Matrix4.multiply(
    tile.computedTransform,
    content._rtcCenterTransform,
    new Matrix4()
  );

  return {
    // FIXED HEADER
    magic, // identifies type of tile
    version,
    byteLength,

    featureTable,
    batchTable
  };
}

function parseFeatureTable(
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

function getStringFromTypedArray() {
  // Decode the JSON binary array into clear text
  const textDecoder = new TextDecoder('utf8');
  const jsonText = textDecoder.decode(jsonChunk);
  return jsonText;
}

function getMagicString(dataView) {
  return `\
${String.fromCharCode(dataView.getUint8(0))}\
${String.fromCharCode(dataView.getUint8(1))}\
${String.fromCharCode(dataView.getUint8(2))}\
${String.fromCharCode(dataView.getUint8(3))}`;
}
