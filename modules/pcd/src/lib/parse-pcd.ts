// PCD Loader, adapted from THREE.js (MIT license)
// Description: A loader for PCD ascii and binary files.
// Limitations: Compressed binary files are not supported.
//
// Attributions per original THREE.js source file:
// @author Filipe Caixeta / http://filipecaixeta.com.br
// @author Mugen87 / https://github.com/Mugen87

import {getMeshBoundingBox} from '@loaders.gl/schema';
import type {MeshAttribute, MeshAttributes} from '@loaders.gl/schema';
import type {PCDHeader} from './pcd-types';
import {getPCDSchema} from './get-pcd-schema';

type NormalizedAttributes = {
  POSITION: {
    value: Float32Array;
    size: number;
  };
  NORMAL?: {
    value: Float32Array;
    size: number;
  };
  COLOR_0?: {
    value: Uint8Array;
    size: number;
  };
};

type HeaderAttributes = {
  [attributeName: string]: number[];
};

const LITTLE_ENDIAN: boolean = true;

/**
 *
 * @param data
 * @returns
 */
export default function parsePCD(data: ArrayBufferLike) {
  // parse header (always ascii format)
  const textData = new TextDecoder().decode(data);
  const pcdHeader = parsePCDHeader(textData);

  let attributes: any = {};

  // parse data
  switch (pcdHeader.data) {
    case 'ascii':
      attributes = parsePCDASCII(pcdHeader, textData);
      break;

    case 'binary':
      attributes = parsePCDBinary(pcdHeader, data);
      break;

    case 'binary_compressed':
    default:
      throw new Error(`PCD: ${pcdHeader.data} files are not supported`);
  }

  attributes = getMeshAttributes(attributes);

  const header = getMeshHeader(pcdHeader, attributes);

  const metadata = new Map([
    ['mode', '0'],
    ['boundingBox', JSON.stringify(header.boundingBox)]
  ]);

  const schema = getPCDSchema(pcdHeader, metadata);

  return {
    loaderData: {
      header: pcdHeader
    },
    header,
    schema,
    mode: 0, // POINTS
    indices: null,
    attributes
  };
}

// Create a header that contains common data for PointCloud category loaders
function getMeshHeader(pcdHeader: PCDHeader, attributes: NormalizedAttributes): Partial<PCDHeader> {
  if (typeof pcdHeader.width === 'number' && typeof pcdHeader.height === 'number') {
    const pointCount = pcdHeader.width * pcdHeader.height; // Supports "organized" point sets
    return {
      vertexCount: pointCount,
      boundingBox: getMeshBoundingBox(attributes)
    };
  }
  return pcdHeader;
}

/**
 * @param attributes
 * @returns Normalized attributes
 */
function getMeshAttributes(attributes: HeaderAttributes): {[attributeName: string]: MeshAttribute} {
  const normalizedAttributes: MeshAttributes = {
    POSITION: {
      // Binary PCD is only 32 bit
      value: new Float32Array(attributes.position),
      size: 3
    }
  };

  if (attributes.normal && attributes.normal.length > 0) {
    normalizedAttributes.NORMAL = {
      value: new Float32Array(attributes.normal),
      size: 3
    };
  }

  if (attributes.color && attributes.color.length > 0) {
    // TODO - RGBA
    normalizedAttributes.COLOR_0 = {
      value: new Uint8Array(attributes.color),
      size: 3
    };
  }

  return normalizedAttributes;
}

/**
 * Incoming data parsing
 * @param data
 * @returns Header
 */
