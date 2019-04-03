import parse3DTileHeaderSync from './parse-3d-file-header';

const SIZEOF_UINT32 = 4;

class Tile3D {}

/**
 * Represents the contents of a
 * {@link https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification/TileFormats/Batched3DModel|Batched 3D Model}
 * tile in a {@link https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification|3D Tiles} tileset.
 * <p>
 * Implements the {@link Cesium3DTileContent} interface.
 * </p>
 *
 * @alias Batched3DModel3DTileContent
 * @constructor
 *
 * @private
 */
class BatchedModelTile3D extends Tile3D {
  constructor(tileset, tile, resource, arrayBuffer, byteOffset) {
    this._tileset = tileset;
    this._tile = tile;
    this._resource = resource;
    this._model = undefined;
    this._batchTable = undefined;
    this._features = undefined;

    // Populate from gltf when available
    this._batchIdAttributeName = undefined;
    this._diffuseAttributeOrUniformName = {};

    this._rtcCenterTransform = undefined;
    this._contentModelMatrix = undefined;

    this.featurePropertiesDirty = false;

    initialize(this, arrayBuffer, byteOffset);
  }

  get featuresLength() {
    return this._batchTable.featuresLength;
  }

  get pointsLength() {
    return 0;
  }

  get trianglesLength() {
    return this._model.trianglesLength;
  }

  get geometryByteLength() {
    return this._model.geometryByteLength;
  }

  get texturesByteLength() {
    return this._model.texturesByteLength;
  }

  get batchTableByteLength() {
    return this._batchTable.memorySizeInBytes;
  }

  get innerContents() {
    return undefined;
  }

  get readyPromise() {
    return this._model.readyPromise;
  }

  get tileset() {
    return this._tileset;
  }

  get tile() {
    return this._tile;
  }

  get url() {
    return this._resource.getUrlComponent(true);
  }

  get batchTable() {
    return this._batchTable;
  }

  // eslint-disable-next-line max-statements
  parseSync(arrayBuffer, byteOffset = 0) {
    const tileset = content._tileset;
    const tile = content._tile;
    const resource = content._resource;

    const uint8Array = new Uint8Array(arrayBuffer);
    const view = new DataView(arrayBuffer);

    // PARSE HEADER

    // const magic = view.getUint32(byteOffset, true);
    byteOffset += SIZEOF_UINT32; // Skip magic

    const version = view.getUint32(byteOffset, true);
    if (version !== 1) {
      throw new Error('3D Tile Version');
    }
    byteOffset += SIZEOF_UINT32;

    const byteLength = view.getUint32(byteOffset, true);
    byteOffset += SIZEOF_UINT32;

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

    const featureTableBinary = new Uint8Array(
      arrayBuffer,
      byteOffset,
      featureTableBinaryByteLength
    );
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
    content._batchTable = batchTable;

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
  }

  parseFeatureTable() {
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

    const featureTableBinary = new Uint8Array(
      arrayBuffer,
      byteOffset,
      featureTableBinaryByteLength
    );
    byteOffset += featureTableBinaryByteLength;

    const featureTable = parseFeatureTable(featureTableJson, featureTableBinary);

    batchLength = featureTable.getGlobalProperty('BATCH_LENGTH');
    featureTable.featuresLength = batchLength;
  }

  linkToTileset(tileset) {
    var colorChangedCallback;
    if (defined(tileset.classificationType)) {
      colorChangedCallback = createColorChangedCallback(content);
    }
    const pickObject = {
      content: content,
      primitive: tileset
    };
  }

  destroy() {
    // this._batchTable = this._batchTable && this._batchTable.destroy();
    // return destroyObject(this);
  }

  hasProperty(batchId, name) {
    return this._batchTable.hasProperty(batchId, name);
  }

  getFeature(batchId) {
    const featuresLength = this.featuresLength;
    if (!defined(batchId) || batchId < 0 || batchId >= featuresLength) {
      throw new DeveloperError(
        'batchId is required and between zero and featuresLength - 1 (' +
          (featuresLength - 1) +
          ').'
      );
    }

    if (!this._features) {
      this._features = new Array(featuresLength);
      for (var i = 0; i < featuresLength; ++i) {
        this._features[i] = new Tile3DFeature(this, i);
      }

      return this._features[batchId];
    }
  }

  /*
  applyDebugSettings(enabled, color) {
    color = enabled ? color : Color.WHITE;
    if (this.featuresLength === 0) {
      this._model.color = color;
    } else {
      this._batchTable.setAllColor(color);
    }
  };

  applyStyle(style) {
    if (this.featuresLength === 0) {
      var hasColorStyle = defined(style) && defined(style.color);
      var hasShowStyle = defined(style) && defined(style.show);
      this._model.color = hasColorStyle ? style.color.evaluateColor(undefined, scratchColor) : Color.WHITE;
      this._model.show = hasShowStyle ? style.show.evaluate(undefined) : true;
    } else {
      this._batchTable.applyStyle(style);
    }
  }
  */
}

/*
function getBatchIdAttributeName(gltf) {
  let batchIdAttributeName = ModelUtility.getAttributeOrUniformBySemantic(gltf, '_BATCHID');
  if (!defined(batchIdAttributeName)) {
    batchIdAttributeName = ModelUtility.getAttributeOrUniformBySemantic(gltf, 'BATCHID');
    if (defined(batchIdAttributeName)) {
      Batched3DModel3DTileContent._deprecationWarning('b3dm-legacy-batchid', 'The glTF in this b3dm uses the semantic `BATCHID`. Application-specific semantics should be prefixed with an underscore: `_BATCHID`.');
    }
  }
  return batchIdAttributeName;
}

function getVertexShaderCallback(content) {
  return function(vs, programId) {
    const batchTable = content._batchTable;
    const handleTranslucent = !defined(content._tileset.classificationType);

    const gltf = content._model.gltf;
    if (defined(gltf)) {
      content._batchIdAttributeName = getBatchIdAttributeName(gltf);
      content._diffuseAttributeOrUniformName[programId] = ModelUtility.getDiffuseAttributeOrUniform(gltf, programId);
    }

    const callback = batchTable.getVertexShaderCallback(handleTranslucent, content._batchIdAttributeName, content._diffuseAttributeOrUniformName[programId]);
    return defined(callback) ? callback(vs) : vs;
  };
}

function getFragmentShaderCallback(content) {
  return function(fs, programId) {
    var batchTable = content._batchTable;
    var handleTranslucent = !defined(content._tileset.classificationType);

    var gltf = content._model.gltf;
    if (defined(gltf)) {
      content._diffuseAttributeOrUniformName[programId] = ModelUtility.getDiffuseAttributeOrUniform(gltf, programId);
    }
    var callback = batchTable.getFragmentShaderCallback(handleTranslucent, content._diffuseAttributeOrUniformName[programId]);
    return defined(callback) ? callback(fs) : fs;
  };
}

function getPickIdCallback(content) {
  return function() {
    return content._batchTable.getPickId();
  };
}

function getClassificationFragmentShaderCallback(content) {
  return function(fs) {
    var batchTable = content._batchTable;
    var callback = batchTable.getClassificationFragmentShaderCallback();
    return defined(callback) ? callback(fs) : fs;
  };
}

function createColorChangedCallback(content) {
  return function(batchId, color) {
    content._model.updateCommands(batchId, color);
  };
}

*/
