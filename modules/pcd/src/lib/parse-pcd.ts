// PCD Loader, adapted from THREE.js (MIT license)
//
// Attributions per original THREE.js source file:
//
// @author Filipe Caixeta / http://filipecaixeta.com.br
// @author Mugen87 / https://github.com/Mugen87
//
// Description: A loader for PCD ascii and binary files.
// Limitations: Compressed binary files are not supported.

import {Schema, Field, Float32, Uint8, FixedSizeList} from '@loaders.gl/schema';
import {getMeshBoundingBox} from '@loaders.gl/loader-utils';
import {SchemaMetadata} from '@loaders.gl/schema/lib/schema/classes/schema';

type IncomingHeader = {
  data: any;
  headerLen: number;
  str: string;
  version: RegExpExecArray | null | number;
  fields: RegExpExecArray | null | string[];
  size: RegExpExecArray | null | number[];
  type: RegExpExecArray | null | string[];
  count: RegExpExecArray | null | number[];
  width: RegExpExecArray | number;
  height: RegExpExecArray | number;
  viewpoint: RegExpExecArray | null | string;
  points: RegExpExecArray | number;
  offset: {[index: string]: number};
  rowSize: number;
  boundingBox?: [];
};
type Normalized = {
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
  [index: string]: number[];
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

  attributes = getNormalizedAttributes(attributes);

  const header = getNormalizedHeader(pcdHeader, attributes);

  const metadata = new Map([
    ['mode', '0'],
    ['boundingBox', JSON.stringify(header.boundingBox)]
  ]);

  const schema = getSchemaFromPCDHeader(pcdHeader, metadata);

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
function getNormalizedHeader(PCDheader: IncomingHeader, attributes: Normalized) {
  if (typeof PCDheader.width === 'number' && typeof PCDheader.height === 'number') {
    const pointCount = PCDheader.width * PCDheader.height; // Supports "organized" point sets
    return {
      vertexCount: pointCount,
      boundingBox: getMeshBoundingBox(attributes)
    };
  }
  return PCDheader;
}

/**
 * @param attributes
 * @returns Normalized attributes
 */
function getNormalizedAttributes(attributes: HeaderAttributes): Normalized {
  const normalizedAttributes: Normalized = {
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
function parsePCDHeader(data: string): IncomingHeader {
  const result1 = data.search(/[\r\n]DATA\s(\S*)\s/i);
  const result2 = /[\r\n]DATA\s(\S*)\s/i.exec(data.substr(result1 - 1));

  const PCDheader: any = {};
  PCDheader.data = result2 && result2[1];
  if (result2 !== null) {
    PCDheader.headerLen = (result2 && result2[0].length) + result1;
  }
  PCDheader.str = data.substr(0, PCDheader.headerLen);

  // remove comments

  PCDheader.str = PCDheader.str.replace(/\#.*/gi, '');

  // parse

  PCDheader.version = /VERSION (.*)/i.exec(PCDheader.str);
  PCDheader.fields = /FIELDS (.*)/i.exec(PCDheader.str);
  PCDheader.size = /SIZE (.*)/i.exec(PCDheader.str);
  PCDheader.type = /TYPE (.*)/i.exec(PCDheader.str);
  PCDheader.count = /COUNT (.*)/i.exec(PCDheader.str);
  PCDheader.width = /WIDTH (.*)/i.exec(PCDheader.str);
  PCDheader.height = /HEIGHT (.*)/i.exec(PCDheader.str);
  PCDheader.viewpoint = /VIEWPOINT (.*)/i.exec(PCDheader.str);
  PCDheader.points = /POINTS (.*)/i.exec(PCDheader.str);

  // evaluate

  if (PCDheader.version !== null) {
    PCDheader.version = parseFloat(PCDheader.version[1]);
  }

  if (PCDheader.fields !== null) {
    PCDheader.fields = PCDheader.fields[1].split(' ');
  }

  if (PCDheader.type !== null) {
    PCDheader.type = PCDheader.type[1].split(' ');
  }

  if (PCDheader.width !== null) {
    PCDheader.width = parseInt(PCDheader.width[1], 10);
  }

  if (PCDheader.height !== null) {
    PCDheader.height = parseInt(PCDheader.height[1], 10);
  }

  if (PCDheader.viewpoint !== null) {
    PCDheader.viewpoint = PCDheader.viewpoint[1];
  }

  if (PCDheader.points !== null) {
    PCDheader.points = parseInt(PCDheader.points[1], 10);
  }

  if (
    PCDheader.points === null &&
    typeof PCDheader.width === 'number' &&
    typeof PCDheader.height === 'number'
  ) {
    PCDheader.points = PCDheader.width * PCDheader.height;
  }

  if (PCDheader.size !== null) {
    PCDheader.size = PCDheader.size[1].split(' ').map((x) => parseInt(x, 10));
  }

  if (PCDheader.count !== null) {
    PCDheader.count = PCDheader.count[1].split(' ').map((x) => parseInt(x, 10));
  } else {
    PCDheader.count = [];
    if (PCDheader.fields !== null) {
      for (let i = 0; i < PCDheader.fields.length; i++) {
        PCDheader.count.push(1);
      }
    }
  }

  PCDheader.offset = {};

  let sizeSum = 0;
  if (PCDheader.fields !== null && PCDheader.size !== null) {
    for (let i = 0; i < PCDheader.fields.length; i++) {
      if (PCDheader.data === 'ascii') {
        PCDheader.offset[PCDheader.fields[i]] = i;
      } else {
        PCDheader.offset[PCDheader.fields[i]] = sizeSum;
        sizeSum += PCDheader.size[i];
      }
    }
  }

  // for binary only
  PCDheader.rowSize = sizeSum;

  return PCDheader;
}
/**
 * @param PCDheader
 * @param textData
 * @returns [attributes]
 */
/* eslint-enable complexity, max-statements */
function parsePCDASCII(PCDheader: IncomingHeader, textData: string): HeaderAttributes {
  const position: number[] = [];
  const normal: number[] = [];
  const color: number[] = [];

  const offset = PCDheader.offset;
  const pcdData = textData.substr(PCDheader.headerLen);
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
 * @param PCDheader
 * @param data
 * @returns [attributes]
 */
function parsePCDBinary(PCDheader: IncomingHeader, data: ArrayBufferLike): HeaderAttributes {
  const position: number[] = [];
  const normal: number[] = [];
  const color: number[] = [];

  const dataview = new DataView(data, PCDheader.headerLen);
  const offset = PCDheader.offset;

  for (let i = 0, row = 0; i < PCDheader.points; i++, row += PCDheader.rowSize) {
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
/**
 * Gets schema from PCD header
 * @param PCDheader
 * @param metadata
 * @returns Schema
 */
function getSchemaFromPCDHeader(PCDheader: IncomingHeader, metadata: SchemaMetadata): Schema {
  const offset = PCDheader.offset;

  const fields: Field[] = [];

  if (offset.x !== undefined) {
    fields.push(
      new Field('POSITION', new FixedSizeList(3, new Field('xyz', new Float32())), false)
    );
  }

  if (offset.normal_x !== undefined) {
    fields.push(new Field('NORMAL', new FixedSizeList(3, new Field('xyz', new Float32())), false));
  }

  if (offset.rgb !== undefined) {
    fields.push(new Field('COLOR_0', new FixedSizeList(3, new Field('rgb', new Uint8())), false));
  }

  return new Schema(fields, metadata);
}