/* eslint-disable complexity, max-statements */
function parsePCDHeader(data: string): PCDHeader {
  const result1 = data.search(/[\r\n]DATA\s(\S*)\s/i);
  const result2 = /[\r\n]DATA\s(\S*)\s/i.exec(data.substr(result1 - 1));

  const pcdHeader: any = {};
  pcdHeader.data = result2 && result2[1];
  if (result2 !== null) {
    pcdHeader.headerLen = (result2 && result2[0].length) + result1;
  }
  pcdHeader.str = data.substr(0, pcdHeader.headerLen);

  // remove comments

  pcdHeader.str = pcdHeader.str.replace(/\#.*/gi, '');

  // parse

  pcdHeader.version = /VERSION (.*)/i.exec(pcdHeader.str);
  pcdHeader.fields = /FIELDS (.*)/i.exec(pcdHeader.str);
  pcdHeader.size = /SIZE (.*)/i.exec(pcdHeader.str);
  pcdHeader.type = /TYPE (.*)/i.exec(pcdHeader.str);
  pcdHeader.count = /COUNT (.*)/i.exec(pcdHeader.str);
  pcdHeader.width = /WIDTH (.*)/i.exec(pcdHeader.str);
  pcdHeader.height = /HEIGHT (.*)/i.exec(pcdHeader.str);
  pcdHeader.viewpoint = /VIEWPOINT (.*)/i.exec(pcdHeader.str);
  pcdHeader.points = /POINTS (.*)/i.exec(pcdHeader.str);

  // evaluate

  if (pcdHeader.version !== null) {
    pcdHeader.version = parseFloat(pcdHeader.version[1]);
  }

  if (pcdHeader.fields !== null) {
    pcdHeader.fields = pcdHeader.fields[1].split(' ');
  }

  if (pcdHeader.type !== null) {
    pcdHeader.type = pcdHeader.type[1].split(' ');
  }

  if (pcdHeader.width !== null) {
    pcdHeader.width = parseInt(pcdHeader.width[1], 10);
  }

  if (pcdHeader.height !== null) {
    pcdHeader.height = parseInt(pcdHeader.height[1], 10);
  }

  if (pcdHeader.viewpoint !== null) {
    pcdHeader.viewpoint = pcdHeader.viewpoint[1];
  }

  if (pcdHeader.points !== null) {
    pcdHeader.points = parseInt(pcdHeader.points[1], 10);
  }

  if (
    pcdHeader.points === null &&
    typeof pcdHeader.width === 'number' &&
    typeof pcdHeader.height === 'number'
  ) {
    pcdHeader.points = pcdHeader.width * pcdHeader.height;
  }

  if (pcdHeader.size !== null) {
    pcdHeader.size = pcdHeader.size[1].split(' ').map((x) => parseInt(x, 10));
  }

  if (pcdHeader.count !== null) {
    pcdHeader.count = pcdHeader.count[1].split(' ').map((x) => parseInt(x, 10));
  } else {
    pcdHeader.count = [];
    if (pcdHeader.fields !== null) {
      for (let i = 0; i < pcdHeader.fields.length; i++) {
        pcdHeader.count.push(1);
      }
    }
  }

  pcdHeader.offset = {};

  let sizeSum = 0;
  if (pcdHeader.fields !== null && pcdHeader.size !== null) {
    for (let i = 0; i < pcdHeader.fields.length; i++) {
      if (pcdHeader.data === 'ascii') {
        pcdHeader.offset[pcdHeader.fields[i]] = i;
      } else {
        pcdHeader.offset[pcdHeader.fields[i]] = sizeSum;
        sizeSum += pcdHeader.size[i];
      }
    }
  }

  // for binary only
  pcdHeader.rowSize = sizeSum;

  return pcdHeader;
}

/**
 * @param pcdHeader
 * @param textData
 * @returns [attributes]
 */
/* eslint-enable complexity, max-statements */
function parsePCDASCII(pcdHeader: PCDHeader, textData: string): HeaderAttributes {
  const position: number[] = [];
  const normal: number[] = [];
  const color: number[] = [];

  const offset = pcdHeader.offset;
  const pcdData = textData.substr(pcdHeader.headerLen);
  const lines = pcdData.split('\n');

  for (let i = 0; i < lines.length; i++) {
    if (lines[i] !== '') {
      const line = lines[i].split(' ');

      if (offset.x !== undefined) {
        position.push(parseFloat(line[offset.x]));
        position.push(parseFloat(line[offset.y]));
        position.push(parseFloat(line[offset.z]));
      }

      if (offset.rgb !== undefined) {
        const floatValue = parseFloat(line[offset.rgb]);
        const binaryColor = new Float32Array([floatValue]);
        const dataview = new DataView(binaryColor.buffer, 0);
        color.push(dataview.getUint8(0));
        color.push(dataview.getUint8(1));
        color.push(dataview.getUint8(2));
        // TODO - handle alpha channel / RGBA?
      }

      if (offset.normal_x !== undefined) {
        normal.push(parseFloat(line[offset.normal_x]));
        normal.push(parseFloat(line[offset.normal_y]));
        normal.push(parseFloat(line[offset.normal_z]));
      }
    }
  }

  return {position, normal, color};
}

/**
 * @param pcdHeader
 * @param data
 * @returns [attributes]
 */
function parsePCDBinary(pcdHeader: PCDHeader, data: ArrayBufferLike): HeaderAttributes {
  const position: number[] = [];
  const normal: number[] = [];
  const color: number[] = [];

  const dataview = new DataView(data, pcdHeader.headerLen);
  const offset = pcdHeader.offset;

  for (let i = 0, row = 0; i < pcdHeader.points; i++, row += pcdHeader.rowSize) {
    if (offset.x !== undefined) {
      position.push(dataview.getFloat32(row + offset.x, LITTLE_ENDIAN));
      position.push(dataview.getFloat32(row + offset.y, LITTLE_ENDIAN));
      position.push(dataview.getFloat32(row + offset.z, LITTLE_ENDIAN));
    }

    if (offset.rgb !== undefined) {
      color.push(dataview.getUint8(row + offset.rgb + 0));
      color.push(dataview.getUint8(row + offset.rgb + 1));
      color.push(dataview.getUint8(row + offset.rgb + 2));
    }

    if (offset.normal_x !== undefined) {
      normal.push(dataview.getFloat32(row + offset.normal_x, LITTLE_ENDIAN));
      normal.push(dataview.getFloat32(row + offset.normal_y, LITTLE_ENDIAN));
      normal.push(dataview.getFloat32(row + offset.normal_z, LITTLE_ENDIAN));
    }
  }

  return {position, normal, color};
}
